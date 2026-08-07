/**
 * Production static server + page/image fetch proxy for BrandVibe.
 * Usage: node server.mjs
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const DIST = join(__dirname, "dist");
const PORT = Number(process.env.PORT || 4173);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".woff2": "font/woff2",
};

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function browserHeaders(extra = {}) {
  return {
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "User-Agent": BROWSER_UA,
    ...extra,
  };
}

function looksUsableHtml(html) {
  if (html.length < 500) return false;
  const blocked =
    /cf-browser-verification|attention required|access denied|request blocked|enable javascript and cookies/i.test(
      html,
    ) && html.length < 12_000;
  if (blocked) return false;
  return /<title[\s>]|property=["']og:title|name=["']description["']|<h1[\s>]/i.test(
    html,
  );
}

function urlCandidates(url) {
  try {
    const u = new URL(url);
    const hosts = new Set([u.hostname]);
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

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function fetchUpstream(url) {
  const upstream = await fetch(url, {
    redirect: "follow",
    headers: browserHeaders(),
    signal: AbortSignal.timeout(20_000),
  });
  const body = await upstream.text();
  if (upstream.ok || looksUsableHtml(body)) {
    return { html: body, finalUrl: upstream.url, status: upstream.ok ? 200 : upstream.status };
  }
  throw new Error(`HTTP ${upstream.status}`);
}

async function fetchViaJina(url) {
  const upstream = await fetch(`https://r.jina.ai/${url}`, {
    headers: {
      Accept: "text/plain",
      "User-Agent": BROWSER_UA,
      "X-Return-Format": "markdown",
    },
    signal: AbortSignal.timeout(25_000),
  });
  if (!upstream.ok) throw new Error(`Reader HTTP ${upstream.status}`);
  const md = await upstream.text();
  if (md.length < 80) throw new Error("Reader empty");
  const title = md.match(/^Title:\s*(.+)$/m)?.[1]?.trim() || "";
  const markdownBody =
    md.split(/Markdown Content:\s*/i).slice(1).join("Markdown Content:").trim() ||
    md;
  const desc = markdownBody.replace(/\s+/g, " ").trim().slice(0, 220);
  const paras = markdownBody
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("URL Source:"))
    .slice(0, 80)
    .map((l) => `<p>${escapeHtml(l)}</p>`)
    .join("\n");
  const html = `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"/>
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(desc)}"/>
<meta property="og:title" content="${escapeHtml(title)}"/>
<meta property="og:description" content="${escapeHtml(desc)}"/>
</head><body><h1>${escapeHtml(title)}</h1>${paras}</body></html>`;
  return { html, finalUrl: url, status: 200 };
}

async function loadPage(target) {
  const errors = [];
  for (const candidate of urlCandidates(target)) {
    try {
      return await fetchUpstream(candidate);
    } catch (err) {
      errors.push(`${candidate}: ${err instanceof Error ? err.message : "fail"}`);
    }
  }
  for (const candidate of urlCandidates(target)) {
    try {
      return await fetchViaJina(candidate);
    } catch (err) {
      errors.push(`reader ${candidate}: ${err instanceof Error ? err.message : "fail"}`);
    }
  }
  throw new Error(errors.slice(0, 3).join(" | ") || "Proxy failed");
}

async function handleFetchPage(req, res, urlObj) {
  const target = urlObj.searchParams.get("url");
  if (!target) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Missing url");
    return;
  }
  try {
    const { html, finalUrl, status } = await loadPage(target);
    res.writeHead(status >= 400 && !looksUsableHtml(html) ? status : 200, {
      "Content-Type": "text/html; charset=utf-8",
      "X-Final-URL": finalUrl,
      "Access-Control-Allow-Origin": "*",
    });
    res.end(html);
  } catch (err) {
    res.writeHead(502, { "Content-Type": "text/plain" });
    res.end(err instanceof Error ? err.message : "Proxy failed");
  }
}

async function handleFetchImage(req, res, urlObj) {
  const target = urlObj.searchParams.get("url");
  if (!target) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Missing url");
    return;
  }
  try {
    const upstream = await fetch(target, {
      redirect: "follow",
      headers: browserHeaders({
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      }),
      signal: AbortSignal.timeout(20_000),
    });
    const buf = Buffer.from(await upstream.arrayBuffer());
    const type = upstream.headers.get("content-type") || "image/jpeg";
    res.writeHead(upstream.ok ? 200 : upstream.status, {
      "Content-Type": type,
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
    });
    res.end(buf);
  } catch (err) {
    res.writeHead(502, { "Content-Type": "text/plain" });
    res.end(err instanceof Error ? err.message : "Image proxy failed");
  }
}

async function serveStatic(req, res, pathname) {
  let path = pathname === "/" ? "/index.html" : pathname;
  let filePath = join(DIST, path);
  try {
    const data = await readFile(filePath);
    const type = MIME[extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  } catch {
    if (!extname(path)) {
      try {
        const data = await readFile(join(DIST, "index.html"));
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(data);
        return;
      } catch {
        /* fall through */
      }
    }
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
}

const server = createServer(async (req, res) => {
  const host = req.headers.host ?? "localhost";
  const urlObj = new URL(req.url ?? "/", `http://${host}`);

  if (urlObj.pathname === "/api/fetch-page") {
    await handleFetchPage(req, res, urlObj);
    return;
  }
  if (urlObj.pathname === "/api/fetch-image") {
    await handleFetchImage(req, res, urlObj);
    return;
  }

  await serveStatic(req, res, urlObj.pathname);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`BrandVibe listening on http://0.0.0.0:${PORT}`);
});
