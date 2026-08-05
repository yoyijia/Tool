/**
 * Smoke test content generation.
 * Run: npx tsx scripts/smoke-content.ts
 */
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html></html>");
(globalThis as unknown as { DOMParser: typeof DOMParser }).DOMParser =
  dom.window.DOMParser;
(globalThis as unknown as { document: Document }).document = dom.window.document;
(globalThis as unknown as { chrome: undefined }).chrome = undefined;

const { analyzeBrand } = await import("../src/lib/analyze.ts");
const { generateSocialContent } = await import("../src/lib/contentGen.ts");

const report = await analyzeBrand("https://stripe.com");
const posts = generateSocialContent(report, {
  voiceId: "bold",
  platform: "linkedin",
  topic: "Product launch teaser for Radar",
});

console.log(
  JSON.stringify(
    {
      brand: report.name,
      count: posts.length,
      samples: posts.map((p) => ({
        format: p.format,
        hook: p.hook,
        cta: p.cta,
        tags: p.hashtags,
        tip0: p.engagementTips[0],
      })),
    },
    null,
    2,
  ),
);
