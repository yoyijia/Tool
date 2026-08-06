/**
 * Production static server + page fetch proxy for BrandVibe.
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
  ".woff2": "font/woff2",
};

async function handleFetchPage(req, res, urlObj) {
  const target = urlObj.searchParams.get("url");
  if (!target) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Missing url");
    return;
  }
  try {
    const upstream = await fetch(target, {
      redirect: "follow",
      headers: {
        Accept: "text/html,application/xhtml+xml,text/css,*/*",
        "User-Agent":
          "BrandVibe/1.0 (+https://github.com/yoyijia/Tool; marketing-research)",
      },
    });
    const body = await upstream.text();
    res.writeHead(upstream.ok ? 200 : upstream.status, {
      "Content-Type": "text/html; charset=utf-8",
      "X-Final-URL": upstream.url,
      "Access-Control-Allow-Origin": "*",
    });
    res.end(body);
  } catch (err) {
    res.writeHead(502, { "Content-Type": "text/plain" });
    res.end(err instanceof Error ? err.message : "Proxy failed");
  }
}

async function serveStatic(req, res, pathname) {
  let path = pathname === "/" ? "/index.html" : pathname;
  // SPA fallback
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

  await serveStatic(req, res, urlObj.pathname);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`BrandVibe listening on http://0.0.0.0:${PORT}`);
});
