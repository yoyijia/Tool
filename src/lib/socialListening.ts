import type { BrandReport, TrendSignal, TrendSuggestion } from "../types";
import { activeCalendarMoments } from "./calendarMoments";
import {
  adaptTrendForBrand,
  scoreBrandTrendFit,
} from "./brandTrendFit";
import { fetchLiveCultureTrends, liveTrendsToSignals } from "./liveCulture";

const LATER_TIKTOK = "https://later.com/blog/tiktok-trends/";
const LATER_INSTAGRAM = "https://later.com/blog/instagram-reels-trends/";
const SOCIALINSIDER_TIKTOK = "https://www.socialinsider.io/blog/tiktok-trends/";
const NEWENGEN_TIKTOK = "https://newengen.com/insights/august-tiktok-trends/";
const NEWENGEN_INSTAGRAM = "https://newengen.com/insights/instagram-trends/";
const BUFFER_TIKTOK_SONGS = "https://buffer.com/resources/trending-songs-tiktok/";
const SOCIALBEE_IG_SONGS = "https://socialbee.com/blog/trending-instagram-songs/";

async function fetchText(url: string): Promise<string> {
  if (typeof window !== "undefined") {
    const res = await fetch(`/api/fetch-page?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error(`Trend fetch failed (${res.status})`);
    return res.text();
  }
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; BrandVibe/1.0; +https://github.com/yoyijia/Tool)",
      Accept: "text/html,application/xhtml+xml,application/rss+xml,*/*",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`Trend fetch failed (${res.status})`);
  return res.text();
}

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).trim();
}

function slugId(prefix: string, title: string, i: number): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${prefix}-${slug || i}`;
}

function isSensitiveTopic(title: string): boolean {
  return /\b(die|dies|died|death|killed|murder|hospice|funeral|shooting|assault|cancer|obituary|tragedy|hate|racist|antisemitic)\b/i.test(
    title,
  );
}

interface DatedTrend {
  title: string;
  date: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
}

/**
 * Parse Later.com "Trend: Name — Month Day, Year" entries.
 * Titles/dates are often split across <b> tags, so we strip markup first.
 */
function parseLaterTrends(html: string, sourceUrl: string): DatedTrend[] {
  const out: DatedTrend[] = [];
  const heads = [...html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)];

  for (let i = 0; i < heads.length; i++) {
    const headMatch = heads[i]!;
    const headingText = stripTags(headMatch[1] ?? "");
    const m = headingText.match(
      /Trend:\s*(.+?)\s*[—–-]\s*([A-Za-z]+ \d{1,2}, \d{4})/i,
    );
    if (!m) continue;

    const title = (m[1] ?? "").replace(/\s+/g, " ").trim();
    const date = (m[2] ?? "").trim();
    if (!title || title.length < 2 || title.length > 120) continue;

    // Recap lives in the first paragraph after this heading
    const start = (headMatch.index ?? 0) + headMatch[0].length;
    const end = heads[i + 1]?.index ?? start + 3500;
    const slice = html.slice(start, Math.min(end, start + 3500));
    const recapBlock =
      slice.match(/Trend Recap:\s*([\s\S]*?)(?=<\/p>|<h3|$)/i)?.[1] ||
      slice.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ||
      "";
    const summary =
      stripTags(recapBlock).slice(0, 220) ||
      `Curated platform trend · updated ${date}`;

    out.push({
      title,
      date,
      summary,
      sourceUrl,
      sourceName: "Later Trends",
    });
  }

  return dedupeDated(out);
}

/** New Engen weekly “Trend #N: Name” format lists. */
function parseNewEngenTrends(
  html: string,
  sourceUrl: string,
  asOfLabel: string,
): DatedTrend[] {
  const out: DatedTrend[] = [];
  const heads = [...html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)];
  for (let i = 0; i < heads.length; i++) {
    const heading = stripTags(heads[i]![1] ?? "");
    const m = heading.match(/^Trend\s*#?\d*:\s*(.+)$/i);
    if (!m) continue;
    const title = (m[1] ?? "").replace(/\s+/g, " ").trim();
    if (!title || title.length < 3 || title.length > 100) continue;
    const start = (heads[i]!.index ?? 0) + heads[i]![0].length;
    const end = heads[i + 1]?.index ?? start + 2800;
    const slice = html.slice(start, Math.min(end, start + 2800));
    const summary =
      stripTags(slice.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "").slice(0, 220) ||
      `Weekly platform trend · ${asOfLabel}`;
    out.push({
      title,
      date: asOfLabel,
      summary,
      sourceUrl,
      sourceName: "New Engen Weekly",
    });
  }
  return dedupeDated(out);
}

/** Buffer “N. Song name” TikTok audio chart. */
function parseBufferTikTokSongs(html: string): DatedTrend[] {
  const out: DatedTrend[] = [];
  const heads = [...html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)];
  for (let i = 0; i < heads.length; i++) {
    const heading = stripTags(heads[i]![1] ?? "");
    const m = heading.match(/^\d{1,2}\.\s+(.+)$/);
    if (!m) continue;
    const title = decodeEntities((m[1] ?? "").replace(/\s+/g, " ").trim());
    if (!title || title.length < 2 || title.length > 90) continue;
    const start = (heads[i]!.index ?? 0) + heads[i]![0].length;
    const end = heads[i + 1]?.index ?? start + 2200;
    const summary =
      stripTags(html.slice(start, Math.min(end, start + 2200)).match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "").slice(
        0,
        220,
      ) || "Trending TikTok audio (Buffer August chart).";
    out.push({
      title,
      date: "August 5, 2026",
      summary,
      sourceUrl: BUFFER_TIKTOK_SONGS,
      sourceName: "Buffer Sounds",
    });
  }
  return dedupeDated(out).slice(0, 13);
}

/** SocialBee dated Instagram songs — last few weekly sections (2 tracks each). */
function parseSocialBeeIgSongs(html: string): DatedTrend[] {
  const heads = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)];
  const out: DatedTrend[] = [];
  let weeks = 0;
  for (let i = 0; i < heads.length && weeks < 3; i++) {
    const label = stripTags(heads[i]![1] ?? "");
    const m = label.match(
      /\(([A-Za-z]+ \d{1,2}, \d{4})\)\s*Instagram viral songs and sounds/i,
    );
    if (!m) continue;
    weeks += 1;
    const date = (m[1] ?? "August 5, 2026").trim();
    const start = (heads[i]!.index ?? 0) + heads[i]![0].length;
    const end = heads[i + 1]?.index ?? start + 20_000;
    const chunk = html.slice(start, end);
    for (const hm of chunk.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)) {
      const title = stripTags(hm[1] ?? "");
      if (!title || title.length < 3 || title.length > 100) continue;
      if (/network integrations|related|faq|channels|tools/i.test(title)) continue;
      out.push({
        title,
        date,
        summary: `Trending Instagram Reel audio · SocialBee chart ${date}.`,
        sourceUrl: SOCIALBEE_IG_SONGS,
        sourceName: "SocialBee Sounds",
      });
    }
  }
  return dedupeDated(out).slice(0, 12);
}

function dedupeDated(items: DatedTrend[]): DatedTrend[] {
  const seen = new Set<string>();
  return items.filter((t) => {
    const key = t.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Parse Socialinsider month headings as backup TikTok names. */
function parseSocialinsider(html: string): DatedTrend[] {
  const out: DatedTrend[] = [];
  const monthBlock = html.match(
    /TikTok trends in (January|February|March|April|May|June|July|August|September|October|November|December) (\d{4})([\s\S]*?)(?=TikTok trends in [A-Za-z]+ \d{4}|$)/i,
  );
  if (!monthBlock) return out;
  const month = `${monthBlock[1]} ${monthBlock[2]}`;
  const chunk = monthBlock[3] ?? "";
  const heads = [...chunk.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)]
    .map((m) => stripTags(m[1] ?? ""))
    .filter((h) => h && h.length < 80 && !/tiktok trends in/i.test(h));

  heads.forEach((title) => {
    out.push({
      title,
      date: month,
      summary: `Reported TikTok trend (${month}) via Socialinsider.`,
      sourceUrl: SOCIALINSIDER_TIKTOK,
      sourceName: "Socialinsider",
    });
  });
  return out;
}

function daysSince(dateLabel: string): number {
  const parsed = Date.parse(dateLabel);
  if (Number.isNaN(parsed)) return 45;
  return Math.max(0, Math.round((Date.now() - parsed) / 86400000));
}

function heatFromDate(dateLabel: string): number {
  const d = daysSince(dateLabel);
  if (d <= 3) return 96;
  if (d <= 10) return 88;
  if (d <= 20) return 76;
  if (d <= 35) return 64;
  return 50;
}

function parseRssTitles(xml: string, limit = 10): { title: string; link?: string }[] {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, limit);
  return items
    .map((m) => {
      const block = m[1] ?? "";
      const title = decodeEntities(block.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "");
      const link = decodeEntities(block.match(/<link>([\s\S]*?)<\/link>/i)?.[1] ?? "");
      return { title, link: link || undefined };
    })
    .filter((i) => i.title && !/^Google News$/i.test(i.title));
}

function pushPlatformTrends(
  signals: TrendSignal[],
  items: DatedTrend[],
  platform: "tiktok" | "instagram",
  prefix: string,
) {
  const seen = new Set(
    signals
      .filter((s) => s.platform === platform)
      .map((s) => s.title.toLowerCase()),
  );
  items
    .filter((t) => daysSince(t.date) <= 75)
    .forEach((t, i) => {
      if (isSensitiveTopic(t.title)) return;
      const key = t.title.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      signals.push({
        id: slugId(prefix, t.title, i),
        title: t.title,
        category: platform,
        platform,
        source: `${t.sourceName} · ${t.date}`,
        heat: heatFromDate(t.date),
        summary: t.summary,
        url: t.sourceUrl,
        tag: undefined,
      });
    });
}

/** Pull TikTok + Instagram roundups plus live SG culture/search trends. */
export async function listenToTrends(report?: BrandReport): Promise<TrendSignal[]> {
  const signals: TrendSignal[] = [];

  const [
    ttHtml,
    igHtml,
    siHtml,
    neTtHtml,
    neIgHtml,
    bufferHtml,
    beeHtml,
    searchSgXml,
    liveCulture,
  ] = await Promise.all([
    fetchText(LATER_TIKTOK).catch(() => ""),
    fetchText(LATER_INSTAGRAM).catch(() => ""),
    fetchText(SOCIALINSIDER_TIKTOK).catch(() => ""),
    fetchText(NEWENGEN_TIKTOK).catch(() => ""),
    fetchText(NEWENGEN_INSTAGRAM).catch(() => ""),
    fetchText(BUFFER_TIKTOK_SONGS).catch(() => ""),
    fetchText(SOCIALBEE_IG_SONGS).catch(() => ""),
    fetchText("https://trends.google.com/trending/rss?geo=SG").catch(() => ""),
    report
      ? fetchLiveCultureTrends(report).catch(() => [])
      : Promise.resolve([]),
  ]);

  const ttLater = ttHtml ? parseLaterTrends(ttHtml, LATER_TIKTOK) : [];
  const igLater = igHtml ? parseLaterTrends(igHtml, LATER_INSTAGRAM) : [];
  const ttBackup = !ttLater.length && siHtml ? parseSocialinsider(siHtml) : [];
  const ttWeekly = neTtHtml
    ? parseNewEngenTrends(neTtHtml, NEWENGEN_TIKTOK, "August 5, 2026")
    : [];
  const igWeekly = neIgHtml
    ? parseNewEngenTrends(neIgHtml, NEWENGEN_INSTAGRAM, "August 5, 2026")
    : [];
  const ttSongs = bufferHtml ? parseBufferTikTokSongs(bufferHtml) : [];
  const igSongs = beeHtml ? parseSocialBeeIgSongs(beeHtml) : [];

  // Freshest first: Later dated drops → weekly format lists → sound charts → backup
  pushPlatformTrends(
    signals,
    [...ttLater, ...ttWeekly, ...ttSongs, ...ttBackup],
    "tiktok",
    "tiktok",
  );
  pushPlatformTrends(
    signals,
    [...igLater, ...igWeekly, ...igSongs],
    "instagram",
    "instagram",
  );

  // Live SG culture (GST vouchers, Spider-Man Brand New Day, NDP, …)
  liveTrendsToSignals(liveCulture).forEach((s) => {
    if (isSensitiveTopic(s.title)) return;
    signals.push(s);
  });

  // SG search spikes — clearly labeled
  if (searchSgXml) {
    parseRssTitles(searchSgXml, 8).forEach((item, i) => {
      if (isSensitiveTopic(item.title)) return;
      if (liveCulture.some((l) => l.label.toLowerCase() === item.title.toLowerCase())) return;
      signals.push({
        id: slugId("search", item.title, i),
        title: item.title,
        category: "search",
        platform: "other",
        source: "Google Trends SG (search)",
        heat: Math.max(40, 85 - i * 5),
        summary: `Singapore is searching for “${item.title}” right now.`,
        url: item.link,
      });
    });
  }

  activeCalendarMoments().forEach((m, i) => {
    signals.push({
      id: `cal-${m.id}`,
      title: m.title,
      category: m.category === "festival" ? "festival" : m.category,
      platform: "other",
      source: "Cultural calendar",
      heat: 62 - i * 3,
      summary: m.summary,
    });
  });

  if (!signals.some((s) => s.platform === "tiktok") && !liveCulture.length) {
    throw new Error(
      "Could not load TikTok trend roundups. Check network / proxy and try again.",
    );
  }

  return signals;
}

function buildSuggestion(
  report: BrandReport,
  signal: TrendSignal,
  index: number,
): TrendSuggestion {
  const { score, reason } = scoreBrandTrendFit(report, signal);
  const adapted = adaptTrendForBrand(report, signal);
  const title = signal.title;

  const platforms =
    signal.platform === "tiktok"
      ? ["TikTok", "Instagram Reels"]
      : signal.platform === "instagram"
        ? ["Instagram Reels", "TikTok"]
        : ["LinkedIn", "X", "Instagram"];

  const platformLabel =
    signal.platform === "tiktok"
      ? "TikTok"
      : signal.platform === "instagram"
        ? "Instagram"
        : signal.tag === "live-sg" || /News SG|Trends SG/i.test(signal.source)
          ? "Live SG"
          : "Moment";

  return {
    id: `sug-${signal.id}-${index}`,
    trendId: signal.id,
    trendTitle: title,
    category: signal.category,
    platform: signal.platform,
    headline: `${platformLabel} · ${title} → ${report.name}`,
    angle: adapted.angle,
    platforms,
    hookIdeas: adapted.hooks,
    topicPrompt: adapted.topicPrompt,
    fitScore: score,
    fitReason: reason,
    timing: signal.heat >= 85 ? "now" : signal.heat >= 65 ? "this_week" : "seasonal",
    voiceBlend: adapted.voiceBlend,
  };
}

export function suggestFromTrends(
  report: BrandReport,
  signals: TrendSignal[],
  limit = 10,
): TrendSuggestion[] {
  const scored = signals
    .map((s, i) => buildSuggestion(report, s, i))
    .filter((s) => s.fitScore >= 42)
    .sort((a, b) => b.fitScore - a.fitScore);

  const picked: TrendSuggestion[] = [];
  // Best brand-matched TikTok + IG first
  for (const platform of ["tiktok", "instagram"] as const) {
    const hit = scored.find((s) => s.platform === platform && s.fitScore >= 50);
    if (hit) picked.push(hit);
  }
  for (const s of scored) {
    if (picked.length >= limit) break;
    if (!picked.some((p) => p.id === s.id)) picked.push(s);
  }
  return picked.slice(0, limit);
}

function sortByBrandFit(report: BrandReport, signals: TrendSignal[]): TrendSignal[] {
  return [...signals].sort((a, b) => {
    const sa = scoreBrandTrendFit(report, a).score;
    const sb = scoreBrandTrendFit(report, b).score;
    if (sb !== sa) return sb - sa;
    return b.heat - a.heat;
  });
}

export async function runSocialListening(report: BrandReport): Promise<{
  signals: TrendSignal[];
  suggestions: TrendSuggestion[];
  listenedAt: string;
  tiktokFeed: TrendSignal[];
  instagramFeed: TrendSignal[];
  liveFeed: TrendSignal[];
  fitById: Record<string, number>;
  dataNote: string;
}> {
  const signals = await listenToTrends(report);
  const suggestions = suggestFromTrends(report, signals);
  const fitById: Record<string, number> = {};
  for (const s of signals) {
    fitById[s.id] = scoreBrandTrendFit(report, s).score;
  }
  const tiktokFeed = sortByBrandFit(
    report,
    signals.filter((s) => s.platform === "tiktok"),
  );
  const instagramFeed = sortByBrandFit(
    report,
    signals.filter((s) => s.platform === "instagram"),
  );
  const liveFeed = sortByBrandFit(
    report,
    signals.filter(
      (s) =>
        s.tag === "live-sg" ||
        s.source.includes("News SG") ||
        s.source.includes("Trends SG"),
    ),
  );
  return {
    signals,
    suggestions,
    listenedAt: new Date().toISOString(),
    tiktokFeed,
    instagramFeed,
    liveFeed,
    fitById,
    dataNote:
      "Trends are ranked for this company (industry + audiences + services), then freshness. Sources: Later, New Engen, Buffer/SocialBee, Google Trends/News SG — not in-app Creative Center charts.",
  };
}
