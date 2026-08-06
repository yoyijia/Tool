import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    {
      name: "brandvibe-page-proxy",
      configureServer(server) {
        server.middlewares.use("/api/fetch-page", async (req, res) => {
          try {
            const host = req.headers.host ?? "localhost";
            const full = new URL(req.url ?? "/", `http://${host}`);
            const target = full.searchParams.get("url");
            if (!target) {
              res.statusCode = 400;
              res.end("Missing url");
              return;
            }
            const upstream = await fetch(target, {
              redirect: "follow",
              headers: {
                Accept: "text/html,application/xhtml+xml",
                "User-Agent":
                  "BrandVibe/1.0 (+https://github.com/yoyijia/Tool; marketing-research)",
              },
            });
            const html = await upstream.text();
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.setHeader("X-Final-URL", upstream.url);
            res.statusCode = upstream.ok ? 200 : upstream.status;
            res.end(html);
          } catch (err) {
            res.statusCode = 502;
            res.end(err instanceof Error ? err.message : "Proxy failed");
          }
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use("/api/fetch-page", async (req, res) => {
          try {
            const host = req.headers.host ?? "localhost";
            const full = new URL(req.url ?? "/", `http://${host}`);
            const target = full.searchParams.get("url");
            if (!target) {
              res.statusCode = 400;
              res.end("Missing url");
              return;
            }
            const upstream = await fetch(target, {
              redirect: "follow",
              headers: {
                Accept: "text/html,application/xhtml+xml",
                "User-Agent":
                  "BrandVibe/1.0 (+https://github.com/yoyijia/Tool; marketing-research)",
              },
            });
            const html = await upstream.text();
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.setHeader("X-Final-URL", upstream.url);
            res.statusCode = upstream.ok ? 200 : upstream.status;
            res.end(html);
          } catch (err) {
            res.statusCode = 502;
            res.end(err instanceof Error ? err.message : "Proxy failed");
          }
        });
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
