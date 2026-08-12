import { toUrl } from "./url";

export interface PageSnapshot {
  url: string;
  html: string;
  title: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  textContent: string;
  headings: string[];
  linkHrefs: string[];
  styleColors: string[];
  themeColor: string;
  favicon: string;
}

const SOCIAL_HOSTS = [
  "twitter.com",
  "x.com",
  "instagram.com",
  "facebook.com",
  "linkedin.com",
  "tiktok.com",
  "youtube.com",
  "youtu.be",
  "pinterest.com",
  "threads.net",
  "discord.gg",
  "discord.com",
];

/** Many sites block custom bot UAs — look like a normal browser. */
export const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export function browserHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "User-Agent": BROWSER_UA,
    ...extra,
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** True when the body still has usable brand signals despite a non-2xx status. */
export function looksUsableHtml(html: string): boolean {
  if (html.length < 500) return false;
  const blocked =
    /cf-browser-verification|attention required|access denied|request blocked|enable javascript and cookies/i.test(
      html,
    ) && html.length < 12_000;
  if (blocked) return false;
  return /<title[\s>]|property=["']og:title|name=["']description["']|<h1[\s>]/i.test(html);
}

function urlCandidates(url: string): string[] {
  try {
    const u = new URL(url);
    const hosts = new Set<string>([u.hostname]);
    if (u.hostname.startsWith("www.")) hosts.add(u.hostname.slice(4));
    else hosts.add(`www.${u.hostname}`);
    return [...hosts].map((h) => {
      const next = new URL(url);
      next.hostname = h;
      return next.href;
    });
  } catch {
    return [url];
  }
}

async function fetchViaExtension(url: string): Promise<string | null> {
  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return null;
  try {
    const response = await chrome.runtime.sendMessage({
      type: "FETCH_PAGE",
      url,
    });
    if (response?.ok && typeof response.html === "string") {
      return response.html;
    }
  } catch {
    /* not running as extension */
  }
  return null;
}

async function fetchUpstream(url: string): Promise<string> {
  const res = await fetch(url, {
    redirect: "follow",
    headers: browserHeaders(),
    signal: AbortSignal.timeout(20_000),
  });
  const html = await res.text();
  if (res.ok || looksUsableHtml(html)) return html;
  throw new Error(`HTTP ${res.status}`);
}

async function fetchViaDevProxy(url: string): Promise<string> {
  const proxied = `/api/fetch-page?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxied, { signal: AbortSignal.timeout(25_000) });
  const body = await res.text();
  if (res.ok || looksUsableHtml(body)) return body;
  throw new Error(body.slice(0, 180) || `Proxy HTTP ${res.status}`);
}

/** Jina reader — works when origin blocks datacenter IPs / bots. */
async function fetchViaJina(url: string): Promise<string> {
  const res = await fetch(`https://r.jina.ai/${url}`, {
    headers: {
      Accept: "text/plain",
      "User-Agent": BROWSER_UA,
      "X-Return-Format": "markdown",
    },
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new Error(`Reader HTTP ${res.status}`);
  const md = await res.text();
  if (md.length < 80) throw new Error("Reader returned empty content");

  const title = md.match(/^Title:\s*(.+)$/m)?.[1]?.trim() || "";
  const markdownBody =
    md.split(/Markdown Content:\s*/i).slice(1).join("Markdown Content:").trim() || md;
  const desc = markdownBody.replace(/\s+/g, " ").trim().slice(0, 220);
  const paras = markdownBody
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("URL Source:"))
    .slice(0, 80)
    .map((l) => `<p>${escapeHtml(l)}</p>`)
    .join("\n");

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"/>
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(desc)}"/>
<meta property="og:title" content="${escapeHtml(title)}"/>
<meta property="og:description" content="${escapeHtml(desc)}"/>
</head><body>
<h1>${escapeHtml(title)}</h1>
${paras}
</body></html>`;
}

async function fetchHtml(url: string): Promise<string> {
  const errors: string[] = [];

  // 1) Chrome extension background (CORS-free)
  const fromExt = await fetchViaExtension(url);
  if (fromExt) return fromExt;

  const candidates = urlCandidates(url);

  // 2) App proxy (browser → server.mjs / Vite)
  if (typeof window !== "undefined") {
    for (const candidate of candidates) {
      try {
        return await fetchViaDevProxy(candidate);
      } catch (err) {
        errors.push(
          `proxy ${candidate}: ${err instanceof Error ? err.message : "fail"}`,
        );
      }
    }
  }

  // 3) Direct fetch (Node smoke / permissive hosts)
  for (const candidate of candidates) {
    try {
      return await fetchUpstream(candidate);
    } catch (err) {
      errors.push(
        `direct ${candidate}: ${err instanceof Error ? err.message : "fail"}`,
      );
    }
  }

  // 4) Jina reader fallback (bot walls)
  for (const candidate of candidates) {
    try {
      return await fetchViaJina(candidate);
    } catch (err) {
      errors.push(
        `reader ${candidate}: ${err instanceof Error ? err.message : "fail"}`,
      );
    }
  }

  throw new Error(
    `Could not load ${url}. The site may be blocking automated requests. Try the full URL (https://…), another domain, or the Chrome extension. (${errors.slice(0, 2).join("; ")})`,
  );
}

function extractMeta(doc: Document, name: string): string {
  const byName = doc.querySelector(
    `meta[name="${name}"], meta[property="${name}"], meta[property="og:${name}"], meta[name="twitter:${name}"]`,
  );
  return byName?.getAttribute("content")?.trim() ?? "";
}

function extractColorsFromCss(cssText: string): string[] {
  const colors: string[] = [];
  const hex = cssText.match(/#(?:[0-9a-fA-F]{3,4}){1,2}\b/g) ?? [];
  const rgb =
    cssText.match(
      /rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*[\d.]+\s*)?\)/gi,
    ) ?? [];
  const hsl =
    cssText.match(
      /hsla?\(\s*[\d.]+\s*,\s*[\d.]+%\s*,\s*[\d.]+%(?:\s*,\s*[\d.]+\s*)?\)/gi,
    ) ?? [];
  colors.push(...hex, ...rgb, ...hsl);

  for (const match of cssText.matchAll(/--[\w-]+\s*:\s*([^;!}{]+)/g)) {
    const value = match[1]?.trim() ?? "";
    if (
      value.startsWith("#") ||
      value.startsWith("rgb") ||
      value.startsWith("hsl")
    ) {
      colors.push(value);
    }
  }
  return colors;
}

function walkInlineStyles(doc: Document): string[] {
  const colors: string[] = [];
  doc.querySelectorAll("[style]").forEach((el) => {
    const style = el.getAttribute("style") ?? "";
    colors.push(...extractColorsFromCss(style));
  });
  doc.querySelectorAll("style").forEach((el) => {
    colors.push(...extractColorsFromCss(el.textContent ?? ""));
  });
  doc.querySelectorAll("[fill], [stroke], [color]").forEach((el) => {
    for (const attr of ["fill", "stroke", "color"]) {
      const v = el.getAttribute(attr);
      if (v && v !== "none" && v !== "currentColor") colors.push(v);
    }
  });
  return colors;
}

function stylesheetHrefs(doc: Document, baseUrl: string): string[] {
  return Array.from(doc.querySelectorAll('link[rel="stylesheet"][href]'))
    .map((el) => el.getAttribute("href"))
    .filter((href): href is string => Boolean(href))
    .map((href) => {
      try {
        return new URL(href, baseUrl).href;
      } catch {
        return null;
      }
    })
    .filter((href): href is string => Boolean(href))
    .slice(0, 6);
}

async function collectExternalCssColors(hrefs: string[]): Promise<string[]> {
  const colors: string[] = [];
  await Promise.all(
    hrefs.map(async (href) => {
      try {
        const css = await fetchHtml(href);
        colors.push(...extractColorsFromCss(css.slice(0, 200_000)));
      } catch {
        /* stylesheet blocked — ignore */
      }
    }),
  );
  return colors;
}

function readableText(doc: Document): string {
  const body = doc.body;
  if (!body) return "";
  const raw =
    (body as HTMLElement).innerText?.trim() ||
    body.textContent?.replace(/\s+/g, " ").trim() ||
    "";
  return raw.replace(/\s+/g, " ").slice(0, 12000);
}

export async function capturePage(input: string): Promise<PageSnapshot> {
  const url = toUrl(input);
  const html = await fetchHtml(url);
  const doc = new DOMParser().parseFromString(html, "text/html");

  const title =
    extractMeta(doc, "og:title") ||
    doc.querySelector("title")?.textContent?.trim() ||
    "";
  const metaDescription =
    extractMeta(doc, "description") || extractMeta(doc, "og:description");
  const ogTitle = extractMeta(doc, "og:title");
  const ogDescription = extractMeta(doc, "og:description");
  const ogImage = extractMeta(doc, "og:image");
  const themeColor =
    extractMeta(doc, "theme-color") || extractMeta(doc, "msapplication-TileColor");

  const headings = Array.from(doc.querySelectorAll("h1, h2, h3"))
    .map((h) => h.textContent?.replace(/\s+/g, " ").trim() ?? "")
    .filter(Boolean)
    .slice(0, 24);

  const bodyText = readableText(doc);

  const linkHrefs = Array.from(doc.querySelectorAll("a[href]"))
    .map((a) => a.getAttribute("href") ?? "")
    .filter(Boolean);

  const styleColors = walkInlineStyles(doc);
  if (themeColor) styleColors.unshift(themeColor);

  const external = await collectExternalCssColors(stylesheetHrefs(doc, url));
  styleColors.push(...external);

  const iconLink =
    doc.querySelector('link[rel~="icon"]')?.getAttribute("href") ??
    doc.querySelector('link[rel="shortcut icon"]')?.getAttribute("href") ??
    "/favicon.ico";

  let favicon = iconLink;
  try {
    favicon = new URL(iconLink, url).href;
  } catch {
    /* keep relative */
  }

  return {
    url,
    html,
    title: ogTitle || title,
    metaDescription,
    ogTitle,
    ogDescription,
    ogImage,
    textContent: bodyText,
    headings,
    linkHrefs,
    styleColors,
    themeColor,
    favicon,
  };
}

export function isSocialUrl(href: string): boolean {
  try {
    const host = new URL(href, "https://example.com").hostname.replace(
      /^www\./,
      "",
    );
    return SOCIAL_HOSTS.some((s) => host === s || host.endsWith(`.${s}`));
  } catch {
    return false;
  }
}
