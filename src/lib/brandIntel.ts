import type { BrandReport } from "../types";
import { audienceKinds } from "./audience";
import { classifyBrand } from "./brandTrendFit";
import { geoFromReport } from "./brandGeo";
import { classifyNewsSafety, type NewsSafety } from "./newsSafety";

/** A dated, sourced mention of the analyzed brand. */
export interface BrandMention {
  title: string;
  url?: string;
  source: string;
  publishedAt?: string;
  safety: NewsSafety;
}

export interface BrandFacts {
  summary: string;
  url: string;
  source: string;
}

export interface BrandIntel {
  /** Query used for mention lookups (exact brand phrase) */
  query: string;
  newsMentions: BrandMention[];
  socialChatter: BrandMention[];
  facts: BrandFacts | null;
  /** Evidence lines backing the on-page analysis */
  evidence: string[];
  /** Honest note about coverage */
  coverageNote: string;
  fetchedAt: string;
}

async function fetchText(url: string): Promise<string> {
  if (typeof window !== "undefined") {
    const res = await fetch(`/api/fetch-page?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error(`Intel fetch failed (${res.status})`);
    return res.text();
  }
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; BrandVibe/1.0; +https://github.com/yoyijia/Tool)",
      Accept: "application/rss+xml, application/json, application/xml, text/xml, */*",
      "Accept-Language": "en,en-US;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`Intel fetch failed (${res.status})`);
  return res.text();
}

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();
}

function parseRss(
  xml: string,
  sourceLabel: string,
  limit: number,
): BrandMention[] {
  return [...xml.matchAll(/<(?:item|entry)>([\s\S]*?)<\/(?:item|entry)>/gi)]
    .slice(0, limit)
    .map((m) => {
      const block = m[1] ?? "";
      const title = decodeEntities(
        block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "",
      );
      const link =
        decodeEntities(block.match(/<link>([\s\S]*?)<\/link>/i)?.[1] ?? "") ||
        decodeEntities(block.match(/<link[^>]*href=["']([^"']+)["']/i)?.[1] ?? "") ||
        undefined;
      const date =
        decodeEntities(
          block.match(/<(?:pubDate|published|updated)>([\s\S]*?)<\/(?:pubDate|published|updated)>/i)?.[1] ??
            "",
        ) || undefined;
      const srcTag = decodeEntities(
        block.match(/<source[^>]*>([\s\S]*?)<\/source>/i)?.[1] ?? "",
      );
      return {
        title,
        url: link,
        source: srcTag || sourceLabel,
        publishedAt: date,
        safety: classifyNewsSafety(title),
      };
    })
    .filter((m) => m.title.length > 3);
}

/** Choose the most searchable brand phrase (short names beat SEO titles). */
export function brandQuery(report: BrandReport): string {
  const name = report.name.trim();
  // SEO-stuffed titles ("Best Digital Marketing Agency in Singapore") aren't a brand
  const looksSeo =
    name.length > 34 || /best |top |#1|leading |agency in /i.test(name);
  if (!looksSeo && name.length >= 3) return name;
  const stem = report.domain
    .replace(/^www\./, "")
    .split(".")[0]!
    .replace(/[-_]/g, " ")
    .trim();
  return stem.length >= 3
    ? stem.replace(/\b\w/g, (c) => c.toUpperCase())
    : name;
}

function buildEvidence(report: BrandReport, query: string): string[] {
  const out: string[] = [];
  if (report.geo) {
    out.push(
      `Market ${report.geo.countryName} (${report.geo.countryCode}) — ${report.geo.confidence} confidence: ${report.geo.signals.slice(0, 4).join(", ")}`,
    );
  }
  if (report.sourceSnippet) {
    out.push(`Homepage copy sampled: “${report.sourceSnippet.slice(0, 120)}…”`);
  }
  if (report.keywords?.length) {
    out.push(`Voice keywords from on-page language: ${report.keywords.slice(0, 5).join(", ")}`);
  }
  if (report.services?.length) {
    out.push(`Service lines detected on site: ${report.services.slice(0, 4).join(", ")}`);
  }
  if (report.socialProfiles?.length) {
    out.push(
      `Social profiles linked from the site: ${report.socialProfiles
        .map((s) => s.platform)
        .slice(0, 5)
        .join(", ")}`,
    );
  }
  out.push(`Mention lookups use the exact phrase “${query}”.`);
  return out;
}

/**
 * Pull live, sourced intelligence about the analyzed brand:
 * news mentions (Google News), social chatter (Reddit), and public facts
 * (Wikipedia) — each linked so claims can be verified.
 */
export async function gatherBrandIntel(report: BrandReport): Promise<BrandIntel> {
  const geo = geoFromReport(report);
  const query = brandQuery(report);
  const q = encodeURIComponent(`"${query}"`);

  const newsUrl = `https://news.google.com/rss/search?q=${q}+when:60d&hl=${geo.newsHl}&gl=${geo.newsGl}&ceid=${geo.newsCeid}`;
  const redditUrl = `https://www.reddit.com/search.rss?q=${q}&sort=new&limit=15`;
  const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    query.replace(/\s+/g, "_"),
  )}`;

  const [newsXml, redditXml, wikiJson] = await Promise.all([
    fetchText(newsUrl).catch(() => ""),
    fetchText(redditUrl).catch(() => ""),
    fetchText(wikiUrl).catch(() => ""),
  ]);

  const domainStem = report.domain.replace(/^www\./, "").split(".")[0]!.toLowerCase();

  // Context terms separate the company from same-name homonyms
  // (e.g. Stripe the payments company vs "Stripe Out Game" football promos)
  const offer = classifyBrand(report).primaryOffer.toLowerCase();
  const kinds = audienceKinds(report);
  const contextTerms = [
    ...offer.split(/[^a-z0-9]+/),
    ...(report.keywords ?? []).map((k) => k.toLowerCase()),
    ...(report.services ?? []).flatMap((s) => s.toLowerCase().split(/[^a-z0-9]+/)),
    domainStem,
    "startup",
    "company",
    "ceo",
    "funding",
    "launch",
    "platform",
    "app",
  ].filter((w) => w.length > 3);
  const isConsumerBrand = kinds.includes("athletes") || kinds.includes("consumers");
  const offTopic =
    /\b(football|nfl|nba|touchdown|kickoff|season opener|jersey|stadium|vs\.|game day|chiefs|bengals|playoff|zoo|animal|recipe)\b/i;

  const relevanceScore = (m: BrandMention): number => {
    const t = m.title.toLowerCase();
    if (
      !t.includes(query.toLowerCase()) &&
      !t.includes(domainStem) &&
      !query
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3)
        .every((w) => t.includes(w))
    ) {
      return -10;
    }
    let score = 0;
    for (const term of contextTerms) {
      if (t.includes(term)) score += 2;
    }
    if (!isConsumerBrand && offTopic.test(t)) score -= 5;
    return score;
  };

  const rankMentions = (list: BrandMention[]): BrandMention[] =>
    list
      .map((m) => ({ m, r: relevanceScore(m) }))
      .filter((x) => x.r >= 0)
      .sort((a, b) => b.r - a.r)
      .map((x) => x.m);

  const newsMentions = rankMentions(parseRss(newsXml, "Google News", 15));
  const socialChatter = rankMentions(parseRss(redditXml, "Reddit", 12));

  let facts: BrandFacts | null = null;
  if (wikiJson) {
    try {
      const parsed = JSON.parse(wikiJson) as {
        extract?: string;
        type?: string;
        content_urls?: { desktop?: { page?: string } };
        title?: string;
      };
      if (
        parsed.extract &&
        parsed.type !== "disambiguation" &&
        parsed.extract.length > 40
      ) {
        facts = {
          summary: parsed.extract.slice(0, 420),
          url:
            parsed.content_urls?.desktop?.page ??
            `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
          source: "Wikipedia",
        };
      }
    } catch {
      facts = null;
    }
  }

  const total = newsMentions.length + socialChatter.length;
  const coverageNote =
    total === 0
      ? `No recent verifiable mentions found for “${query}” — analysis rests on on-site signals only. Treat trend fits as directional.`
      : `${newsMentions.length} news mention${newsMentions.length === 1 ? "" : "s"} (60d) + ${socialChatter.length} social thread${socialChatter.length === 1 ? "" : "s"} back this profile. Each is linked — verify before citing.`;

  return {
    query,
    newsMentions: newsMentions.slice(0, 8),
    socialChatter: socialChatter.slice(0, 8),
    facts,
    evidence: buildEvidence(report, query),
    coverageNote,
    fetchedAt: new Date().toISOString(),
  };
}

/** Compact digest for prompt/listening contexts. */
export function intelDigest(intel: BrandIntel): string {
  const news = intel.newsMentions
    .filter((m) => m.safety === "safe")
    .slice(0, 3)
    .map((m) => m.title);
  const social = intel.socialChatter
    .filter((m) => m.safety === "safe")
    .slice(0, 2)
    .map((m) => m.title);
  const bits: string[] = [];
  if (intel.facts) bits.push(`Fact base: ${intel.facts.summary.slice(0, 160)}`);
  if (news.length) bits.push(`Recent coverage: ${news.join(" | ")}`);
  if (social.length) bits.push(`Social chatter: ${social.join(" | ")}`);
  if (!bits.length) bits.push("No verified external mentions — stay claims-light.");
  return bits.join(" ");
}
