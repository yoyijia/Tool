/**
 * Node smoke test for analysis heuristics (no browser).
 * Run: npx tsx scripts/smoke-analyze.ts [url]
 */
import { JSDOM } from "jsdom";

// Polyfill DOMParser for Node
const dom = new JSDOM("<!DOCTYPE html><html></html>");
(globalThis as unknown as { DOMParser: typeof DOMParser }).DOMParser = dom.window.DOMParser;
(globalThis as unknown as { document: Document }).document = dom.window.document;

const target = process.argv[2] ?? "https://example.com";

const { analyzeBrand } = await import("../src/lib/analyze.ts");

// Stub chrome
(globalThis as unknown as { chrome: undefined }).chrome = undefined;

const report = await analyzeBrand(target);
console.log(
  JSON.stringify(
    {
      name: report.name,
      domain: report.domain,
      archetype: report.archetype,
      personality: report.personality.map((p) => `${p.label}:${p.score}`),
      palette: report.palette.map((c) => `${c.hex}(${c.role})`),
      social: report.socialProfiles.map((s) => s.platform),
      trends: report.trends.map((t) => t.title),
      voice: report.voiceSummary,
    },
    null,
    2,
  ),
);
