/**
 * Smoke: detect country from website → regional trends.
 * Run: npx tsx scripts/smoke-geo.ts
 */
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html></html>");
(globalThis as unknown as { DOMParser: typeof DOMParser }).DOMParser =
  dom.window.DOMParser;
(globalThis as unknown as { document: Document }).document = dom.window.document;
(globalThis as unknown as { chrome: undefined }).chrome = undefined;

const { analyzeBrand } = await import("../src/lib/analyze.ts");
const { trendsRssUrl } = await import("../src/lib/brandGeo.ts");
const { fetchLiveCultureTrends } = await import("../src/lib/liveCulture.ts");
const { generateSocialContent } = await import("../src/lib/contentGen.ts");

const sg = await analyzeBrand("https://activamedia.com.sg");
const us = await analyzeBrand("https://stripe.com");

const sgLive = await fetchLiveCultureTrends(sg);
const usLive = await fetchLiveCultureTrends(us);

const sgDraft = generateSocialContent(sg, {
  voiceId: "expert",
  platform: "instagram",
  topic: "Myth-busting tip about medical SEO",
  targetAudience: "Clinic owners",
});
const usDraft = generateSocialContent(us, {
  voiceId: "bold",
  platform: "linkedin",
  topic: "Product launch teaser for Radar",
  targetAudience: "Developers & technical buyers",
});

const sgOk = sg.geo.countryCode === "SG";
const usOk = us.geo.countryCode === "US" || us.geo.countryCode === "IE";
const trendsDiffer =
  trendsRssUrl(sg.geo) !== trendsRssUrl(us.geo) &&
  trendsRssUrl(sg.geo).includes("geo=SG");
const draftsMentionMarket =
  /Singapore|SG/i.test(sgDraft[0]!.body) &&
  /United States|US|Market:/i.test(usDraft[0]!.body);

console.log(
  JSON.stringify(
    {
      activa: {
        geo: sg.geo,
        trendsUrl: trendsRssUrl(sg.geo),
        liveCount: sgLive.length,
        liveSample: sgLive.slice(0, 4).map((t) => t.label),
        draftMarket: sgDraft[0]!.body.match(/Market:[^\n]+/)?.[0],
      },
      stripe: {
        geo: us.geo,
        trendsUrl: trendsRssUrl(us.geo),
        liveCount: usLive.length,
        liveSample: usLive.slice(0, 4).map((t) => t.label),
        draftMarket: usDraft[0]!.body.match(/Market:[^\n]+/)?.[0],
      },
      asserts: {
        sgOk,
        usOk,
        trendsDiffer,
        draftsMentionMarket,
        bothHaveLive: sgLive.length >= 5 && usLive.length >= 5,
      },
    },
    null,
    2,
  ),
);

if (!sgOk) {
  console.error("FAIL: activamedia.com.sg should detect SG");
  process.exit(1);
}
if (!usOk) {
  console.error("FAIL: stripe.com should detect US (or IE)");
  process.exit(1);
}
if (!trendsDiffer) {
  console.error("FAIL: regional Trends RSS URLs should differ by country");
  process.exit(1);
}
if (!draftsMentionMarket) {
  console.error("FAIL: drafts should mention the detected market");
  process.exit(1);
}
