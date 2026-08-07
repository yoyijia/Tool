/**
 * Smoke: verify dated TikTok/IG trends parse correctly.
 * Run: npx tsx scripts/smoke-trends.ts
 */
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html></html>");
(globalThis as unknown as { DOMParser: typeof DOMParser }).DOMParser =
  dom.window.DOMParser;
(globalThis as unknown as { document: Document }).document = dom.window.document;
(globalThis as unknown as { chrome: undefined }).chrome = undefined;

const { analyzeBrand } = await import("../src/lib/analyze.ts");
const { runSocialListening } = await import("../src/lib/socialListening.ts");

const report = await analyzeBrand("https://stripe.com");
const { tiktokFeed, instagramFeed, suggestions, dataNote } =
  await runSocialListening(report);

console.log(
  JSON.stringify(
    {
      dataNote,
      tiktok: tiktokFeed.slice(0, 6).map((t) => ({
        title: t.title,
        source: t.source,
        heat: t.heat,
      })),
      instagram: instagramFeed.slice(0, 6).map((t) => ({
        title: t.title,
        source: t.source,
        heat: t.heat,
      })),
      topSuggestions: suggestions.slice(0, 4).map((s) => ({
        platform: s.platform,
        title: s.trendTitle,
        fit: s.fitScore,
        voice: s.voiceBlend.slice(0, 100),
      })),
    },
    null,
    2,
  ),
);
