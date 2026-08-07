import { JSDOM } from "jsdom";
const dom = new JSDOM("<!DOCTYPE html><html></html>");
(globalThis as unknown as { DOMParser: typeof DOMParser }).DOMParser = dom.window.DOMParser;
(globalThis as unknown as { document: Document }).document = dom.window.document;
(globalThis as unknown as { chrome: undefined }).chrome = undefined;
const { analyzeBrand } = await import("../src/lib/analyze.ts");
const { runSocialListening } = await import("../src/lib/socialListening.ts");
const { buildMonthSchedule } = await import("../src/lib/contentSchedule.ts");
const { classifyBrand } = await import("../src/lib/brandTrendFit.ts");
for (const url of ["https://stripe.com", "https://activamedia.com.sg", "https://www.nike.com"]) {
  const report = await analyzeBrand(url);
  const r = await runSocialListening(report);
  const slots = buildMonthSchedule(report, new Date(2026, 7, 7));
  const dog = slots.find((s) => /dog/i.test(s.title));
  console.log(JSON.stringify({
    url,
    brand: report.name,
    lanes: classifyBrand(report).lanes,
    services: report.services?.slice(0,3),
    audiences: report.audiences,
    tt: r.tiktokFeed.slice(0,5).map((t) => `${r.fitById[t.id]} ${t.title}`),
    sug: r.suggestions.slice(0,3).map((s) => `${s.fitScore} ${s.trendTitle} :: ${s.angle.slice(0,70)}`),
    dog: dog?.title,
    gucci: JSON.stringify(slots).includes("Gucci"),
  }, null, 2));
}
