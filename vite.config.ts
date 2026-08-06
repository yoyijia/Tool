import { defineConfig, type Connect, type PreviewServer, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const rootDir = dirname(fileURLToPath(import.meta.url));
const UA = "BrandVibe/1.0 (+https://github.com/yoyijia/Tool; marketing-research)";

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
      const upstream = await fetch(target, {
        redirect: "follow",
        headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": UA },
      });
      const html = await upstream.text();
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("X-Final-URL", upstream.url);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.statusCode = upstream.ok ? 200 : upstream.status;
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
        headers: {
          Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          "User-Agent": UA,
        },
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
