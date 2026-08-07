/**
 * Smoke: freeform idea scoring + examples.
 * Run: npx tsx scripts/smoke-idea-fit.ts
 */
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html></html>");
(globalThis as unknown as { DOMParser: typeof DOMParser }).DOMParser =
  dom.window.DOMParser;
(globalThis as unknown as { document: Document }).document = dom.window.document;
(globalThis as unknown as { chrome: undefined }).chrome = undefined;

const { analyzeBrand } = await import("../src/lib/analyze.ts");
const { exampleIdeas, scoreIdea } = await import("../src/lib/ideaFit.ts");

const report = await analyzeBrand("https://activamedia.com.sg");
const examples = exampleIdeas(report, 12);
const weak = scoreIdea(report, "beach vacation vibes", "instagram");
const strong = scoreIdea(
  report,
  "IG carousel myth vs fact for clinic owners about medical SEO — no outcome guarantees",
  "instagram",
);

console.log(
  JSON.stringify(
    {
      brand: report.name,
      audiences: report.audiences,
      exampleCount: examples.length,
      examples: examples.slice(0, 6),
      weak: {
        score: weak.score,
        verdict: weak.verdict,
        risks: weak.risks,
        rewrite: weak.rewrite,
      },
      strong: {
        score: strong.score,
        verdict: strong.verdict,
        works: strong.works,
        audience: strong.targetAudience,
      },
    },
    null,
    2,
  ),
);
