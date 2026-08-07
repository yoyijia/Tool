import type { BrandReport, TrendSignal, TrendSuggestion } from "../types";
import { activeCalendarMoments } from "./calendarMoments";

const TIKTOK_FORMATS = [
  {
    id: "pov",
    title: "POV / day-in-the-life",
    summary: "First-person skits and “when your brand…” scenarios.",
    tag: "#POV",
  },
  {
    id: "duet-stitch",
    title: "Duet / Stitch bait",
    summary: "Leave a clear opinion so creators react and amplify.",
    tag: "#Stitch",
  },
  {
    id: "green-screen",
    title: "Green screen reaction",
    summary: "Talk over a headline, trailer still, or trending screenshot.",
    tag: "#GreenScreen",
  },
  {
    id: "sound-on",
    title: "Trending audio remix",
    summary: "Pair your hook with the audio that’s circulating this week.",
    tag: "#ForYou",
  },
  {
    id: "listicle",
    title: "3 things / ranking",
    summary: "Fast lists that earn saves and comment debates.",
    tag: "#Storytime",
  },
  {
    id: "grwm",
    title: "Get ready with me / process",
    summary: "Show the craft — packing, building, launching.",
    tag: "#GRWM",
  },
];

const IG_FORMATS = [
  {
    id: "carousel",
    title: "Carousel myth-bust",
    summary: "Swipeable tips with a save-worthy last slide.",
    tag: "#Reels",
  },
  {
    id: "reels-hook",
    title: "Reels hook in 1s",
    summary: "Text-on-screen cold open that earns the rewatch.",
    tag: "#InstagramReels",
  },
  {
    id: "collab",
    title: "Collab / UGC stitch",
    summary: "Creator or customer voice as the proof layer.",
    tag: "#UGC",
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
      "User-Agent":
        "Mozilla/5.0 (compatible; BrandVibe/1.0; +https://github.com/yoyijia/Tool)",
      Accept: "application/rss+xml, application/xml, text/xml, text/html, */*",
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
    .replace(/&#x27;/gi, "'")
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
  if (/\binstagram|reels?\b/.test(t)) return "instagram";
  if (/\btiktok|for you|fyp\b/.test(t)) return "tiktok";
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
  if (/\b(viral|meme|challenge|duet|stitch|trend)\b/.test(t)) return "tiktok";
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

function isSensitiveTopic(title: string): boolean {
  return /\b(die|dies|died|death|killed|murder|hospice|funeral|shooting|assault|cancer|obituary|tragedy|missing child|cutting himself|self-harm|antisemitic|racist|hate speech|vandalism|police)\b/i.test(
    title,
  );
}

function cleanHeadline(title: string): string {
  return title
    .replace(/\s*[-–—|]\s*[^-–—|]{2,40}$/u, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 96);
}

/** Extract a short trend label from a news headline about TikTok/IG. */
function extractTrendLabel(title: string): string {
  const cleaned = cleanHeadline(title);

  // Explicit quoted trend / challenge names
  const quoted = cleaned.match(/[“"]([^”"]{4,60})[”"]/) || cleaned.match(/'([^']{4,60})'/);
  if (quoted?.[1]) return quoted[1].trim();

  const challenge = cleaned.match(
    /(?:TikTok|Instagram)\s+challenge[:\s]+(.+)$/i,
  );
  if (challenge?.[1]) return challenge[1].replace(/[.!?].*$/, "").trim().slice(0, 72);

  // Keep meaningful platform headlines intact (timing tips, product features, memes)
  if (/instagram reels|tiktok/i.test(cleaned)) {
    return cleaned
      .replace(/^(why|how|this|the)\s+/i, "")
      .slice(0, 80);
  }

  return cleaned.slice(0, 80);
}

function parseDayTrends(html: string): string[] {
  const found: string[] = [];
  const re = /href="\/united-states\/trend\/([^"/]+)\/"[^>]*>([^<]+)<\/a>/gi;
  for (const m of html.matchAll(re)) {
    const label = decodeXml(decodeURIComponent(m[2] ?? m[1] ?? "")).trim();
    if (
      !label ||
      /^(top|trending|now|yesterday|help|week ago|month ago|year ago|\d+h)$/i.test(label)
    ) {
      continue;
    }
    if (!found.includes(label)) found.push(label);
  }
  return found.slice(0, 24);
}

/** Pull live TikTok, Instagram, and cross-platform social signals. */
export async function listenToTrends(): Promise<TrendSignal[]> {
  const signals: TrendSignal[] = [];

  const [
    trendsXml,
    newsXml,
    tiktokNewsXml,
    igNewsXml,
    dayTrendsHtml,
  ] = await Promise.all([
    fetchText("https://trends.google.com/trending/rss?geo=US").catch(() => ""),
    fetchText(
      "https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=en-US&gl=US&ceid=US:en",
    ).catch(() => ""),
    fetchText(
      "https://news.google.com/rss/search?q=%22viral%20on%20TikTok%22%20OR%20%22TikTok%20trending%22%20OR%20%22TikTok%20challenge%22&hl=en-US&gl=US&ceid=US:en",
    ).catch(() => ""),
    fetchText(
      "https://news.google.com/rss/search?q=%22Instagram%20Reels%22%20OR%20%22trending%20on%20Instagram%22%20OR%20%22viral%20on%20Instagram%22&hl=en-US&gl=US&ceid=US:en",
    ).catch(() => ""),
    fetchText("https://getdaytrends.com/united-states/").catch(() => ""),
  ]);

  if (tiktokNewsXml) {
    parseRssTitles(tiktokNewsXml, 16).forEach((item, i) => {
      if (isSensitiveTopic(item.title)) return;
      const label = extractTrendLabel(item.title);
      signals.push({
        id: slugId("tt-live", label, i),
        title: label,
        category: "tiktok",
        platform: "tiktok",
        source: "TikTok chatter (live)",
        heat: Math.max(40, 96 - i * 4),
        summary: `Live TikTok signal: ${cleanHeadline(item.title)}`,
        url: item.link,
        tag: label.startsWith("#") ? label : undefined,
      });
    });
  }

  if (igNewsXml) {
    parseRssTitles(igNewsXml, 14).forEach((item, i) => {
      if (isSensitiveTopic(item.title)) return;
      const label = extractTrendLabel(item.title);
      signals.push({
        id: slugId("ig-live", label, i),
        title: label,
        category: "instagram",
        platform: "instagram",
        source: "Instagram / Reels chatter (live)",
        heat: Math.max(38, 92 - i * 4),
        summary: `Live Instagram signal: ${cleanHeadline(item.title)}`,
        url: item.link,
        tag: label.startsWith("#") ? label : undefined,
      });
    });
  }

  if (dayTrendsHtml) {
    parseDayTrends(dayTrendsHtml).forEach((label, i) => {
      if (isSensitiveTopic(label)) return;
      const isHash = label.startsWith("#");
      signals.push({
        id: slugId("social-now", label, i),
        title: label,
        category: isHash ? "tiktok" : categorizeTitle(label),
        platform: "cross",
        source: "Social now (live trending topics)",
        heat: Math.max(45, 94 - i * 3),
        summary: `Trending across social right now — strong candidate for TikTok/IG remixes.`,
        tag: isHash ? label : undefined,
      });
    });
  }

  if (trendsXml) {
    parseRssTitles(trendsXml, 12).forEach((item, i) => {
      signals.push({
        id: slugId("search", item.title, i),
        title: item.title,
        category: categorizeTitle(item.title) === "news" ? "search" : categorizeTitle(item.title),
        platform: "cross",
        source: "Google Trends",
        heat: Math.max(35, 90 - i * 5),
        summary: `People are actively searching for “${item.title}” right now.`,
        url: item.link,
      });
    });
  }

  if (newsXml) {
    parseRssTitles(newsXml, 10).forEach((item, i) => {
      if (isSensitiveTopic(item.title)) return;
      const category = categorizeTitle(item.title);
      signals.push({
        id: slugId("ent", item.title, i),
        title: cleanHeadline(item.title),
        category: category === "search" ? "news" : category,
        platform: "cross",
        source: "Entertainment headlines",
        heat: Math.max(30, 84 - i * 4),
        summary: `Entertainment / culture chatter: ${cleanHeadline(item.title)}`,
        url: item.link,
      });
    });
  }

  activeCalendarMoments().forEach((m, i) => {
    signals.push({
      id: `cal-${m.id}`,
      title: m.title,
      category: m.category === "festival" ? "festival" : m.category,
      platform: "cross",
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
      platform: "tiktok",
      source: "TikTok format playbook",
      heat: 68 - i * 2,
      summary: f.summary,
      tag: f.tag,
    });
  });

  IG_FORMATS.forEach((f, i) => {
    signals.push({
      id: `ig-format-${f.id}`,
      title: f.title,
      category: "instagram",
      platform: "instagram",
      source: "Instagram format playbook",
      heat: 66 - i * 2,
      summary: f.summary,
      tag: f.tag,
    });
  });

  const seen = new Set<string>();
  return signals.filter((s) => {
    const key = `${s.platform}:${s.title.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

function describeVoice(report: BrandReport): string {
  const top = report.personality
    .slice(0, 2)
    .map((p) => p.label.toLowerCase())
    .join(" + ");
  const dims = report.voiceDimensions
    .map((d) => (d.value >= 55 ? d.right : d.left).toLowerCase())
    .slice(0, 3)
    .join(", ");
  return `${report.archetype} voice (${top || "bold"}; leans ${dims || "clear and direct"})`;
}

function voiceBlendLine(report: BrandReport, signal: TrendSignal): string {
  const voice = describeVoice(report);
  const trait = report.personality[0]?.label ?? "Bold";
  if (signal.platform === "tiktok" || signal.category === "tiktok") {
    return `Keep the TikTok hook native, but deliver the punchline in ${report.name}'s ${trait.toLowerCase()} tone — ${voice}.`;
  }
  if (signal.platform === "instagram" || signal.category === "instagram") {
    return `Use Reels/carousel pacing, caption in ${report.name}'s voice: ${report.voiceSummary}`;
  }
  return `Remix the moment through ${voice}. Stay on-brand: ${report.voiceSummary}`;
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
    return { score: 5, reason: "Skipped — sensitive topic, not brand-safe to trend-jack." };
  }

  if (signal.platform === "tiktok" || signal.category === "tiktok") {
    score += 20;
    reason = "Active TikTok surface — pair with a native hook + on-brand punchline.";
  }
  if (signal.platform === "instagram" || signal.category === "instagram") {
    score += 18;
    reason = "Instagram/Reels surface — good for carousel + caption voice work.";
  }
  if (signal.source.includes("live")) {
    score += 10;
    reason = "Live platform chatter — act while the window is open.";
  }
  if (signal.source === "Cultural calendar") {
    score += 14;
    reason = "Seasonal calendar moment — planable and brand-safe.";
  }
  if (signal.category === "movie" && /playful|bold|innovative/i.test(topTrait)) {
    score += 12;
    reason = `${topTrait} brands ride entertainment moments with reaction / POV creative.`;
  }
  if (signal.category === "festival" && /warm|playful|premium/i.test(topTrait)) {
    score += 12;
    reason = `Seasonal moments match a ${topTrait.toLowerCase()} voice.`;
  }
  if (signal.category === "sports" && /bold|innovative|trustworthy/i.test(topTrait)) {
    score += 10;
    reason = "Sports metaphors map to performance storytelling.";
  }
  if (tokens.some((t) => text.includes(t.toLowerCase()))) {
    score += 18;
    reason = "Keyword overlap with your brand language — high relevance.";
  }
  if (isB2b) {
    if (/celebrity|gossip|dating|family gives update|livestream/i.test(text)) {
      score -= 16;
      reason = "Low topical overlap for a product/B2B brand — witty aside only.";
    }
    if (signal.platform === "tiktok" || signal.platform === "instagram") score += 6;
    if (/bitcoin|market|tariff|economy|tech|ai|cyber|payment/i.test(text)) {
      score += 12;
      reason = "Macro/tech-adjacent — strong explainer angle in brand voice.";
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
  const blend = voiceBlendLine(report, signal);

  const platforms =
    signal.platform === "tiktok" || signal.category === "tiktok"
      ? ["TikTok", "Instagram Reels"]
      : signal.platform === "instagram" || signal.category === "instagram"
        ? ["Instagram", "TikTok"]
        : signal.category === "movie" || signal.category === "festival"
          ? ["TikTok", "Instagram", "X"]
          : ["LinkedIn", "X", "Instagram"];

  let headline = "";
  let angle = "";
  let hooks: string[] = [];
  let topicPrompt = "";

  if (signal.platform === "tiktok" || signal.category === "tiktok") {
    headline = `TikTok · ${title}`;
    angle = `${blend} Format tip: ${signal.summary}`;
    hooks = [
      `POV: ${brand} walks into the “${title}” trend…`,
      `${title} but make it ${trait.toLowerCase()} — ${brand} edition.`,
      `Stop scrolling. ${brand}'s take on ${title}:`,
    ];
    topicPrompt = `TikTok trend “${title}” remixed in ${brand}'s ${trait.toLowerCase()} voice — ${signal.summary}`;
  } else if (signal.platform === "instagram" || signal.category === "instagram") {
    headline = `Instagram · ${title}`;
    angle = `${blend}`;
    hooks = [
      `${title} — told the ${brand} way.`,
      `Reels energy, ${trait.toLowerCase()} caption: ${title}`,
      `Save this if you’re into ${title} + ${brand}.`,
    ];
    topicPrompt = `Instagram/Reels take on “${title}” using ${brand}'s voice (${report.archetype})`;
  } else if (signal.category === "festival" || signal.source === "Cultural calendar") {
    headline = `${title} play for ${brand}`;
    angle = `${blend} Seasonal frame: ${signal.summary}`;
    hooks = [
      `${title} energy, but make it ${brand}.`,
      `Our ${title} shortlist (only the useful stuff).`,
      `If ${title} had a product drop…`,
    ];
    topicPrompt = `${title} campaign angle for ${brand} in brand voice`;
  } else if (signal.category === "movie") {
    headline = `Ride “${title}”`;
    angle = `${blend} Entertainment trend-jack — tasteful, no spoiler dumps.`;
    hooks = [
      `${title} but it’s a metaphor for ${brand}.`,
      `Unpopular opinion after ${title}:`,
      `The ${brand} scene that ${title} reminded us of…`,
    ];
    topicPrompt = `Trend-jack ${title} for ${brand} social in ${trait.toLowerCase()} voice`;
  } else if (signal.category === "sports") {
    headline = `${title} → ${brand} performance story`;
    angle = `${blend}`;
    hooks = [
      `Game-day energy applied to ${brand}:`,
      `What ${title} taught us about shipping…`,
      `Halftime tip from ${brand}:`,
    ];
    topicPrompt = `Sports-moment metaphor about ${title} for ${brand}`;
  } else {
    headline = `Jump on “${title}”`;
    angle = `${blend} Publish a fast teach/clarify take, then cut a short-form version.`;
    hooks = [
      `Everyone’s talking about ${title}. Here’s the ${brand} take:`,
      `${title}, explained in 15 seconds — ${trait.toLowerCase()} edition.`,
      `Don’t sleep on ${title} if you care about ${report.keywords[0] ?? "this space"}.`,
    ];
    topicPrompt = `Hot-take / explainer on ${title} in ${brand}'s voice`;
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
    timing:
      signal.source === "Cultural calendar"
        ? "seasonal"
        : signal.heat >= 70 || signal.source.includes("live")
          ? "now"
          : "this_week",
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
  const usedPlatform = new Set<string>();

  for (const platform of ["tiktok", "instagram", "cross"] as const) {
    const hit = scored.find((s) => s.platform === platform);
    if (hit) {
      picked.push(hit);
      usedPlatform.add(platform);
    }
  }

  for (const s of scored) {
    if (picked.length >= limit) break;
    if (picked.some((p) => p.id === s.id)) continue;
    picked.push(s);
  }
  return picked.slice(0, limit);
}

export async function runSocialListening(report: BrandReport): Promise<{
  signals: TrendSignal[];
  suggestions: TrendSuggestion[];
  listenedAt: string;
  tiktokFeed: TrendSignal[];
  instagramFeed: TrendSignal[];
}> {
  const signals = await listenToTrends();
  const suggestions = suggestFromTrends(report, signals);
  return {
    signals,
    suggestions,
    listenedAt: new Date().toISOString(),
    tiktokFeed: signals.filter((s) => s.platform === "tiktok" || s.category === "tiktok"),
    instagramFeed: signals.filter(
      (s) => s.platform === "instagram" || s.category === "instagram",
    ),
  };
}
