import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html></html>");
(globalThis as unknown as { DOMParser: typeof DOMParser }).DOMParser =
  dom.window.DOMParser;
(globalThis as unknown as { document: Document }).document = dom.window.document;
(globalThis as unknown as { chrome: undefined }).chrome = undefined;

const { analyzeBrand } = await import("../src/lib/analyze.ts");
const { runSocialListening } = await import("../src/lib/socialListening.ts");

const report = await analyzeBrand("https://stripe.com");
const r = await runSocialListening(report);

console.log(
  JSON.stringify(
    {
      counts: {
        tt: r.tiktokFeed.length,
        ig: r.instagramFeed.length,
        live: r.liveFeed.length,
      },
      ttSources: [...new Set(r.tiktokFeed.map((t) => t.source.split(" · ")[0]))],
      igSources: [...new Set(r.instagramFeed.map((t) => t.source.split(" · ")[0]))],
      tiktok: r.tiktokFeed.map((t) => `${t.title} | ${t.source}`),
      instagram: r.instagramFeed.map((t) => `${t.title} | ${t.source}`),
    },
    null,
    2,
  ),
);
