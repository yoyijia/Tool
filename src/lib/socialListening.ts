import type { BrandReport, TrendSignal, TrendSuggestion } from "../types";
import { activeCalendarMoments } from "./calendarMoments";

const LATER_TIKTOK = "https://later.com/blog/tiktok-trends/";
const LATER_INSTAGRAM = "https://later.com/blog/instagram-reels-trends/";
const SOCIALINSIDER_TIKTOK = "https://www.socialinsider.io/blog/tiktok-trends/";

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

  // Deduplicate by title, keep newest occurrence (Later lists newest first)
  const seen = new Set<string>();
  return out.filter((t) => {
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

/** Pull TikTok + Instagram trends from curated platform roundups (dated), not generic news. */
export async function listenToTrends(): Promise<TrendSignal[]> {
  const signals: TrendSignal[] = [];

  const [ttHtml, igHtml, siHtml, searchXml] = await Promise.all([
    fetchText(LATER_TIKTOK).catch(() => ""),
    fetchText(LATER_INSTAGRAM).catch(() => ""),
    fetchText(SOCIALINSIDER_TIKTOK).catch(() => ""),
    fetchText("https://trends.google.com/trending/rss?geo=US").catch(() => ""),
  ]);

  const ttLater = ttHtml ? parseLaterTrends(ttHtml, LATER_TIKTOK) : [];
  const igLater = igHtml ? parseLaterTrends(igHtml, LATER_INSTAGRAM) : [];
  const ttBackup = !ttLater.length && siHtml ? parseSocialinsider(siHtml) : [];

  // Prefer fresher roundup items so the feed feels current
  const recentTt = [...ttLater, ...ttBackup]
    .filter((t) => daysSince(t.date) <= 75)
    .slice(0, 18);
  const recentIg = igLater.filter((t) => daysSince(t.date) <= 75).slice(0, 18);

  recentTt.forEach((t, i) => {
    if (isSensitiveTopic(t.title)) return;
    signals.push({
      id: slugId("tiktok", t.title, i),
      title: t.title,
      category: "tiktok",
      platform: "tiktok",
      source: `${t.sourceName} · ${t.date}`,
      heat: heatFromDate(t.date),
      summary: t.summary,
      url: t.sourceUrl,
      tag: undefined,
    });
  });

  recentIg.forEach((t, i) => {
    if (isSensitiveTopic(t.title)) return;
    signals.push({
      id: slugId("instagram", t.title, i),
      title: t.title,
      category: "instagram",
      platform: "instagram",
      source: `${t.sourceName} · ${t.date}`,
      heat: heatFromDate(t.date),
      summary: t.summary,
      url: t.sourceUrl,
      tag: undefined,
    });
  });

  // Search spikes stay clearly labeled as Search — not TikTok/IG
  if (searchXml) {
    parseRssTitles(searchXml, 8).forEach((item, i) => {
      if (isSensitiveTopic(item.title)) return;
      signals.push({
        id: slugId("search", item.title, i),
        title: item.title,
        category: "search",
        platform: "other",
        source: "Google Trends (search, not TikTok/IG)",
        heat: Math.max(40, 85 - i * 5),
        summary: `People are searching for “${item.title}” — useful context, not a platform trend list.`,
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

  if (!signals.some((s) => s.platform === "tiktok")) {
    throw new Error(
      "Could not load TikTok trend roundups. Check network / proxy and try again.",
    );
  }

  return signals;
}

function describeVoice(report: BrandReport): string {
  const top = report.personality
    .slice(0, 2)
    .map((p) => p.label.toLowerCase())
    .join(" + ");
  const dims = report.voiceDimensions
    .map((d) => (d.value >= 55 ? d.right : d.left).toLowerCase())
    .slice(0, 3)
    .join(", ");
  return `${report.archetype} (${top || "bold"}; ${dims || "clear"})`;
}

function voiceBlendLine(report: BrandReport, signal: TrendSignal): string {
  const trait = report.personality[0]?.label ?? "Bold";
  if (signal.platform === "tiktok") {
    return `Keep the native TikTok format of “${signal.title}”, but deliver the punchline in ${report.name}'s ${trait.toLowerCase()} voice — ${describeVoice(report)}.`;
  }
  if (signal.platform === "instagram") {
    return `Shoot it as a Reel/carousel beat for “${signal.title}”, caption in ${report.name}'s voice: ${report.voiceSummary}`;
  }
  return `If you use this moment, filter it through ${describeVoice(report)}. ${report.voiceSummary}`;
}

function scoreFit(report: BrandReport, signal: TrendSignal): {
  score: number;
  reason: string;
} {
  const topTrait = report.personality[0]?.label ?? "Bold";
  const text = `${signal.title} ${signal.summary}`.toLowerCase();
  const tokens = [
    ...report.keywords.map((k) => k.toLowerCase()),
    report.name.toLowerCase(),
  ];
  const isB2b = /ai|saas|pay|bank|cloud|dev|api|software|fintech|stripe|payments/.test(
    `${tokens.join(" ")} ${report.domain} ${report.description}`.toLowerCase(),
  );

  let score = 48;
  let reason = `Solid creative prompt for ${report.name} if adapted carefully.`;

  if (signal.platform === "tiktok") {
    score += 22;
    reason = "From a dated TikTok trend roundup — higher confidence than generic news.";
  }
  if (signal.platform === "instagram") {
    score += 20;
    reason = "From a dated Instagram Reels trend roundup.";
  }
  if (signal.heat >= 88) {
    score += 10;
    reason += " Fresh (updated in the last few days).";
  }
  if (tokens.some((t) => text.includes(t))) {
    score += 12;
    reason = "Overlaps your brand language.";
  }
  if (isB2b && /horror|bob|spain|ghosting|girlhood|pilates/i.test(text)) {
    score -= 8;
    reason = "Playful consumer trend — works if you lean witty, not literal.";
  }
  if (/playful|bold|innovative/i.test(topTrait) && signal.platform !== "other") {
    score += 6;
  }

  score += Math.round(signal.heat / 30);
  return { score: Math.max(20, Math.min(98, score)), reason };
}

function buildSuggestion(
  report: BrandReport,
  signal: TrendSignal,
  index: number,
): TrendSuggestion {
  const { score, reason } = scoreFit(report, signal);
  const brand = report.name;
  const trait = report.personality[0]?.label ?? "Bold";
  const title = signal.title;
  const blend = voiceBlendLine(report, signal);

  const platforms =
    signal.platform === "tiktok"
      ? ["TikTok", "Instagram Reels"]
      : signal.platform === "instagram"
        ? ["Instagram Reels", "TikTok"]
        : ["LinkedIn", "X", "Instagram"];

  let headline = "";
  let angle = "";
  let hooks: string[] = [];
  let topicPrompt = "";

  if (signal.platform === "tiktok") {
    headline = `TikTok · ${title}`;
    angle = `${blend} Context: ${signal.summary}`;
    hooks = [
      `POV: ${brand} does “${title}”…`,
      `“${title}” but make it ${trait.toLowerCase()} — ${brand} edition.`,
      `Stop scrolling. ${brand}'s version of ${title}:`,
    ];
    topicPrompt = `Use the TikTok trend “${title}” (${signal.source}) in ${brand}'s ${trait.toLowerCase()} voice. ${signal.summary}`;
  } else if (signal.platform === "instagram") {
    headline = `Instagram · ${title}`;
    angle = `${blend} Context: ${signal.summary}`;
    hooks = [
      `“${title}” — told the ${brand} way.`,
      `Reels beat: ${title}. Caption energy = ${trait.toLowerCase()}.`,
      `Save this if you’re into ${title} + ${brand}.`,
    ];
    topicPrompt = `Use the Instagram Reels trend “${title}” (${signal.source}) with ${brand}'s ${report.archetype} voice.`;
  } else if (signal.category === "festival" || signal.source === "Cultural calendar") {
    headline = `${title} for ${brand}`;
    angle = blend;
    hooks = [`${title} energy, but make it ${brand}.`, `Our ${title} shortlist.`];
    topicPrompt = `${title} campaign angle for ${brand}`;
  } else {
    headline = `Search spike · ${title}`;
    angle = `${blend} This is search interest, not a TikTok/IG official trend.`;
    hooks = [
      `Everyone’s searching ${title}. ${brand}'s take:`,
      `${title}, explained in 15 seconds.`,
    ];
    topicPrompt = `Explainer on search spike “${title}” in ${brand}'s voice`;
  }

  return {
    id: `sug-${signal.id}-${index}`,
    trendId: signal.id,
    trendTitle: title,
    category: signal.category,
    platform: signal.platform,
    headline,
    angle,
    platforms,
    hookIdeas: hooks,
    topicPrompt,
    fitScore: score,
    fitReason: reason,
    timing: signal.heat >= 85 ? "now" : signal.heat >= 65 ? "this_week" : "seasonal",
    voiceBlend: blend,
  };
}

export function suggestFromTrends(
  report: BrandReport,
  signals: TrendSignal[],
  limit = 10,
): TrendSuggestion[] {
  const scored = signals
    .map((s, i) => buildSuggestion(report, s, i))
    .filter((s) => s.fitScore >= 28)
    .sort((a, b) => b.fitScore - a.fitScore);

  const picked: TrendSuggestion[] = [];
  for (const platform of ["tiktok", "instagram"] as const) {
    const hit = scored.find((s) => s.platform === platform);
    if (hit) picked.push(hit);
  }
  for (const s of scored) {
    if (picked.length >= limit) break;
    if (!picked.some((p) => p.id === s.id)) picked.push(s);
  }
  return picked.slice(0, limit);
}

export async function runSocialListening(report: BrandReport): Promise<{
  signals: TrendSignal[];
  suggestions: TrendSuggestion[];
  listenedAt: string;
  tiktokFeed: TrendSignal[];
  instagramFeed: TrendSignal[];
  dataNote: string;
}> {
  const signals = await listenToTrends();
  const suggestions = suggestFromTrends(report, signals);
  const tiktokFeed = signals.filter((s) => s.platform === "tiktok");
  const instagramFeed = signals.filter((s) => s.platform === "instagram");
  return {
    signals,
    suggestions,
    listenedAt: new Date().toISOString(),
    tiktokFeed,
    instagramFeed,
    dataNote:
      "These are named trends from dated Later.com TikTok / Instagram Reels roundups (with Socialinsider as TikTok backup) — not live Creative Center charts or in-app For You rankings. Official TikTok/IG trend APIs are not publicly available; each card shows its published update date.",
  };
}
