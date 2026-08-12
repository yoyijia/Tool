/**
 * Smoke: live regional trends for a Singapore brand (broad set).
 * Run: npx tsx scripts/smoke-live-sg.ts
 */
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html></html>");
(globalThis as unknown as { DOMParser: typeof DOMParser }).DOMParser =
  dom.window.DOMParser;
(globalThis as unknown as { document: Document }).document = dom.window.document;
(globalThis as unknown as { chrome: undefined }).chrome = undefined;

const { analyzeBrand } = await import("../src/lib/analyze.ts");
const { fetchLiveCultureTrends } = await import("../src/lib/liveCulture.ts");
const { runSocialListening } = await import("../src/lib/socialListening.ts");

const report = await analyzeBrand("https://activamedia.com.sg");
const live = await fetchLiveCultureTrends(report);
const { liveFeed, dataNote } = await runSocialListening(report);

const onlyWatchlist =
  live.length > 0 &&
  live.every((t) =>
    /gst|voucher|spider|ndp|national day/i.test(t.label + t.headline),
  );
const hasBeyondWatchlist = live.some(
  (t) => !/gst|voucher|spider|ndp|national day/i.test(t.label + t.headline),
);

console.log(
  JSON.stringify(
    {
      brand: report.name,
      geo: report.geo,
      liveCount: live.length,
      liveFeedCount: liveFeed.length,
      sources: [...new Set(live.map((t) => t.source))],
      sample: live.slice(0, 8).map((t) => ({
        label: t.label,
        source: t.source,
        country: t.countryCode,
      })),
      dataNote,
      asserts: {
        countryIsSg: report.geo.countryCode === "SG",
        enoughLive: live.length >= 8,
        hasBeyondWatchlist,
        notOnlyWatchlist: !onlyWatchlist,
      },
    },
    null,
    2,
  ),
);

if (report.geo.countryCode !== "SG") {
  console.error("FAIL: expected SG geo for activamedia.com.sg");
  process.exit(1);
}
if (live.length < 8 || onlyWatchlist || !hasBeyondWatchlist) {
  console.error("FAIL: expected a broad SG live set beyond GST/NDP");
  process.exit(1);
}
