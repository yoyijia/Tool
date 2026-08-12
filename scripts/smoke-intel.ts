/**
 * Smoke: brand intel pulls real, per-company mentions with sources.
 * Run: npx tsx scripts/smoke-intel.ts
 */
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html></html>");
(globalThis as unknown as { DOMParser: typeof DOMParser }).DOMParser =
  dom.window.DOMParser;
(globalThis as unknown as { document: Document }).document = dom.window.document;
(globalThis as unknown as { chrome: undefined }).chrome = undefined;

const { analyzeBrand } = await import("../src/lib/analyze.ts");
const { gatherBrandIntel, intelDigest, brandQuery } = await import(
  "../src/lib/brandIntel.ts"
);

const stripe = await analyzeBrand("https://stripe.com");
const activa = await analyzeBrand("https://activamedia.com.sg");

const si = await gatherBrandIntel(stripe);
const ai = await gatherBrandIntel(activa);

const stripeTitles = si.newsMentions.map((m) => m.title);
const activaTitles = ai.newsMentions.map((m) => m.title);
const overlap = stripeTitles.filter((t) => activaTitles.includes(t));

console.log(
  JSON.stringify(
    {
      stripe: {
        query: si.query,
        news: si.newsMentions.slice(0, 4).map((m) => ({
          title: m.title.slice(0, 80),
          source: m.source,
          hasUrl: !!m.url,
          safety: m.safety,
        })),
        social: si.socialChatter.length,
        facts: si.facts ? si.facts.summary.slice(0, 120) : null,
        coverage: si.coverageNote,
        digest: intelDigest(si).slice(0, 200),
      },
      activa: {
        query: ai.query,
        news: activaTitles.slice(0, 3),
        social: ai.socialChatter.length,
        facts: ai.facts ? ai.facts.summary.slice(0, 100) : null,
        coverage: ai.coverageNote,
        evidence: ai.evidence,
      },
      asserts: {
        stripeQuerySane: brandQuery(stripe) === "Stripe",
        activaQueryNotSeo: !/best digital/i.test(ai.query),
        stripeHasNews: si.newsMentions.length >= 2,
        newsHaveUrls: si.newsMentions.every((m) => !!m.url),
        noCrossContamination: overlap.length === 0,
        evidencePresent: ai.evidence.length >= 3 && si.evidence.length >= 3,
        honestWhenEmpty:
          ai.newsMentions.length > 0 || /no recent verifiable/i.test(ai.coverageNote),
      },
    },
    null,
    2,
  ),
);

const checks = {
  stripeQuerySane: brandQuery(stripe) === "Stripe",
  stripeHasNews: si.newsMentions.length >= 2,
  newsHaveUrls: si.newsMentions.every((m) => !!m.url),
  noCrossContamination: overlap.length === 0,
  evidencePresent: ai.evidence.length >= 3 && si.evidence.length >= 3,
};
for (const [k, ok] of Object.entries(checks)) {
  if (!ok) {
    console.error(`FAIL: ${k}`);
    process.exit(1);
  }
}
