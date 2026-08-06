import type { BrandReport, TrendSignal, TrendSuggestion } from "../types";
import { activeCalendarMoments } from "./calendarMoments";

const TIKTOK_FORMATS = [
  {
    id: "pov",
    title: "POV / day-in-the-life",
    summary: "First-person skits and “when your brand…” scenarios.",
  },
  {
    id: "duet-stitch",
    title: "Duet / Stitch bait",
    summary: "Leave a clear opinion so creators react and amplify.",
  },
  {
    id: "green-screen",
    title: "Green screen reaction",
    summary: "Talk over a headline, trailer still, or trending screenshot.",
  },
  {
    id: "sound-on",
    title: "Trending audio remix",
    summary: "Pair your hook with the audio that’s circulating this week.",
  },
  {
    id: "listicle",
    title: "3 things / ranking",
    summary: "Fast lists that earn saves and comment debates.",
  },
  {
    id: "grwm",
    title: "Get ready with me / process",
    summary: "Show the craft — packing, building, launching.",
  },
];

async function fetchText(url: string): Promise<string> {
  if (typeof window !== "undefined") {
    const res = await fetch(`/api/fetch-page?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error(`Trend fetch failed (${res.status})`);
    return res.text();
  }
  const res = await fetch(url, {
    headers: {
      "User-Agent": "BrandVibe/1.0 (+social-listening)",
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
  });
  if (!res.ok) throw new Error(`Trend fetch failed (${res.status})`);
  return res.text();
}

function decodeXml(s: string): string {
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

function parseRssTitles(xml: string, limit = 12): { title: string; link?: string }[] {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, limit);
  return items
    .map((m) => {
      const block = m[1] ?? "";
      const title = decodeXml(block.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "");
      const link = decodeXml(block.match(/<link>([\s\S]*?)<\/link>/i)?.[1] ?? "");
      return { title, link: link || undefined };
    })
    .filter((i) => i.title && !/^Google News$/i.test(i.title));
}

function categorizeTitle(title: string): TrendSignal["category"] {
  const t = title.toLowerCase();
  if (
    /\b(movie|film|trailer|box office|oscars|emmy|netflix|disney|marvel|cinema|season \d|premiere|series|tv)\b/.test(
      t,
    )
  ) {
    return "movie";
  }
  if (
    /\b(nfl|nba|mlb|soccer|football|tennis|olympics|world cup|match|tournament|stadium|ufc|f1)\b/.test(
      t,
    )
  ) {
    return "sports";
  }
  if (/\b(festival|concert|tour|coachella|grammy|award|pride|holiday)\b/.test(t)) {
    return "festival";
  }
  if (/\b(tiktok|viral|meme|challenge|duet|stitch|trend)\b/.test(t)) {
    return "tiktok";
  }
  return "news";
}

function slugId(prefix: string, title: string, i: number): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${prefix}-${slug || i}`;
}

/** Pull live search + entertainment signals and merge with calendar + TikTok formats. */
export async function listenToTrends(): Promise<TrendSignal[]> {
  const signals: TrendSignal[] = [];

  const [trendsXml, newsXml] = await Promise.all([
    fetchText("https://trends.google.com/trending/rss?geo=US").catch(() => ""),
    fetchText(
      "https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=en-US&gl=US&ceid=US:en",
    ).catch(() => ""),
  ]);

  if (trendsXml) {
    parseRssTitles(trendsXml, 14).forEach((item, i) => {
      signals.push({
        id: slugId("search", item.title, i),
        title: item.title,
        category: categorizeTitle(item.title) === "news" ? "search" : categorizeTitle(item.title),
        source: "Google Trends",
        heat: Math.max(35, 95 - i * 5),
        summary: `People are actively searching for “${item.title}” right now.`,
        url: item.link,
      });
    });
  }

  if (newsXml) {
    parseRssTitles(newsXml, 12).forEach((item, i) => {
      const category = categorizeTitle(item.title);
      signals.push({
        id: slugId("ent", item.title, i),
        title: item.title.replace(/\s+-\s+[^-]+$/, "").trim(),
        category: category === "search" ? "news" : category,
        source: "Entertainment headlines",
        heat: Math.max(30, 88 - i * 4),
        summary: `Entertainment / culture chatter: ${item.title}`,
        url: item.link,
      });
    });
  }

  activeCalendarMoments().forEach((m, i) => {
    signals.push({
      id: `cal-${m.id}`,
      title: m.title,
      category: m.category,
      source: "Cultural calendar",
      heat: 70 - i * 3,
      summary: m.summary,
    });
  });

  TIKTOK_FORMATS.forEach((f, i) => {
    signals.push({
      id: `tt-format-${f.id}`,
      title: f.title,
      category: "tiktok",
      source: "TikTok format radar",
      heat: 62 - i * 2,
      summary: f.summary,
    });
  });

  // Deduplicate by lowercase title
  const seen = new Set<string>();
  return signals.filter((s) => {
    const key = s.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isSensitiveTopic(title: string): boolean {
  return /\b(die|dies|died|death|killed|murder|hospice|funeral|shooting|assault|cancer|obituary|tragedy|missing child)\b/i.test(
    title,
  );
}

function cleanHeadline(title: string): string {
  return title
    .replace(/\s+-\s+[^-]+$/, "")
    .replace(/\s+\|\s+[^|]+$/, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 96);
}

function brandTokens(report: BrandReport): string[] {
  return [
    ...report.keywords,
    ...report.personality.map((p) => p.label.toLowerCase()),
    report.archetype.toLowerCase(),
    report.name.toLowerCase(),
    ...report.trends.map((t) => t.category),
  ].filter(Boolean);
}

function scoreFit(report: BrandReport, signal: TrendSignal): {
  score: number;
  reason: string;
} {
  const tokens = brandTokens(report);
  const topTrait = report.personality[0]?.label ?? "Bold";
  const text = `${signal.title} ${signal.summary} ${signal.category}`.toLowerCase();
  const isB2b = /ai|saas|pay|bank|cloud|dev|api|software|fintech|stripe|payments/.test(
    `${tokens.join(" ")} ${report.domain} ${report.description}`.toLowerCase(),
  );

  let score = 42;
  let reason = `Neutral cultural fit — usable as a light trend-jack for ${report.name}.`;

  if (isSensitiveTopic(signal.title)) {
    return { score: 5, reason: "Skipped — sensitive / tragic topic, not brand-safe to trend-jack." };
  }

  if (signal.category === "tiktok") {
    score += 22;
    reason = "Short-form format play — reliable engagement vehicle regardless of news cycle.";
  }
  if (signal.source === "Cultural calendar") {
    score += 16;
    reason = "Seasonal calendar moment — planable and brand-safe.";
  }
  if (signal.category === "movie" && /playful|bold|innovative/i.test(topTrait)) {
    score += 14;
    reason = `${topTrait} brands ride entertainment moments well with reaction / POV creative.`;
  }
  if (signal.category === "festival" && /warm|playful|premium/i.test(topTrait)) {
    score += 12;
    reason = `Seasonal moments match a ${topTrait.toLowerCase()} voice for lifestyle creative.`;
  }
  if (signal.category === "sports" && /bold|innovative|trustworthy/i.test(topTrait)) {
    score += 10;
    reason = "Sports metaphors map cleanly to performance / underdog storytelling.";
  }
  if (signal.category === "search" && tokens.some((t) => text.includes(t.toLowerCase()))) {
    score += 20;
    reason = "Keyword overlap with your brand language — high relevance spike.";
  }
  if (isB2b) {
    if (/football|celebrity|gossip|dating|livestream|family gives update/i.test(text)) {
      score -= 18;
      reason = "Low topical overlap for a product/B2B brand — only use as a witty aside.";
    }
    if (signal.category === "tiktok" || signal.source === "Cultural calendar") {
      score += 8;
    }
    if (/bitcoin|market|tariff|economy|tech|ai|cyber/i.test(text)) {
      score += 12;
      reason = "Macro/search topic adjacent to commerce or tech — solid explainer angle.";
    }
  }

  score += Math.round(signal.heat / 25);
  return { score: Math.max(8, Math.min(98, score)), reason };
}

function buildSuggestion(
  report: BrandReport,
  signal: TrendSignal,
  index: number,
): TrendSuggestion {
  const { score, reason } = scoreFit(report, signal);
  const brand = report.name;
  const trait = report.personality[0]?.label ?? "Bold";
  const title = cleanHeadline(signal.title);

  const platforms =
    signal.category === "tiktok"
      ? ["TikTok", "Instagram Reels"]
      : signal.category === "movie" || signal.category === "festival"
        ? ["TikTok", "Instagram", "X"]
        : ["LinkedIn", "X", "Instagram"];

  let headline = "";
  let angle = "";
  let hooks: string[] = [];
  let topicPrompt = "";

  if (signal.category === "tiktok") {
    headline = `${title} for ${brand}`;
    angle = `Run a ${title.toLowerCase()} using ${brand}'s ${trait.toLowerCase()} voice — keep the first second visual.`;
    hooks = [
      `POV: you finally get why ${brand} hits different…`,
      `Nobody asked but here’s ${brand} doing ${title.toLowerCase()}.`,
      `Stop scrolling if you’ve ever felt this about ${brand}.`,
    ];
    topicPrompt = `${title} TikTok/Reels for ${brand} — ${signal.summary}`;
  } else if (signal.category === "festival" || signal.source === "Cultural calendar") {
    headline = `${title} play for ${brand}`;
    angle = `Seasonal creative around ${title}: ${signal.summary}`;
    hooks = [
      `${title} energy, but make it ${brand}.`,
      `Our ${title} shortlist (only the useful stuff).`,
      `If ${title} had a product drop…`,
    ];
    topicPrompt = `${title} campaign angle for ${brand}`;
  } else if (signal.category === "movie") {
    headline = `Ride “${title}”`;
    angle = `Entertainment trend-jack: react, green-screen, or metaphor the plot into a ${brand} lesson — stay tasteful, no spoiler dumps.`;
    hooks = [
      `${title} but it’s actually a metaphor for ${brand}.`,
      `Unpopular opinion after ${title}:`,
      `The ${brand} scene that ${title} reminded us of…`,
    ];
    topicPrompt = `Trend-jack ${title} for ${brand} social (reaction + brand metaphor)`;
  } else if (signal.category === "sports") {
    headline = `${title} → brand performance story`;
    angle = `Borrow the underdog / clutch-moment frame without forced fandom unless you’re a real sponsor.`;
    hooks = [
      `Game-day energy applied to ${brand}:`,
      `What ${title} taught us about shipping…`,
      `Halftime tip from ${brand}:`,
    ];
    topicPrompt = `Sports-moment metaphor post about ${title} for ${brand}`;
  } else {
    headline = `Jump on “${title}”`;
    angle = `Search/news spike detected. Publish a fast take that teaches or clarifies — then loop a short-form cut.`;
    hooks = [
      `Everyone’s talking about ${title}. Here’s the ${brand} take:`,
      `${title}, explained in 15 seconds.`,
      `Don’t sleep on ${title} if you care about ${report.keywords[0] ?? "this space"}.`,
    ];
    topicPrompt = `Hot-take / explainer on ${title} in ${brand}'s voice`;
  }

  return {
    id: `sug-${signal.id}-${index}`,
    trendId: signal.id,
    trendTitle: title,
    category: signal.category,
    headline,
    angle,
    platforms,
    hookIdeas: hooks,
    topicPrompt,
    fitScore: score,
    fitReason: reason,
    timing:
      signal.source === "Cultural calendar"
        ? "seasonal"
        : signal.heat >= 70
          ? "now"
          : "this_week",
  };
}

/** Turn live social listening signals into ranked brand suggestions. */
export function suggestFromTrends(
  report: BrandReport,
  signals: TrendSignal[],
  limit = 8,
): TrendSuggestion[] {
  const scored = signals
    .map((s, i) => buildSuggestion(report, s, i))
    .filter((s) => s.fitScore >= 28)
    .sort((a, b) => b.fitScore - a.fitScore);

  const picked: TrendSuggestion[] = [];
  const usedCats = new Set<string>();

  // Guarantee at least one TikTok format if available
  const tiktok = scored.find((s) => s.category === "tiktok");
  if (tiktok) {
    picked.push(tiktok);
    usedCats.add("tiktok");
  }

  for (const s of scored) {
    if (picked.length >= limit) break;
    if (picked.some((p) => p.id === s.id)) continue;
    if (usedCats.has(s.category) && picked.length < Math.min(5, limit - 1)) continue;
    usedCats.add(s.category);
    picked.push(s);
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
}> {
  const signals = await listenToTrends();
  const suggestions = suggestFromTrends(report, signals);
  return {
    signals,
    suggestions,
    listenedAt: new Date().toISOString(),
  };
}
