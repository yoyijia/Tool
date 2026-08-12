/**
 * Smoke: verify trends rank by company fit.
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
const { tiktokFeed, instagramFeed, suggestions, fitById, dataNote } =
  await runSocialListening(report);

console.log(
  JSON.stringify(
    {
      brand: report.name,
      audiences: report.audiences,
      dataNote,
      tiktokTop: tiktokFeed.slice(0, 6).map((t) => ({
        title: t.title,
        fit: fitById[t.id],
        source: t.source,
      })),
      instagramTop: instagramFeed.slice(0, 6).map((t) => ({
        title: t.title,
        fit: fitById[t.id],
        source: t.source,
      })),
      topSuggestions: suggestions.slice(0, 5).map((s) => ({
        platform: s.platform,
        title: s.trendTitle,
        fit: s.fitScore,
        angle: s.angle.slice(0, 120),
      })),
    },
    null,
    2,
  ),
);
