import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html></html>");
(globalThis as unknown as { DOMParser: typeof DOMParser }).DOMParser =
  dom.window.DOMParser;
(globalThis as unknown as { document: Document }).document = dom.window.document;
(globalThis as unknown as { chrome: undefined }).chrome = undefined;

const { analyzeBrand } = await import("../src/lib/analyze.ts");
const { runSocialListening } = await import("../src/lib/socialListening.ts");
const { classifyBrand } = await import("../src/lib/brandTrendFit.ts");

for (const url of [
  "https://stripe.com",
  "https://activamedia.com.sg",
  "https://www.nike.com",
]) {
  const report = await analyzeBrand(url);
  const r = await runSocialListening(report);
  console.log(
    JSON.stringify(
      {
        url,
        brand: report.name,
        lanes: classifyBrand(report).lanes,
        audiences: report.audiences,
        audienceFocus: r.audienceFocus,
        tt: r.tiktokFeed.slice(0, 5).map((t) => ({
          title: t.title,
          fit: r.fitById[t.id],
          audience: r.audienceById[t.id],
          source: t.source.split(" · ")[0],
        })),
        ig: r.instagramFeed.slice(0, 4).map((t) => ({
          title: t.title,
          fit: r.fitById[t.id],
          audience: r.audienceById[t.id],
        })),
        sug: r.suggestions.slice(0, 3).map((s) => ({
          title: s.trendTitle,
          fit: s.fitScore,
          audience: s.targetAudience,
          angle: s.angle.slice(0, 90),
        })),
      },
      null,
      2,
    ),
  );
}
