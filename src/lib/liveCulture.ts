import type { BrandReport, ContentPlatform, TrendSignal } from "../types";
import type { ScheduleSlot } from "./contentSchedule";
import { audienceLine } from "./audience";

async function fetchText(url: string): Promise<string> {
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
      "Accept-Language": "en-SG,en;q=0.9",
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
  return /\b(die|dies|died|death|killed|murder|shooting|assault|rape|suicide|terror|bomb)\b/i.test(
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
        link: decodeEntities(block.match(/<link>([\s\S]*?)<\/link>/i)?.[1] ?? "") || undefined,
        pubDate: decodeEntities(block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] ?? "") || undefined,
      };
    })
    .filter((i) => i.title && !/^Google News$/i.test(i.title) && !/^Daily Search Trends$/i.test(i.title));
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
  /** Suggested post window */
  postAt: string;
  platform: ContentPlatform;
  hooks: string[];
  slidesOrBeats: string[];
  topicPrompt: string;
}

/** Canonical labels we always check — promoted when news confirms they’re live. */
const WATCHLIST: {
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
    match: /\bgst\b.*voucher|voucher.*\bgst\b|gstv\b|fairprice.*voucher|\$6 voucher/i,
    query: "GST+voucher+Singapore",
    platform: "instagram",
    postAt: "12:30",
    angle: (brand) => ({
      summary:
        "Singapore GST voucher / shopping voucher talk is live — explain value, timing, and brand-safe offers for shoppers & clinic patients.",
      hooks: [
        "GST voucher drop? Here’s what marketers should actually do.",
        "Don’t just say “use your GSTV” — make the offer clear in 5 seconds.",
        `${brand}'s take: vouchers drive footfall — content drives trust.`,
      ],
      beats: [
        "What’s trending: GST / FairPrice voucher windows",
        "Who it hits: households + clinic patient catchments",
        "Content angle: tip carousel + Story countdown",
        "CTA: save this / share with family",
      ],
    }),
  },
  {
    id: "spiderman-bnd",
    label: "Spider-Man: Brand New Day",
    category: "movie",
    match: /spider-?man|brand new day|spiderman/i,
    query: "Spider-Man+Brand+New+Day",
    platform: "tiktok",
    postAt: "19:30",
    angle: (brand) => ({
      summary:
        "Spider-Man: Brand New Day is dominating SG entertainment + brand collabs (cinema, Scoot, OMD). Ride the meme — don’t force a medical claim.",
      hooks: [
        "With great power comes… great content calendars.",
        "Brand New Day energy for your August creative.",
        `${brand} x pop culture: what marketers can borrow from Spidey’s launch.`,
      ],
      beats: [
        "0–1s: Spidey emoji / “Brand New Day” text",
        "Punchline tied to a service (new site = new day, GEO = great power)",
        "Optional Gucci cameo as “friendly neighbourhood office dog”",
        "CTA: which hero is your brand?",
      ],
    }),
  },
  {
    id: "ndp-2026",
    label: "NDP 2026 / National Day buzz",
    category: "festival",
    match: /\bndp\b|national day parade|national day/i,
    query: "NDP+OR+%22National+Day%22+Singapore",
    platform: "instagram",
    postAt: "11:30",
    angle: (brand) => ({
      summary: "National Day / NDP conversation is active — culture posts and soft patriotism for SG brands.",
      hooks: [
        "NDP weekend content that isn’t just a flag emoji.",
        `${brand}: proud to build Singapore brands all year.`,
      ],
      beats: ["Culture hook", "Client shoutout (healthcare / local)", "Soft CTA"],
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

function brandAngleForGeneric(
  brand: string,
  label: string,
): { hooks: string[]; beats: string[]; summary: string } {
  return {
    summary: `Trending in Singapore right now: “${label}”. Adapt carefully for ${brand}'s audiences.`,
    hooks: [
      `Everyone’s talking about ${label} — here’s the ${brand} angle.`,
      `${label}, but make it useful for marketers.`,
    ],
    beats: [
      `Hook on ${label}`,
      "Bridge to a service proof (SEO / social / ORM)",
      "CTA: DM for the playbook",
    ],
  };
}

/**
 * Fetch live Singapore search + news culture trends (GST vouchers, Spider-Man, NDP, etc.).
 * Refreshes whenever called — use from schedule / trend radar “Refresh”.
 */
export async function fetchLiveCultureTrends(
  report: BrandReport,
): Promise<LiveCultureTrend[]> {
  const brand = report.name;
  const feeds = await Promise.all([
    fetchText("https://trends.google.com/trending/rss?geo=SG").catch(() => ""),
    fetchText("https://news.google.com/rss?hl=en-SG&gl=SG&ceid=SG:en").catch(() => ""),
    fetchText(
      "https://news.google.com/rss/search?q=when:7d+(GST+voucher+OR+Spider-Man+OR+%22Brand+New+Day%22+OR+NDP)+Singapore&hl=en-SG&gl=SG&ceid=SG:en",
    ).catch(() => ""),
    ...WATCHLIST.map((w) =>
      fetchText(
        `https://news.google.com/rss/search?q=${w.query}&hl=en-SG&gl=SG&ceid=SG:en`,
      ).catch(() => ""),
    ),
  ]);

  const [sgTrendsXml, sgNewsXml, mixedXml, ...watchXmls] = feeds;
  const allItems: RssItem[] = [
    ...parseRssItems(sgTrendsXml ?? "", 12),
    ...parseRssItems(sgNewsXml ?? "", 12),
    ...parseRssItems(mixedXml ?? "", 15),
    ...watchXmls.flatMap((x) => parseRssItems(x ?? "", 6)),
  ];

  const out: LiveCultureTrend[] = [];
  const seen = new Set<string>();

  // 1) Promote watchlist whenever dedicated or mixed news confirms
  WATCHLIST.forEach((w, wi) => {
    const dedicated = parseRssItems(watchXmls[wi] ?? "", 8);
    const hits = [...dedicated, ...allItems].filter((it) => w.match.test(it.title));
    const best = hits[0] ?? dedicated[0];
    if (!best) return;
    const key = w.label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    const angle = w.angle(brand);
    out.push({
      id: w.id,
      label: w.label,
      headline: stripSourceSuffix(best.title),
      category: w.category,
      heat: 96 - wi * 2,
      summary: `${angle.summary} Latest: “${stripSourceSuffix(best.title)}”.`,
      url: best.link,
      source: "Google News SG · live",
      postAt: w.postAt,
      platform: w.platform,
      hooks: angle.hooks,
      slidesOrBeats: angle.beats,
      topicPrompt: buildTopicPrompt(report, w.label, angle),
    });
  });

  // 2) Add other SG search spikes / news that look postable
  const extras = [
    ...parseRssItems(sgTrendsXml ?? "", 10),
    ...allItems.filter(
      (it) =>
        /voucher|spider|marvel|ndp|namewee|haze|healthcare|clinic|marketing|fairprice|scoot/i.test(
          it.title,
        ),
    ),
  ];

  extras.forEach((item, i) => {
    if (isSensitive(item.title)) return;
    const cleaned = stripSourceSuffix(item.title);
    if (cleaned.length < 3 || cleaned.length > 90) return;
    // Skip bare one-word search spikes (keep watchlist + real headlines)
    if (!/\s/.test(cleaned) && cleaned.length < 14) return;
    // Skip if already covered by watchlist match
    if (WATCHLIST.some((w) => w.match.test(item.title))) return;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    const label = cleaned.length > 48 ? `${cleaned.slice(0, 45)}…` : cleaned;
    const angle = brandAngleForGeneric(brand, label);
    const isMovie = /spider|marvel|film|movie|cinema/i.test(cleaned);
    out.push({
      id: slug(label, i),
      label,
      headline: cleaned,
      category: isMovie ? "movie" : "news",
      heat: Math.max(48, 82 - i * 4),
      summary: angle.summary,
      url: item.link,
      source: "Google Trends / News SG · live",
      postAt: isMovie ? "19:30" : "12:30",
      platform: isMovie ? "tiktok" : "instagram",
      hooks: angle.hooks,
      slidesOrBeats: angle.beats,
      topicPrompt: buildTopicPrompt(report, label, angle),
    });
  });

  return out.sort((a, b) => b.heat - a.heat).slice(0, 16);
}

function buildTopicPrompt(
  report: BrandReport,
  label: string,
  angle: { hooks: string[]; beats: string[]; summary: string },
): string {
  return [
    `Live trend post: “${label}”.`,
    `Brand: ${report.name}. Audiences: ${audienceLine(report)}.`,
    angle.summary,
    `Hooks: ${angle.hooks.join(" | ")}`,
    `Beats: ${angle.beats.join(" · ")}`,
    "Keep it timely, brand-safe, and Singapore-relevant. Tie lightly to a service if natural (SEO, social, ORM, healthcare).",
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
    tag: "live-sg",
  }));
}

/** Splice top live trends into the next few calendar days (keeps Gucci Dog Day intact). */
export function mergeLiveTrendsIntoSchedule(
  base: ScheduleSlot[],
  live: LiveCultureTrend[],
  _report: BrandReport,
): ScheduleSlot[] {
  // Only splice high-confidence live items into the calendar (watchlist / strong news)
  const injectable = live.filter(
    (t) =>
      t.heat >= 88 ||
      /gst|voucher|spider|ndp|national day|fairprice|scoot/i.test(t.label + t.headline),
  );
  if (!injectable.length) return base;
  const slots = [...base];
  const keepIds = new Set(
    slots.filter((s) => s.kind === "spotlight" || s.talent).map((s) => s.id),
  );

  // Replace earliest carousel slots (not spotlight) with live trends
  const replaceIdx = slots
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.kind === "carousel" && !keepIds.has(s.id))
    .slice(0, Math.min(5, injectable.length));

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
      timezone: "SGT",
      platform: t.platform,
      kind: "trend",
      title: t.label,
      format:
        t.platform === "tiktok"
          ? "TikTok / Reels (live trend)"
          : "IG carousel / Reel (live trend)",
      hook: t.hooks[0] ?? t.label,
      slidesOrBeats: t.slidesOrBeats,
      whyNow: t.summary,
      engagementTip: `Live from ${t.source}. Post ~${t.postAt} SGT for peak scroll.`,
      topicPrompt: t.topicPrompt,
      serviceTag: "Live trend",
    };
  });

  // Ensure top injectable trend also appears as a same-day flash if not already titled
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
        timezone: "SGT",
        platform: top.platform,
        kind: "trend",
        title: `NOW · ${top.label}`,
        format: "Flash post from live SG trends",
        hook: top.hooks[0] ?? top.label,
        slidesOrBeats: top.slidesOrBeats,
        whyNow: top.summary,
        engagementTip: `Refreshed live · ${top.source}`,
        topicPrompt: top.topicPrompt,
        serviceTag: "Live trend",
      });
    }
  }

  return slots.sort((a, b) => a.date.localeCompare(b.date) || a.postAt.localeCompare(b.postAt));
}
