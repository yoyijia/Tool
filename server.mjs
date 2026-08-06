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

const UA =
  "BrandVibe/1.0 (+https://github.com/yoyijia/Tool; marketing-research)";

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
        "User-Agent": UA,
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
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "User-Agent": UA,
      },
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
