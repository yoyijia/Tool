/**
 * Smoke: example ideas must differ per company (same audience label).
 * Run: npx tsx scripts/smoke-examples.ts
 */
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html></html>");
(globalThis as unknown as { DOMParser: typeof DOMParser }).DOMParser =
  dom.window.DOMParser;
(globalThis as unknown as { document: Document }).document = dom.window.document;
(globalThis as unknown as { chrome: undefined }).chrome = undefined;

const { analyzeBrand } = await import("../src/lib/analyze.ts");
const { exampleIdeas } = await import("../src/lib/ideaFit.ts");

const audience = "Prospective clients";
const a = await analyzeBrand("https://activamedia.com.sg");
const b = await analyzeBrand("https://stripe.com");
const c = await analyzeBrand("https://notion.so");

const ideasA = exampleIdeas(a, 12, audience);
const ideasB = exampleIdeas(b, 12, audience);
const ideasC = exampleIdeas(c, 12, audience);

const overlapAB = ideasA.filter((x) => ideasB.includes(x));
const overlapAC = ideasA.filter((x) => ideasC.includes(x));
const overlapBC = ideasB.filter((x) => ideasC.includes(x));

console.log(
  JSON.stringify(
    {
      audience,
      activa: { brand: a.name, first4: ideasA.slice(0, 4) },
      stripe: { brand: b.name, first4: ideasB.slice(0, 4) },
      notion: { brand: c.name, first4: ideasC.slice(0, 4) },
      overlaps: {
        activaVsStripe: overlapAB.length,
        activaVsNotion: overlapAC.length,
        stripeVsNotion: overlapBC.length,
      },
      asserts: {
        abDiffer: overlapAB.length <= 2,
        acDiffer: overlapAC.length <= 2,
        bcDiffer: overlapBC.length <= 2,
      },
    },
    null,
    2,
  ),
);

if (overlapAB.length > 2 || overlapAC.length > 2 || overlapBC.length > 2) {
  console.error("FAIL: example ideas overlap too much between companies");
  process.exit(1);
}
