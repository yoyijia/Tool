/**
 * Smoke social listening + suggestions.
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
const { signals, suggestions } = await runSocialListening(report);

console.log(
  JSON.stringify(
    {
      brand: report.name,
      signalCount: signals.length,
      categories: [...new Set(signals.map((s) => s.category))],
      topSignals: signals.slice(0, 5).map((s) => `${s.category}:${s.title}`),
      suggestions: suggestions.slice(0, 5).map((s) => ({
        cat: s.category,
        fit: s.fitScore,
        headline: s.headline,
        prompt: s.topicPrompt,
      })),
    },
    null,
    2,
  ),
);
