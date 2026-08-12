import { defineConfig, type Connect, type PreviewServer, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const rootDir = dirname(fileURLToPath(import.meta.url));

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function browserHeaders(extra: Record<string, string> = {}) {
  return {
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "User-Agent": BROWSER_UA,
    ...extra,
  };
}

function looksUsableHtml(html: string) {
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

function urlCandidates(url: string) {
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

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function fetchUpstream(url: string) {
  const upstream = await fetch(url, {
    redirect: "follow",
    headers: browserHeaders(),
    signal: AbortSignal.timeout(20_000),
  });
  const body = await upstream.text();
  if (upstream.ok || looksUsableHtml(body)) {
    return {
      html: body,
      finalUrl: upstream.url,
      status: upstream.ok ? 200 : upstream.status,
    };
  }
  throw new Error(`HTTP ${upstream.status}`);
}

async function fetchViaJina(url: string) {
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

async function loadPage(target: string) {
  const errors: string[] = [];
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

function attachProxies(server: ViteDevServer | PreviewServer) {
  const page: Connect.NextHandleFunction = async (req, res, next) => {
    if (!req.url?.startsWith("/api/fetch-page")) return next();
    try {
      const host = req.headers.host ?? "localhost";
      const full = new URL(req.url, `http://${host}`);
      const target = full.searchParams.get("url");
      if (!target) {
        res.statusCode = 400;
        res.end("Missing url");
        return;
      }
      const { html, finalUrl, status } = await loadPage(target);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("X-Final-URL", finalUrl);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.statusCode = status >= 400 && !looksUsableHtml(html) ? status : 200;
      res.end(html);
    } catch (err) {
      res.statusCode = 502;
      res.end(err instanceof Error ? err.message : "Proxy failed");
    }
  };

  const image: Connect.NextHandleFunction = async (req, res, next) => {
    if (!req.url?.startsWith("/api/fetch-image")) return next();
    try {
      const host = req.headers.host ?? "localhost";
      const full = new URL(req.url, `http://${host}`);
      const target = full.searchParams.get("url");
      if (!target) {
        res.statusCode = 400;
        res.end("Missing url");
        return;
      }
      const upstream = await fetch(target, {
        redirect: "follow",
        headers: browserHeaders({
          Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        }),
        signal: AbortSignal.timeout(20_000),
      });
      const buf = Buffer.from(await upstream.arrayBuffer());
      res.setHeader(
        "Content-Type",
        upstream.headers.get("content-type") || "image/jpeg",
      );
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.statusCode = upstream.ok ? 200 : upstream.status;
      res.end(buf);
    } catch (err) {
      res.statusCode = 502;
      res.end(err instanceof Error ? err.message : "Image proxy failed");
    }
  };

  server.middlewares.use(page);
  server.middlewares.use(image);
}

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    {
      name: "brandvibe-proxies",
      configureServer(server) {
        attachProxies(server);
      },
      configurePreviewServer(server) {
        attachProxies(server);
      },
    },
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(rootDir, "index.html"),
        background: resolve(rootDir, "src/background.ts"),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === "background" ? "background.js" : "assets/[name]-[hash].js",
      },
    },
  },
});
