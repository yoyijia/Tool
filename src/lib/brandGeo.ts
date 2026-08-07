import type { BrandGeo, BrandReport } from "../types";
import type { PageSnapshot } from "./fetchPage";

/** Per-country live-trend feed profile. */
export interface RegionProfile {
  countryCode: string;
  countryName: string;
  locale: string;
  timezone: string;
  tzLabel: string;
  newsHl: string;
  newsGl: string;
  newsCeid: string;
  /** Optional local news RSS */
  localNewsRss?: string;
  /** Optional Reddit community */
  redditRss?: string;
  /** Place names / demonyms used in copy detection */
  placeNames: string[];
  /** ccTLDs that strongly imply this country */
  cctlds: string[];
  phoneCodes: string[];
  currencyHints: RegExp;
}

const REGIONS: RegionProfile[] = [
  {
    countryCode: "SG",
    countryName: "Singapore",
    locale: "en-SG",
    timezone: "Asia/Singapore",
    tzLabel: "SGT",
    newsHl: "en-SG",
    newsGl: "SG",
    newsCeid: "SG:en",
    localNewsRss:
      "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6511",
    redditRss: "https://www.reddit.com/r/singapore/.rss?limit=40",
    placeNames: ["singapore", "singapura", "marina bay", "orchard road", "jurong"],
    cctlds: [".sg"],
    phoneCodes: ["+65"],
    currencyHints: /\b(sgd|s\$)\b/i,
  },
  {
    countryCode: "MY",
    countryName: "Malaysia",
    locale: "en-MY",
    timezone: "Asia/Kuala_Lumpur",
    tzLabel: "MYT",
    newsHl: "en-MY",
    newsGl: "MY",
    newsCeid: "MY:en",
    redditRss: "https://www.reddit.com/r/malaysia/.rss?limit=40",
    placeNames: ["malaysia", "kuala lumpur", "selangor", "penang", "johor", "kl "],
    cctlds: [".my"],
    phoneCodes: ["+60"],
    currencyHints: /\b(rm\b|myr)\b/i,
  },
  {
    countryCode: "US",
    countryName: "United States",
    locale: "en-US",
    timezone: "America/New_York",
    tzLabel: "ET",
    newsHl: "en-US",
    newsGl: "US",
    newsCeid: "US:en",
    redditRss: "https://www.reddit.com/r/news/.rss?limit=30",
    placeNames: [
      "united states",
      "usa",
      "u.s.",
      "new york",
      "california",
      "san francisco",
      "los angeles",
      "chicago",
      "austin",
      "seattle",
    ],
    cctlds: [".us"],
    phoneCodes: ["+1"],
    currencyHints: /\b(usd|\$)\b/,
  },
  {
    countryCode: "GB",
    countryName: "United Kingdom",
    locale: "en-GB",
    timezone: "Europe/London",
    tzLabel: "GMT",
    newsHl: "en-GB",
    newsGl: "GB",
    newsCeid: "GB:en",
    redditRss: "https://www.reddit.com/r/unitedkingdom/.rss?limit=40",
    placeNames: [
      "united kingdom",
      "britain",
      "england",
      "london",
      "manchester",
      "scotland",
      "wales",
    ],
    cctlds: [".uk", ".co.uk"],
    phoneCodes: ["+44"],
    currencyHints: /\b(gbp|£)\b/i,
  },
  {
    countryCode: "AU",
    countryName: "Australia",
    locale: "en-AU",
    timezone: "Australia/Sydney",
    tzLabel: "AEST",
    newsHl: "en-AU",
    newsGl: "AU",
    newsCeid: "AU:en",
    redditRss: "https://www.reddit.com/r/australia/.rss?limit=40",
    placeNames: ["australia", "sydney", "melbourne", "brisbane", "perth"],
    cctlds: [".au", ".com.au"],
    phoneCodes: ["+61"],
    currencyHints: /\b(aud|a\$)\b/i,
  },
  {
    countryCode: "IN",
    countryName: "India",
    locale: "en-IN",
    timezone: "Asia/Kolkata",
    tzLabel: "IST",
    newsHl: "en-IN",
    newsGl: "IN",
    newsCeid: "IN:en",
    redditRss: "https://www.reddit.com/r/india/.rss?limit=40",
    placeNames: ["india", "mumbai", "delhi", "bangalore", "bengaluru", "hyderabad", "chennai"],
    cctlds: [".in", ".co.in"],
    phoneCodes: ["+91"],
    currencyHints: /\b(inr|₹|rs\.?)\b/i,
  },
  {
    countryCode: "ID",
    countryName: "Indonesia",
    locale: "en-ID",
    timezone: "Asia/Jakarta",
    tzLabel: "WIB",
    newsHl: "en-ID",
    newsGl: "ID",
    newsCeid: "ID:en",
    redditRss: "https://www.reddit.com/r/indonesia/.rss?limit=40",
    placeNames: ["indonesia", "jakarta", "surabaya", "bandung", "bali"],
    cctlds: [".id", ".co.id"],
    phoneCodes: ["+62"],
    currencyHints: /\b(idr|rp\.?)\b/i,
  },
  {
    countryCode: "PH",
    countryName: "Philippines",
    locale: "en-PH",
    timezone: "Asia/Manila",
    tzLabel: "PHT",
    newsHl: "en-PH",
    newsGl: "PH",
    newsCeid: "PH:en",
    redditRss: "https://www.reddit.com/r/philippines/.rss?limit=40",
    placeNames: ["philippines", "manila", "cebu", "quezon", "makati"],
    cctlds: [".ph"],
    phoneCodes: ["+63"],
    currencyHints: /\b(php|₱)\b/i,
  },
  {
    countryCode: "HK",
    countryName: "Hong Kong",
    locale: "en-HK",
    timezone: "Asia/Hong_Kong",
    tzLabel: "HKT",
    newsHl: "en-HK",
    newsGl: "HK",
    newsCeid: "HK:en",
    redditRss: "https://www.reddit.com/r/HongKong/.rss?limit=40",
    placeNames: ["hong kong", "hongkong", "kowloon", "tsim sha tsui"],
    cctlds: [".hk"],
    phoneCodes: ["+852"],
    currencyHints: /\b(hkd|hk\$)\b/i,
  },
  {
    countryCode: "JP",
    countryName: "Japan",
    locale: "en-JP",
    timezone: "Asia/Tokyo",
    tzLabel: "JST",
    newsHl: "en-JP",
    newsGl: "JP",
    newsCeid: "JP:en",
    redditRss: "https://www.reddit.com/r/japan/.rss?limit=40",
    placeNames: ["japan", "tokyo", "osaka", "kyoto", "yokohama"],
    cctlds: [".jp", ".co.jp"],
    phoneCodes: ["+81"],
    currencyHints: /\b(jpy|¥|yen)\b/i,
  },
  {
    countryCode: "CA",
    countryName: "Canada",
    locale: "en-CA",
    timezone: "America/Toronto",
    tzLabel: "ET",
    newsHl: "en-CA",
    newsGl: "CA",
    newsCeid: "CA:en",
    redditRss: "https://www.reddit.com/r/canada/.rss?limit=40",
    placeNames: ["canada", "toronto", "vancouver", "montreal", "ottawa"],
    cctlds: [".ca"],
    phoneCodes: ["+1"],
    currencyHints: /\b(cad|c\$)\b/i,
  },
  {
    countryCode: "DE",
    countryName: "Germany",
    locale: "de-DE",
    timezone: "Europe/Berlin",
    tzLabel: "CET",
    newsHl: "de",
    newsGl: "DE",
    newsCeid: "DE:de",
    redditRss: "https://www.reddit.com/r/de/.rss?limit=40",
    placeNames: ["germany", "deutschland", "berlin", "munich", "hamburg", "frankfurt"],
    cctlds: [".de"],
    phoneCodes: ["+49"],
    currencyHints: /\b(eur|€)\b/i,
  },
  {
    countryCode: "FR",
    countryName: "France",
    locale: "fr-FR",
    timezone: "Europe/Paris",
    tzLabel: "CET",
    newsHl: "fr",
    newsGl: "FR",
    newsCeid: "FR:fr",
    redditRss: "https://www.reddit.com/r/france/.rss?limit=40",
    placeNames: ["france", "paris", "lyon", "marseille"],
    cctlds: [".fr"],
    phoneCodes: ["+33"],
    currencyHints: /\b(eur|€)\b/i,
  },
  {
    countryCode: "AE",
    countryName: "United Arab Emirates",
    locale: "en-AE",
    timezone: "Asia/Dubai",
    tzLabel: "GST",
    newsHl: "en-AE",
    newsGl: "AE",
    newsCeid: "AE:en",
    redditRss: "https://www.reddit.com/r/dubai/.rss?limit=40",
    placeNames: ["uae", "dubai", "abu dhabi", "united arab emirates"],
    cctlds: [".ae"],
    phoneCodes: ["+971"],
    currencyHints: /\b(aed|dhs)\b/i,
  },
  {
    countryCode: "NZ",
    countryName: "New Zealand",
    locale: "en-NZ",
    timezone: "Pacific/Auckland",
    tzLabel: "NZST",
    newsHl: "en-NZ",
    newsGl: "NZ",
    newsCeid: "NZ:en",
    redditRss: "https://www.reddit.com/r/newzealand/.rss?limit=40",
    placeNames: ["new zealand", "auckland", "wellington", "christchurch"],
    cctlds: [".nz", ".co.nz"],
    phoneCodes: ["+64"],
    currencyHints: /\b(nzd|nz\$)\b/i,
  },
];

const BY_CODE = Object.fromEntries(REGIONS.map((r) => [r.countryCode, r]));

function scoreRegion(
  region: RegionProfile,
  domain: string,
  corpus: string,
  html: string,
): { score: number; signals: string[] } {
  let score = 0;
  const signals: string[] = [];
  const d = domain.toLowerCase();
  const text = `${corpus}\n${html.slice(0, 12000)}`.toLowerCase();

  for (const tld of region.cctlds) {
    if (d.endsWith(tld) || d.includes(`${tld}.`)) {
      score += 55;
      signals.push(`ccTLD ${tld}`);
    }
  }

  // Count ALL addressCountry values — global companies list many offices
  const addrCountries = [...html.matchAll(/"addressCountry"\s*:\s*"([^"]+)"/gi)].map(
    (m) => (m[1] ?? "").toLowerCase(),
  );
  const addrHits = addrCountries.filter(
    (ac) =>
      ac === region.countryCode.toLowerCase() ||
      region.placeNames.some((p) => ac.includes(p)) ||
      ac.includes(region.countryName.toLowerCase().slice(0, 6)),
  ).length;
  if (addrHits > 0) {
    score += Math.min(36, 10 + addrHits * 8);
    signals.push(`addressCountry×${addrHits}`);
  }

  const ogLocale =
    html.match(/property=["']og:locale["']\s+content=["']([^"']+)["']/i)?.[1] ||
    html.match(/content=["']([^"']+)["']\s+property=["']og:locale["']/i)?.[1];
  if (ogLocale) {
    const loc = ogLocale.replace("_", "-").toLowerCase();
    if (
      loc.endsWith(`-${region.countryCode.toLowerCase()}`) ||
      loc === region.locale.toLowerCase()
    ) {
      score += 22;
      signals.push(`og:locale=${ogLocale}`);
    }
  }

  const htmlLang =
    html.match(/<html[^>]+lang=["']([^"']+)["']/i)?.[1] ||
    html.match(/lang=["']([^"']+)["']/i)?.[1];
  if (htmlLang) {
    const lang = htmlLang.replace("_", "-").toLowerCase();
    if (
      lang.endsWith(`-${region.countryCode.toLowerCase()}`) ||
      lang === region.locale.toLowerCase()
    ) {
      score += 14;
      signals.push(`html lang=${htmlLang}`);
    }
  }

  let placeHits = 0;
  for (const place of region.placeNames) {
    const re = new RegExp(`\\b${place.replace(/\s+/g, "\\s+")}\\b`, "gi");
    const found = text.match(re);
    if (found?.length) placeHits += found.length;
  }
  if (placeHits > 0) {
    score += Math.min(28, 6 + placeHits * 4);
    signals.push(`place mentions×${placeHits}`);
  }

  for (const phone of region.phoneCodes) {
    if (text.includes(phone.toLowerCase()) || text.includes(phone.replace("+", "00"))) {
      // +1 is shared by US/CA — weaker alone
      score += phone === "+1" ? 6 : 16;
      signals.push(`phone ${phone}`);
      break;
    }
  }

  if (region.currencyHints.test(text)) {
    if (region.countryCode === "US") {
      score += 3;
      signals.push("currency hint");
    } else {
      score += 10;
      signals.push("currency hint");
    }
  }

  // Soft boost for common .com HQ markets when domain is generic
  if (
    (d.endsWith(".com") || d.endsWith(".io") || d.endsWith(".ai")) &&
    !region.cctlds.some((t) => d.endsWith(t)) &&
    (region.countryCode === "US" || region.countryCode === "GB")
  ) {
    score += region.countryCode === "US" ? 8 : 3;
  }

  return { score, signals: [...new Set(signals)] };
}

function profileToGeo(
  region: RegionProfile,
  confidence: BrandGeo["confidence"],
  signals: string[],
): BrandGeo {
  return {
    countryCode: region.countryCode,
    countryName: region.countryName,
    locale: region.locale,
    timezone: region.timezone,
    tzLabel: region.tzLabel,
    newsHl: region.newsHl,
    newsGl: region.newsGl,
    newsCeid: region.newsCeid,
    confidence,
    signals,
  };
}

/** Infer market country from domain + on-page signals. */
export function detectBrandGeo(
  snapshot: PageSnapshot,
  domain: string,
): BrandGeo {
  const corpus = [
    snapshot.title,
    snapshot.metaDescription,
    snapshot.ogDescription,
    ...snapshot.headings,
    snapshot.textContent.slice(0, 8000),
    ...snapshot.linkHrefs.slice(0, 40),
  ].join("\n");

  const ranked = REGIONS.map((region) => {
    const { score, signals } = scoreRegion(region, domain, corpus, snapshot.html);
    return { region, score, signals };
  }).sort((a, b) => b.score - a.score);

  const best = ranked[0]!;
  const second = ranked[1];

  // Strong ccTLD / addressCountry wins even if score is modest vs default
  if (best.score >= 36) {
    const confidence: BrandGeo["confidence"] =
      best.score >= 55 || (second && best.score - second.score >= 20)
        ? "high"
        : best.score >= 40
          ? "medium"
          : "low";
    return profileToGeo(best.region, confidence, best.signals);
  }

  // .com / generic — prefer clear place mentions
  if (best.score >= 18) {
    return profileToGeo(best.region, "low", [
      ...best.signals,
      "weak geo signals",
    ]);
  }

  // Default: United States for generic .com SaaS (largest trend chart), mark low confidence
  const us = BY_CODE.US!;
  return profileToGeo(us, "low", ["default: weak geo → US trends"]);
}

export function regionProfile(geo: BrandGeo): RegionProfile {
  return BY_CODE[geo.countryCode] ?? BY_CODE.US!;
}

export function geoFromReport(report: BrandReport): BrandGeo {
  if (report.geo?.countryCode) return report.geo;
  // Legacy reports without geo — soft infer from domain string only
  const domain = report.domain.toLowerCase();
  for (const r of REGIONS) {
    if (r.cctlds.some((t) => domain.endsWith(t))) {
      return profileToGeo(r, "medium", [`legacy ccTLD on ${domain}`]);
    }
  }
  const corpus = `${report.name} ${report.description} ${report.sourceSnippet}`.toLowerCase();
  for (const r of REGIONS) {
    if (r.placeNames.some((p) => corpus.includes(p))) {
      return profileToGeo(r, "low", [`legacy mention of ${r.countryName}`]);
    }
  }
  return profileToGeo(BY_CODE.US!, "low", ["legacy default US"]);
}

export function trendsRssUrl(geo: BrandGeo): string {
  return `https://trends.google.com/trending/rss?geo=${geo.countryCode}`;
}

export function buildLiveFeedUrls(geo: BrandGeo): Record<string, string> {
  const { newsHl: hl, newsGl: gl, newsCeid: ceid, countryName } = geo;
  const qCountry = encodeURIComponent(countryName);
  const profile = regionProfile(geo);
  const urls: Record<string, string> = {
    trends: trendsRssUrl(geo),
    newsTop: `https://news.google.com/rss?hl=${hl}&gl=${gl}&ceid=${ceid}`,
    newsBusiness: `https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=${hl}&gl=${gl}&ceid=${ceid}`,
    newsTech: `https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=${hl}&gl=${gl}&ceid=${ceid}`,
    newsEnt: `https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=${hl}&gl=${gl}&ceid=${ceid}`,
    newsSports: `https://news.google.com/rss/headlines/section/topic/SPORTS?hl=${hl}&gl=${gl}&ceid=${ceid}`,
    newsHealth: `https://news.google.com/rss/headlines/section/topic/HEALTH?hl=${hl}&gl=${gl}&ceid=${ceid}`,
    newsWeek: `https://news.google.com/rss/search?q=when:7d+${qCountry}&hl=${hl}&gl=${gl}&ceid=${ceid}`,
  };
  if (profile.localNewsRss) urls.localNews = profile.localNewsRss;
  if (profile.redditRss) urls.reddit = profile.redditRss;
  return urls;
}

export function liveTagFor(geo: BrandGeo): string {
  return `live-${geo.countryCode.toLowerCase()}`;
}

export function isLiveRegionalSignal(
  signal: { tag?: string; source: string },
  geo?: BrandGeo,
): boolean {
  if (signal.tag?.startsWith("live-")) return true;
  if (/Google Trends|News |CNA |Reddit /i.test(signal.source)) return true;
  if (geo && signal.source.includes(geo.countryCode)) return true;
  return false;
}

export { REGIONS, BY_CODE };
