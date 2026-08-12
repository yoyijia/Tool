/**
 * Smoke: Instagram ref ids + content brief wiring.
 * Run: npx tsx scripts/smoke-refs.ts
 */
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html></html>");
(globalThis as unknown as { DOMParser: typeof DOMParser }).DOMParser =
  dom.window.DOMParser;
(globalThis as unknown as { document: Document }).document = dom.window.document;
(globalThis as unknown as { chrome: undefined }).chrome = undefined;

const { analyzeBrand } = await import("../src/lib/analyze.ts");
const { generateSocialContent } = await import("../src/lib/contentGen.ts");
const { extractShortcode, normalizePostUrl } = await import("../src/lib/instagram.ts");

const report = await analyzeBrand("https://example.com");
const posts = generateSocialContent(report, {
  voiceId: "playful",
  platform: "instagram",
  topic: "Remix IG-02 into a launch teaser",
  referenceId: "IG-02",
  referenceUrl: "https://www.instagram.com/p/ABC123/",
  referenceCaption: "Summer drop behind the scenes",
  mascotId: "fox",
});

console.log(
  JSON.stringify(
    {
      shortcode: extractShortcode("https://www.instagram.com/reel/HelloWorld1/"),
      normalized: normalizePostUrl("instagram.com/p/ABC123xyz/"),
      draftRef: posts[0]?.referenceId,
      draftMascot: posts[0]?.mascotId,
      bodyHasRef: posts[0]?.body.includes("IG-02"),
      tipHasRef: posts[0]?.engagementTips.some((t) => t.includes("IG-02")),
    },
    null,
    2,
  ),
);
