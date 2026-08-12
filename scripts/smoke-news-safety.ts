/**
 * Smoke: news safety + honest fit — bad news skipped, vague spikes low,
 * real bridges high.
 * Run: npx tsx scripts/smoke-news-safety.ts
 */
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html></html>");
(globalThis as unknown as { DOMParser: typeof DOMParser }).DOMParser =
  dom.window.DOMParser;
(globalThis as unknown as { document: Document }).document = dom.window.document;
(globalThis as unknown as { chrome: undefined }).chrome = undefined;

const { classifyNewsSafety, isPostableCulture } = await import(
  "../src/lib/newsSafety.ts"
);
const { analyzeBrand } = await import("../src/lib/analyze.ts");
const { adaptTrendForBrand, scoreBrandTrendFit } = await import(
  "../src/lib/brandTrendFit.ts"
);
const { fetchLiveCultureTrends } = await import("../src/lib/liveCulture.ts");
const { runSocialListening } = await import("../src/lib/socialListening.ts");

const report = await analyzeBrand("https://activamedia.com.sg");

const mk = (title: string, summary = "", category: "news" | "search" | "culture" = "news") => ({
  id: `t-${title}`,
  title,
  category,
  platform: "other" as const,
  source: "Google News SG · top",
  heat: 85,
  summary,
  tag: "live-sg",
});

const badNews = mk("Typhoon kills 12 as floods hit region");
const riskyNews = mk("CEO arrested over fraud investigation");
const vagueSpike = mk("airport", "Singapore is searching for “airport”.", "search");
const goodBridge = mk(
  "New healthcare marketing rules for clinics announced",
  "MOH updates advertising guidelines for medical clinics in Singapore.",
);
const postableCulture = mk(
  "New hawker food festival opens at Marina Bay",
  "Food festival celebration launches this weekend.",
  "culture",
);

const fits = {
  badNews: scoreBrandTrendFit(report, badNews),
  riskyNews: scoreBrandTrendFit(report, riskyNews),
  vagueSpike: scoreBrandTrendFit(report, vagueSpike),
  goodBridge: scoreBrandTrendFit(report, goodBridge),
  postableCulture: scoreBrandTrendFit(report, postableCulture),
};
const badBrief = adaptTrendForBrand(report, badNews);
const vagueBrief = adaptTrendForBrand(report, vagueSpike);

const live = await fetchLiveCultureTrends(report);
const { suggestions } = await runSocialListening(report);
const negInFeeds = live.filter(
  (t) => classifyNewsSafety(`${t.label} ${t.headline}`) !== "safe",
);
const negInSuggestions = suggestions.filter(
  (s) => classifyNewsSafety(s.trendTitle) !== "safe",
);

console.log(
  JSON.stringify(
    {
      classify: {
        badNews: classifyNewsSafety(badNews.title),
        riskyNews: classifyNewsSafety(riskyNews.title),
        vague: classifyNewsSafety(vagueSpike.title),
        postable: isPostableCulture(postableCulture.title),
      },
      fits: Object.fromEntries(
        Object.entries(fits).map(([k, v]) => [k, { score: v.score, reason: v.reason }]),
      ),
      badBriefAngle: badBrief.angle,
      vagueBriefAngle: vagueBrief.angle,
      liveCount: live.length,
      unsafeInLive: negInFeeds.map((t) => t.label),
      unsafeInSuggestions: negInSuggestions.map((s) => s.trendTitle),
      topSuggestions: suggestions.slice(0, 5).map((s) => ({
        title: s.trendTitle,
        fit: s.fitScore,
        reason: s.fitReason.slice(0, 90),
      })),
      asserts: {
        badLow: fits.badNews.score <= 15,
        riskyLow: fits.riskyNews.score <= 30,
        vagueLow: fits.vagueSpike.score <= 35,
        bridgeHigh: fits.goodBridge.score >= 55,
        cultureMid: fits.postableCulture.score >= 40,
        badBriefSaysSkip: /don’t post|skip/i.test(badBrief.angle),
        vagueBriefHonest: /no natural|skip/i.test(vagueBrief.angle),
        feedsClean: negInFeeds.length === 0,
        suggestionsClean: negInSuggestions.length === 0,
      },
    },
    null,
    2,
  ),
);

const a = {
  badLow: fits.badNews.score <= 15,
  riskyLow: fits.riskyNews.score <= 30,
  vagueLow: fits.vagueSpike.score <= 35,
  bridgeHigh: fits.goodBridge.score >= 55,
  badBriefSaysSkip: /don’t post|skip/i.test(badBrief.angle),
  vagueBriefHonest: /no natural|skip/i.test(vagueBrief.angle),
  feedsClean: negInFeeds.length === 0,
  suggestionsClean: negInSuggestions.length === 0,
};
for (const [k, ok] of Object.entries(a)) {
  if (!ok) {
    console.error(`FAIL: ${k}`);
    process.exit(1);
  }
}
