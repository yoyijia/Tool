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
const examples = exampleIdeas(report, 12, "Clinic owners / medical directors");
const weak = scoreIdea(report, "beach vacation vibes", "instagram", "Clinic owners");
const strong = scoreIdea(
  report,
  "IG carousel myth vs fact for clinic owners about medical SEO — no outcome guarantees",
  "instagram",
  "Clinic owners / medical directors",
);
const founders = scoreIdea(
  report,
  "ROI listicle about our reporting stack",
  "linkedin",
  "SME founders evaluating agencies",
);

console.log(
  JSON.stringify(
    {
      brand: report.name,
      audiences: report.audiences,
      exampleCount: examples.length,
      examples: examples.slice(0, 4),
      weak: {
        score: weak.score,
        verdict: weak.verdict,
        answer: weak.answer,
        audience: weak.targetAudience,
        rewrite: weak.rewrite,
      },
      strong: {
        score: strong.score,
        verdict: strong.verdict,
        answer: strong.answer,
        audience: strong.targetAudience,
      },
      foundersPost: {
        score: founders.score,
        verdict: founders.verdict,
        answer: founders.answer,
        audience: founders.targetAudience,
        summary: founders.summary,
      },
      asserts: {
        weakIsWontOrMaybe: weak.verdict === "wont" || weak.verdict === "maybe",
        strongWorks: strong.verdict === "works",
        weakScoreBelowStrong: weak.score < strong.score,
      },
    },
    null,
    2,
  ),
);

if (weak.verdict === "works") {
  console.error("FAIL: beach vacation should not WORK for clinic owners");
  process.exit(1);
}
if (strong.verdict !== "works") {
  console.error("FAIL: clear clinic SEO myth carousel should WORK");
  process.exit(1);
}
