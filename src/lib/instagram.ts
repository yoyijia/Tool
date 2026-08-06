import type { InstagramPostRef } from "../types";

/** Shared HTML fetch used by analysis + Instagram ingest. */
async function fetchHtml(url: string): Promise<string> {
  if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "FETCH_PAGE",
        url,
      });
      if (response?.ok && typeof response.html === "string") return response.html;
    } catch {
      /* fall through */
    }
  }

  if (typeof window !== "undefined") {
    try {
      const res = await fetch(`/api/fetch-page?url=${encodeURIComponent(url)}`);
      if (res.ok) return res.text();
    } catch {
      /* fall through */
    }
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export function extractInstagramHandle(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("@")) return trimmed.slice(1).replace(/\/$/, "");

  try {
    const u = new URL(
      /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`,
    );
    if (!/(^|\.)instagram\.com$/i.test(u.hostname)) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (!parts.length) return null;
    if (["p", "reel", "reels", "tv", "stories"].includes(parts[0]!.toLowerCase())) {
      return null;
    }
    return parts[0]!.replace(/^@/, "");
  } catch {
    return trimmed.replace(/^@/, "").split(/[/?#]/)[0] || null;
  }
}

export function extractShortcode(url: string): string | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((p) =>
      ["p", "reel", "reels", "tv"].includes(p.toLowerCase()),
    );
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1]!;
  } catch {
    /* ignore */
  }
  return null;
}

export function normalizePostUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(
      /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`,
    );
    if (!/(^|\.)instagram\.com$/i.test(u.hostname)) return null;
    const shortcode = extractShortcode(u.href);
    if (!shortcode) return null;
    const kind = u.pathname.includes("/reel") ? "reel" : "p";
    return `https://www.instagram.com/${kind}/${shortcode}/`;
  } catch {
    return null;
  }
}

function metaContent(html: string, keys: string[]): string {
  for (const key of keys) {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`,
      "i",
    );
    const re2 = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`,
      "i",
    );
    const m = html.match(re) || html.match(re2);
    if (m?.[1]) return decodeHtml(m[1]);
  }
  return "";
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function assignRefIds(posts: Omit<InstagramPostRef, "refId">[]): InstagramPostRef[] {
  return posts.map((p, i) => ({
    ...p,
    refId: `IG-${String(i + 1).padStart(2, "0")}`,
  }));
}

async function fetchPostMeta(url: string): Promise<Omit<InstagramPostRef, "refId"> | null> {
  const shortcode = extractShortcode(url);
  if (!shortcode) return null;
  const canonical = normalizePostUrl(url) ?? url;

  try {
    const html = await fetchHtml(canonical);
    const title = metaContent(html, ["og:title", "twitter:title"]);
    const description = metaContent(html, [
      "og:description",
      "twitter:description",
      "description",
    ]);
    const image = metaContent(html, ["og:image", "twitter:image"]);
    const author =
      title.match(/^[^-–—|]+/)?.[0]?.replace(/on Instagram.*/i, "").trim() ||
      undefined;

    // If Instagram returned a login wall with almost no og tags, still keep a stub
    const caption =
      description ||
      title ||
      `Instagram post ${shortcode} — open link to review creative.`;

    return {
      shortcode,
      url: canonical,
      caption: caption.slice(0, 420),
      author,
      thumbnailUrl: image || undefined,
      fetchedAt: new Date().toISOString(),
      source: image || description ? "og" : "manual",
    };
  } catch {
    return {
      shortcode,
      url: canonical,
      caption: `Instagram post ${shortcode} (metadata unavailable — still usable as a reference).`,
      fetchedAt: new Date().toISOString(),
      source: "manual",
    };
  }
}

/** Pull post shortcodes embedded in a public profile HTML response. */
function extractShortcodesFromProfileHtml(html: string): string[] {
  const found = new Set<string>();
  const patterns = [
    /"shortcode":"([A-Za-z0-9_-]+)"/g,
    /instagram\.com\/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/gi,
    /\/p\/([A-Za-z0-9_-]+)\//g,
    /\/reel\/([A-Za-z0-9_-]+)\//g,
  ];
  for (const re of patterns) {
    for (const m of html.matchAll(re)) {
      if (m[1] && m[1].length >= 5) found.add(m[1]);
    }
  }
  return [...found].slice(0, 12);
}

/**
 * Ingest Instagram posts for reference.
 * - Paste profile URL/handle → attempt to discover recent shortcodes
 * - Paste one or more post/reel URLs → fetch OG metadata for each
 */
export async function pullInstagramPosts(options: {
  profileOrHandle?: string;
  postUrls?: string[];
}): Promise<InstagramPostRef[]> {
  const collected = new Map<string, Omit<InstagramPostRef, "refId">>();

  const urls = (options.postUrls ?? [])
    .flatMap((line) => line.split(/[\s,]+/))
    .map((u) => normalizePostUrl(u))
    .filter((u): u is string => Boolean(u));

  for (const url of urls) {
    const meta = await fetchPostMeta(url);
    if (meta) collected.set(meta.shortcode, meta);
  }

  const handle = options.profileOrHandle
    ? extractInstagramHandle(options.profileOrHandle)
    : null;

  if (handle) {
    const profileUrl = `https://www.instagram.com/${handle}/`;
    try {
      const html = await fetchHtml(profileUrl);
      const codes = extractShortcodesFromProfileHtml(html);
      for (const code of codes) {
        if (collected.has(code)) continue;
        const postUrl = `https://www.instagram.com/p/${code}/`;
        const meta = await fetchPostMeta(postUrl);
        if (meta) {
          if (!meta.author) meta.author = `@${handle}`;
          collected.set(meta.shortcode, meta);
        }
      }

      // If profile scrape found nothing usable, still seed a profile-level reference
      if (collected.size === 0) {
        collected.set(`profile-${handle}`, {
          shortcode: handle,
          url: profileUrl,
          caption: `Instagram profile @${handle} — paste specific post/reel URLs below for precise creative references.`,
          author: `@${handle}`,
          fetchedAt: new Date().toISOString(),
          source: "manual",
        });
      }
    } catch {
      if (collected.size === 0) {
        collected.set(`profile-${handle}`, {
          shortcode: handle,
          url: profileUrl,
          caption: `Could not reach Instagram for @${handle}. Paste public post URLs to build your reference library.`,
          author: `@${handle}`,
          fetchedAt: new Date().toISOString(),
          source: "manual",
        });
      }
    }
  }

  if (collected.size === 0) {
    throw new Error(
      "Add an Instagram handle/profile or paste public post/reel URLs to pull references.",
    );
  }

  return assignRefIds([...collected.values()]);
}

export function searchRefs(
  refs: InstagramPostRef[],
  query: string,
): InstagramPostRef[] {
  const q = query.trim().toLowerCase();
  if (!q) return refs;
  return refs.filter(
    (r) =>
      r.refId.toLowerCase().includes(q) ||
      r.shortcode.toLowerCase().includes(q) ||
      r.caption.toLowerCase().includes(q) ||
      (r.author ?? "").toLowerCase().includes(q),
  );
}
