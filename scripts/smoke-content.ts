/**
 * Smoke: audience-specific generation (not just renamed labels).
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

const report = await analyzeBrand("https://activamedia.com.sg");
const topic = "Myth-busting tip about medical SEO";

const clinic = generateSocialContent(report, {
  voiceId: "expert",
  platform: "instagram",
  topic,
  targetAudience: "Clinic owners / medical directors",
});

const marketers = generateSocialContent(report, {
  voiceId: "expert",
  platform: "instagram",
  topic,
  targetAudience: "In-house marketers",
});

const withListening = generateSocialContent(report, {
  voiceId: "bold",
  platform: "tiktok",
  topic: "Campaign teardown for clinic SEO",
  targetAudience: "Clinic owners / medical directors",
  listening: {
    trendTitle: "Myth vs fact (patient FAQ)",
    angle:
      "Deadpan myth vs fact about medical SEO for clinic owners — consent-first, no outcome guarantees.",
    hookIdeas: [
      "Three myths clinic owners still hear about medical SEO:",
      "What we’d never claim in a healthcare ad:",
    ],
    voiceBlend: "Format myth vs fact → clinic owners / medical SEO",
    fitReason: "Healthcare playbook + live listening hook",
    source: "Social listening · tiktok",
  },
});

const clinicBody = clinic[0]!.body;
const marketerBody = marketers[0]!.body;
const different =
  clinicBody !== marketerBody &&
  /Trust-stack|myth|consent|clinic/i.test(clinicBody) &&
  /teardown|Marketer|metric|campaign/i.test(marketerBody);
const listeningUsed =
  /Myth vs fact|Listening:/i.test(withListening[0]!.body) &&
  (/myths clinic owners|never claim in a healthcare/i.test(withListening[0]!.hook) ||
    /consent-first|Myth vs fact/i.test(withListening[0]!.body));

console.log(
  JSON.stringify(
    {
      brand: report.name,
      clinic: {
        format: clinic[0]!.format,
        hook: clinic[0]!.hook,
        cta: clinic[0]!.cta,
        bodyPreview: clinicBody.slice(0, 280),
      },
      marketers: {
        format: marketers[0]!.format,
        hook: marketers[0]!.hook,
        cta: marketers[0]!.cta,
        bodyPreview: marketerBody.slice(0, 280),
      },
      withListening: {
        format: withListening[0]!.format,
        hook: withListening[0]!.hook,
        bodyPreview: withListening[0]!.body.slice(0, 280),
      },
      asserts: {
        differentBodies: different,
        listeningUsed,
      },
    },
    null,
    2,
  ),
);

if (!different) {
  console.error("FAIL: clinic vs marketer drafts should differ structurally");
  process.exit(1);
}
if (!listeningUsed) {
  console.error("FAIL: listening hooks/angle should appear in drafts");
  process.exit(1);
}
