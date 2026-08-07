import type { BrandReport, ContentPlatform, TrendSignal } from "../types";
import type { ScheduleSlot } from "./contentSchedule";
import { audienceLine, primaryAudienceLabel } from "./audience";
import {
  buildLiveFeedUrls,
  geoFromReport,
  regionProfile,
} from "./brandGeo";

async function fetchText(url: string, acceptLang: string): Promise<string> {
  if (typeof window !== "undefined") {
    const res = await fetch(`/api/fetch-page?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error(`Live trend fetch failed (${res.status})`);
    return res.text();
  }
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; BrandVibe/1.0; +https://github.com/yoyijia/Tool)",
      Accept: "application/rss+xml, application/xml, text/xml, */*",
      "Accept-Language": `${acceptLang},en;q=0.8`,
    },
  });
  if (!res.ok) throw new Error(`Live trend fetch failed (${res.status})`);
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

function stripSourceSuffix(title: string): string {
  return decodeEntities(title)
    .replace(/\s*[-–—|]\s*[^-–—|]{2,50}$/u, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function isSensitive(title: string): boolean {
  return /\b(die|dies|died|death|killed|murder|shooting|assault|rape|suicide|terror|bomb|crash victims?|fatal|traffick|abuse|molest|stabbed|drown|scam victims?)\b/i.test(
    title,
  );
}

function isBrandUnsafe(title: string): boolean {
  return /\b(election|by-?election|parliament debate|impeach|defamation|court hearing|charged with|sentenced|arrested|police|suspect|investigation into|corruption)\b/i.test(
    title,
  );
}

interface RssItem {
  title: string;
  link?: string;
  pubDate?: string;
}

function parseRssItems(xml: string, limit = 12): RssItem[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
    .slice(0, limit)
    .map((m) => {
      const block = m[1] ?? "";
      return {
        title: decodeEntities(block.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? ""),
        link:
          decodeEntities(block.match(/<link>([\s\S]*?)<\/link>/i)?.[1] ?? "") ||
          undefined,
        pubDate:
          decodeEntities(block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] ?? "") ||
          undefined,
      };
    })
    .filter(
      (i) =>
        i.title &&
        !/^Google News$/i.test(i.title) &&
        !/^Daily Search Trends$/i.test(i.title),
    );
}

export interface LiveCultureTrend {
  id: string;
  label: string;
  headline: string;
  category: TrendSignal["category"];
  heat: number;
  summary: string;
  url?: string;
  source: string;
  postAt: string;
  platform: ContentPlatform;
  hooks: string[];
  slidesOrBeats: string[];
  topicPrompt: string;
  countryCode: string;
  countryName: string;
  tzLabel: string;
}

/** Singapore-only boosts when that market is detected. */
const SG_WATCHLIST: {
  id: string;
  label: string;
  category: TrendSignal["category"];
  match: RegExp;
  query: string;
  platform: ContentPlatform;
  postAt: string;
  angle: (brand: string) => { hooks: string[]; beats: string[]; summary: string };
}[] = [
  {
    id: "gst-vouchers",
    label: "GST Vouchers (Singapore)",
    category: "culture",
    match: /\bgst\b.*voucher|voucher.*\bgst\b|gstv\b|fairprice.*voucher|cdc voucher/i,
    query: "GST+voucher+OR+CDC+voucher+Singapore",
    platform: "instagram",
    postAt: "12:30",
    angle: (brand) => ({
      summary:
        "Singapore GST / CDC voucher talk is live — explain value, timing, and brand-safe offers.",
      hooks: [
        "Voucher window is open — here’s what brands should actually do.",
        `${brand}'s take: vouchers drive footfall — content drives trust.`,
      ],
      beats: [
        "What’s trending: voucher windows",
        "Tip carousel + Story countdown",
        "CTA: save / share",
      ],
    }),
  },
  {
    id: "ndp",
    label: "NDP / National Day buzz",
    category: "festival",
    match: /\bndp\b|national day parade|national day/i,
    query: "NDP+OR+%22National+Day%22+Singapore",
    platform: "instagram",
    postAt: "11:30",
    angle: (brand) => ({
      summary: "National Day / NDP conversation is active — soft culture posts for SG brands.",
      hooks: [
        "NDP content that isn’t just a flag emoji.",
        `${brand}: building Singapore brands all year.`,
      ],
      beats: ["Culture hook", "Local shoutout", "Soft CTA"],
    }),
  },
];

function slug(label: string, i: number): string {
  return `live-${label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 42) || i}`;
}

function categorize(title: string): TrendSignal["category"] {
  const t = title.toLowerCase();
  if (/spider|marvel|film|movie|cinema|netflix|concert|k-?pop|drama/i.test(t)) {
    return "movie";
  }
  if (/\bndp\b|national day|hari raya|deepavali|cny|festival|thanksgiving|diwali/i.test(t)) {
    return "festival";
  }
  if (/f1|formula|football|soccer|basketball|olympics|athlete|match|tournament|nfl|nba/i.test(t)) {
    return "sports";
  }
  if (/tiktok|instagram|reel|viral|meme|voucher|hawker|haze|weather|food|cafe/i.test(t)) {
    return "culture";
  }
  return "news";
}

function platformFor(category: TrendSignal["category"]): ContentPlatform {
  if (category === "movie" || category === "sports" || category === "culture") return "tiktok";
  return "instagram";
}

function postAtFor(category: TrendSignal["category"]): string {
  if (category === "movie" || category === "sports") return "19:30";
  if (category === "culture") return "20:00";
  if (category === "festival") return "11:30";
  return "12:30";
}

function brandAngleForGeneric(
  brand: string,
  audience: string,
  label: string,
  countryName: string,
): { hooks: string[]; beats: string[]; summary: string } {
  return {
    summary: `Trending in ${countryName} right now: “${label}”. Adapt for ${brand} → ${audience}.`,
    hooks: [
      `${countryName} is talking about ${label} — ${brand}'s angle for ${audience}.`,
      `${label}: what ${audience} in ${countryName} should take away.`,
      `Regional trend “${label}” → useful take from ${brand}.`,
    ],
    beats: [
      `Hook on ${label}`,
      `Bridge to a proof point ${audience} in ${countryName} cares about`,
      "One concrete tip (not a news dump)",
      "CTA: save / share / DM",
    ],
  };
}

function nearDupKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 6)
    .join(" ");
}

/**
 * Fetch live trends for the brand's detected country/region
 * (Google Trends + News + local sources) — not hardcoded to Singapore.
 */
export async function fetchLiveCultureTrends(
  report: BrandReport,
): Promise<LiveCultureTrend[]> {
  const geo = geoFromReport(report);
  const brand = report.name;
  const audience = primaryAudienceLabel(report);
  const profile = regionProfile(geo);
  const feedUrls = buildLiveFeedUrls(geo);

  const feedEntries = await Promise.all(
    Object.entries(feedUrls).map(async ([key, url]) => {
      const xml = await fetchText(url, geo.locale).catch(() => "");
      return [key, xml] as const;
    }),
  );
  const byKey = Object.fromEntries(feedEntries);

  const watchlist = geo.countryCode === "SG" ? SG_WATCHLIST : [];
  const watchXmls = await Promise.all(
    watchlist.map((w) =>
      fetchText(
        `https://news.google.com/rss/search?q=${w.query}&hl=${geo.newsHl}&gl=${geo.newsGl}&ceid=${geo.newsCeid}`,
        geo.locale,
      ).catch(() => ""),
    ),
  );

  const trendsItems = parseRssItems(byKey.trends ?? "", 25);
  const newsPools: { source: string; items: RssItem[]; heatBase: number }[] = [
    {
      source: `Google Trends ${geo.countryCode}`,
      items: trendsItems,
      heatBase: 94,
    },
    {
      source: `Google News ${geo.countryCode} · top`,
      items: parseRssItems(byKey.newsTop ?? "", 18),
      heatBase: 88,
    },
    {
      source: `Google News ${geo.countryCode} · week`,
      items: parseRssItems(byKey.newsWeek ?? "", 16),
      heatBase: 80,
    },
    {
      source: `Google News ${geo.countryCode} · business`,
      items: parseRssItems(byKey.newsBusiness ?? "", 12),
      heatBase: 78,
    },
    {
      source: `Google News ${geo.countryCode} · tech`,
      items: parseRssItems(byKey.newsTech ?? "", 12),
      heatBase: 78,
    },
    {
      source: `Google News ${geo.countryCode} · entertainment`,
      items: parseRssItems(byKey.newsEnt ?? "", 12),
      heatBase: 82,
    },
    {
      source: `Google News ${geo.countryCode} · sports`,
      items: parseRssItems(byKey.newsSports ?? "", 12),
      heatBase: 80,
    },
    {
      source: `Google News ${geo.countryCode} · health`,
      items: parseRssItems(byKey.newsHealth ?? "", 10),
      heatBase: 76,
    },
  ];

  if (byKey.localNews) {
    newsPools.push({
      source: profile.localNewsRss
        ? `${geo.countryName} local news`
        : `${geo.countryName} news`,
      items: parseRssItems(byKey.localNews, 16),
      heatBase: 86,
    });
  }
  if (byKey.reddit) {
    newsPools.push({
      source: `Reddit · ${geo.countryName}`,
      items: parseRssItems(byKey.reddit, 20),
      heatBase: 72,
    });
  }

  const out: LiveCultureTrend[] = [];
  const seen = new Set<string>();
  const seenNear = new Set<string>();

  const pushTrend = (trend: LiveCultureTrend) => {
    const key = trend.label.toLowerCase();
    const near = nearDupKey(trend.headline || trend.label);
    if (seen.has(key) || (near && seenNear.has(near))) return;
    if (isSensitive(trend.label) || isSensitive(trend.headline)) return;
    if (isBrandUnsafe(trend.label) || isBrandUnsafe(trend.headline)) return;
    seen.add(key);
    if (near) seenNear.add(near);
    out.push(trend);
  };

  watchlist.forEach((w, wi) => {
    const dedicated = parseRssItems(watchXmls[wi] ?? "", 8);
    const allNews = newsPools.flatMap((p) => p.items);
    const hits = [...dedicated, ...allNews].filter((it) => w.match.test(it.title));
    const best = hits[0] ?? dedicated[0];
    if (!best) return;
    const angle = w.angle(brand);
    pushTrend({
      id: w.id,
      label: w.label,
      headline: stripSourceSuffix(best.title),
      category: w.category,
      heat: 98 - wi,
      summary: `${angle.summary} Latest: “${stripSourceSuffix(best.title)}”.`,
      url: best.link,
      source: `Google News ${geo.countryCode} · watchlist`,
      postAt: w.postAt,
      platform: w.platform,
      hooks: angle.hooks,
      slidesOrBeats: angle.beats,
      topicPrompt: buildTopicPrompt(report, w.label, angle, geo.countryName),
      countryCode: geo.countryCode,
      countryName: geo.countryName,
      tzLabel: geo.tzLabel,
    });
  });

  let rank = 0;
  for (const pool of newsPools) {
    pool.items.forEach((item, i) => {
      const cleaned = stripSourceSuffix(item.title);
      if (cleaned.length < 2 || cleaned.length > 110) return;
      if (watchlist.some((w) => w.match.test(item.title))) return;

      const category = categorize(cleaned);
      const isSearchSpike =
        pool.source.startsWith("Google Trends") && cleaned.split(/\s+/).length <= 4;
      const label = cleaned.length > 56 ? `${cleaned.slice(0, 53)}…` : cleaned;
      const angle = brandAngleForGeneric(
        brand,
        audience,
        label,
        geo.countryName,
      );
      const heat = Math.max(42, pool.heatBase - i * 2 - Math.floor(rank / 8));

      pushTrend({
        id: slug(`${geo.countryCode}-${label}`, rank),
        label,
        headline: cleaned,
        category: isSearchSpike ? "search" : category,
        heat,
        summary: angle.summary,
        url: item.link,
        source: pool.source,
        postAt: postAtFor(isSearchSpike ? "search" : category),
        platform: platformFor(isSearchSpike ? "search" : category),
        hooks: angle.hooks,
        slidesOrBeats: angle.beats,
        topicPrompt: buildTopicPrompt(report, label, angle, geo.countryName),
        countryCode: geo.countryCode,
        countryName: geo.countryName,
        tzLabel: geo.tzLabel,
      });
      rank += 1;
    });
  }

  return out.sort((a, b) => b.heat - a.heat).slice(0, 36);
}

function buildTopicPrompt(
  report: BrandReport,
  label: string,
  angle: { hooks: string[]; beats: string[]; summary: string },
  countryName: string,
): string {
  return [
    `Live ${countryName} trend: “${label}”.`,
    `Brand: ${report.name}. Audiences: ${audienceLine(report)}.`,
    `Market: ${countryName}.`,
    angle.summary,
    `Hooks: ${angle.hooks.join(" | ")}`,
    `Beats: ${angle.beats.join(" · ")}`,
    `Keep it timely, brand-safe, and relevant to ${countryName}. Tie lightly to a real offer if natural.`,
  ].join(" ");
}

export function liveTrendsToSignals(trends: LiveCultureTrend[]): TrendSignal[] {
  return trends.map((t) => ({
    id: t.id,
    title: t.label,
    category: t.category,
    platform: "other" as const,
    source: t.source,
    heat: t.heat,
    summary: `${t.summary} Headline: ${t.headline}`,
    url: t.url,
    tag: `live-${t.countryCode.toLowerCase()}`,
  }));
}

export function mergeLiveTrendsIntoSchedule(
  base: ScheduleSlot[],
  live: LiveCultureTrend[],
  report: BrandReport,
): ScheduleSlot[] {
  const geo = geoFromReport(report);
  const injectable = live.filter((t) => t.heat >= 70).slice(0, 10);
  if (!injectable.length) return base;
  const slots = [...base];
  const keepIds = new Set(
    slots.filter((s) => s.kind === "spotlight" || s.talent).map((s) => s.id),
  );

  const replaceIdx = slots
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.kind === "carousel" && !keepIds.has(s.id))
    .slice(0, Math.min(8, injectable.length));

  replaceIdx.forEach(({ i }, n) => {
    const t = injectable[n];
    if (!t) return;
    const prev = slots[i]!;
    slots[i] = {
      id: `live-${t.id}-${prev.date}`,
      date: prev.date,
      dayLabel: prev.dayLabel,
      weekday: prev.weekday,
      postAt: t.postAt,
      timezone: geo.tzLabel,
      platform: t.platform,
      kind: "trend",
      title: t.label,
      format:
        t.platform === "tiktok"
          ? `TikTok / Reels (live ${geo.countryCode} trend)`
          : `IG carousel / Reel (live ${geo.countryCode} trend)`,
      hook: t.hooks[0] ?? t.label,
      slidesOrBeats: t.slidesOrBeats,
      whyNow: t.summary,
      engagementTip: `Live from ${t.source}. Post ~${t.postAt} ${geo.tzLabel}.`,
      topicPrompt: t.topicPrompt,
      serviceTag: `Live ${geo.countryName} trend`,
    };
  });

  const top = injectable[0];
  if (top && !slots.some((s) => s.title.includes(top.label))) {
    const head = slots.find((s) => s.kind !== "spotlight") ?? slots[0];
    if (head) {
      slots.unshift({
        id: `live-flash-${top.id}`,
        date: head.date,
        dayLabel: head.dayLabel,
        weekday: head.weekday,
        postAt: top.postAt,
        timezone: geo.tzLabel,
        platform: top.platform,
        kind: "trend",
        title: `NOW · ${top.label}`,
        format: `Flash post from live ${geo.countryName} trends`,
        hook: top.hooks[0] ?? top.label,
        slidesOrBeats: top.slidesOrBeats,
        whyNow: top.summary,
        engagementTip: `Refreshed live · ${top.source}`,
        topicPrompt: top.topicPrompt,
        serviceTag: `Live ${geo.countryName} trend`,
      });
    }
  }

  return slots.sort(
    (a, b) => a.date.localeCompare(b.date) || a.postAt.localeCompare(b.postAt),
  );
}
