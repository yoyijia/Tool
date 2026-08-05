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

async function fetchDirect(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { Accept: "text/html,application/xhtml+xml" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function fetchViaDevProxy(url: string): Promise<string> {
  const proxied = `/api/fetch-page?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxied);
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 180);
    throw new Error(detail || `Proxy HTTP ${res.status}`);
  }
  return res.text();
}

async function fetchViaPublicProxy(url: string): Promise<string> {
  const proxied = `https://corsproxy.io/?${encodeURIComponent(url)}`;
  const res = await fetch(proxied);
  if (!res.ok) throw new Error(`Proxy HTTP ${res.status}`);
  return res.text();
}

async function fetchHtml(url: string): Promise<string> {
  // 1) Chrome extension background (CORS-free)
  const fromExt = await fetchViaExtension(url);
  if (fromExt) return fromExt;

  // 2) Vite / preview local proxy (browser only)
  if (typeof window !== "undefined") {
    try {
      return await fetchViaDevProxy(url);
    } catch {
      /* continue */
    }
  }

  // 3) Direct fetch (Node smoke tests / permissive hosts)
  try {
    return await fetchDirect(url);
  } catch {
    /* continue */
  }

  // 4) Public CORS proxy fallback (browser)
  if (typeof window !== "undefined") {
    try {
      return await fetchViaPublicProxy(url);
    } catch {
      /* continue */
    }
  }

  throw new Error(
    `Could not reach ${url}. Load BrandVibe as a Chrome extension for full site access, or run via npm run dev.`,
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

  // CSS variables that look like colors
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
  // SVG presentation attributes
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
  // Prefer textContent in Node/JSDOM; innerText in browsers
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
    return SOCIAL_HOSTS.some(
      (s) => host === s || host.endsWith(`.${s}`),
    );
  } catch {
    return false;
  }
}
