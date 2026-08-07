import type { BrandReport, TrendSignal } from "../types";
import {
  audienceKindFromLabel,
  audienceKinds,
  primaryAudienceLabel,
  type AudienceKind,
} from "./audience";
import { geoFromReport } from "./brandGeo";

export type BrandLane =
  | "healthcare"
  | "agency"
  | "b2b"
  | "consumer"
  | "creative"
  | "general";

export type TrendLane =
  | "beauty_fashion"
  | "lifestyle_comedy"
  | "personal_story"
  | "travel_summer"
  | "audio_only"
  | "skit_documentary"
  | "list_value"
  | "pov_bts"
  | "reveal_product"
  | "ai_tech"
  | "culture_news"
  | "comparison"
  | "other";

export interface BrandProfile {
  lanes: BrandLane[];
  corpus: string;
  primaryOffer: string;
  audienceLabel: string;
  audiences: AudienceKind[];
}

/** What each audience actually wants to see on TikTok/Reels. */
const AUDIENCE_AFFINITY: Record<AudienceKind, Partial<Record<TrendLane, number>>> = {
  healthcare: {
    skit_documentary: 32,
    list_value: 28,
    ai_tech: 26,
    pov_bts: 22,
    culture_news: 24,
    comparison: 16,
    reveal_product: 8,
    lifestyle_comedy: 2,
    personal_story: -10,
    beauty_fashion: -34,
    travel_summer: -18,
    audio_only: -12,
    other: 0,
  },
  marketers: {
    ai_tech: 30,
    comparison: 26,
    list_value: 24,
    skit_documentary: 24,
    pov_bts: 22,
    culture_news: 18,
    reveal_product: 12,
    lifestyle_comedy: 8,
    personal_story: 0,
    beauty_fashion: -10,
    travel_summer: -4,
    audio_only: -2,
    other: 2,
  },
  founders: {
    list_value: 32,
    comparison: 28,
    skit_documentary: 26,
    ai_tech: 24,
    pov_bts: 18,
    reveal_product: 14,
    culture_news: 6,
    lifestyle_comedy: 4,
    personal_story: -8,
    beauty_fashion: -26,
    travel_summer: -14,
    audio_only: -10,
    other: 0,
  },
  b2b: {
    list_value: 32,
    skit_documentary: 30,
    ai_tech: 28,
    comparison: 26,
    pov_bts: 16,
    reveal_product: 12,
    culture_news: 4,
    lifestyle_comedy: 0,
    personal_story: -14,
    beauty_fashion: -32,
    travel_summer: -18,
    audio_only: -14,
    other: 0,
  },
  developers: {
    ai_tech: 34,
    skit_documentary: 28,
    list_value: 26,
    comparison: 24,
    pov_bts: 16,
    reveal_product: 10,
    culture_news: 0,
    lifestyle_comedy: 2,
    personal_story: -16,
    beauty_fashion: -36,
    travel_summer: -20,
    audio_only: -16,
    other: 0,
  },
  designers: {
    reveal_product: 30,
    comparison: 26,
    pov_bts: 24,
    skit_documentary: 18,
    list_value: 14,
    beauty_fashion: 12,
    lifestyle_comedy: 10,
    personal_story: 8,
    ai_tech: 12,
    audio_only: 8,
    culture_news: 2,
    travel_summer: 6,
    other: 4,
  },
  athletes: {
    reveal_product: 32,
    personal_story: 28,
    lifestyle_comedy: 22,
    beauty_fashion: 16,
    comparison: 16,
    travel_summer: 14,
    audio_only: 14,
    pov_bts: 14,
    list_value: 10,
    skit_documentary: 8,
    ai_tech: -2,
    culture_news: 0,
    other: 4,
  },
  consumers: {
    beauty_fashion: 34,
    reveal_product: 30,
    personal_story: 28,
    lifestyle_comedy: 24,
    travel_summer: 22,
    audio_only: 18,
    comparison: 14,
    list_value: 12,
    pov_bts: 12,
    skit_documentary: 8,
    ai_tech: 0,
    culture_news: 2,
    other: 4,
  },
  general: {
    skit_documentary: 12,
    list_value: 12,
    comparison: 10,
    pov_bts: 10,
    reveal_product: 10,
    lifestyle_comedy: 8,
    personal_story: 6,
    culture_news: 6,
    ai_tech: 6,
    beauty_fashion: 4,
    travel_summer: 4,
    audio_only: 2,
    other: 4,
  },
};

export function brandCorpus(report: BrandReport): string {
  return [
    report.name,
    report.domain,
    report.description,
    report.tagline,
    report.archetype,
    ...(report.keywords ?? []),
    ...(report.audiences ?? []),
    ...(report.services ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

function inferOffer(report: BrandReport, corpus: string, lanes: BrandLane[]): string {
  if (lanes.includes("agency") && report.services?.[0]) return report.services[0]!;
  if (report.services?.[0]) return report.services[0]!;

  if (/payment|financial infrastructure|fintech|stripe/.test(corpus)) {
    return "payments & financial infrastructure";
  }
  if (/shoe|sneaker|athlete|just do it|sport|nike/.test(corpus)) {
    return "sport & footwear";
  }
  if (/design|figma|collaborat|canvas|prototype/.test(corpus)) {
    return "design collaboration";
  }
  if (/notion|workspace|notes|docs|wiki/.test(corpus)) {
    return "team workspace productivity";
  }
  if (/canva|template|visual creat/.test(corpus)) {
    return "visual content creation";
  }
  if (report.keywords?.length) return report.keywords.slice(0, 2).join(" / ");
  if (report.tagline && report.tagline.length < 80) return report.tagline;
  const desc = (report.description || "").replace(/\s+/g, " ").trim();
  if (desc) return desc.slice(0, 60);
  return "your product";
}

export function classifyBrand(report: BrandReport): BrandProfile {
  const corpus = brandCorpus(report);
  const audiences = audienceKinds(report);
  const lanes: BrandLane[] = [];

  const isAgency =
    /digital marketing agency|marketing agency|advertising agency|activa media|healthcare marketing|medical marketing/.test(
      corpus,
    );
  if (audiences.includes("healthcare") || (isAgency && /healthcare|medical/.test(corpus))) {
    lanes.push("healthcare");
  }
  if (isAgency || audiences.includes("marketers")) lanes.push("agency");
  if (
    audiences.includes("b2b") ||
    audiences.includes("developers") ||
    audiences.includes("founders")
  ) {
    if (!audiences.includes("athletes") && !audiences.includes("consumers")) {
      lanes.push("b2b");
    }
  }
  if (audiences.includes("consumers") || audiences.includes("athletes")) {
    lanes.push("consumer");
  }
  if (audiences.includes("designers")) lanes.push("creative");
  if (!lanes.length) lanes.push("general");

  return {
    lanes,
    corpus,
    primaryOffer: inferOffer(report, corpus, lanes),
    audienceLabel: primaryAudienceLabel(report),
    audiences,
  };
}

export function classifyTrend(signal: TrendSignal): TrendLane {
  const title = signal.title.toLowerCase();
  const text = `${signal.title} ${signal.summary}`.toLowerCase();

  if (
    signal.tag?.startsWith("live-") ||
    /google trends|news [A-Z]{2}|local news|reddit ·/i.test(signal.source)
  ) {
    return "culture_news";
  }
  if (
    (/buffer sounds|socialbee sounds/i.test(signal.source) ||
      /^(original (audio|sound)|freaked out|saxophones|petal|u \+ me|mind blank|on a mission|august by|prayer instrumental|dolce nonna)/i.test(
        title,
      )) &&
    !/trend|format|documentary|worth|ootd|transition|pov|ghosting|personalit|bob|script/i.test(
      title,
    )
  ) {
    return "audio_only";
  }
  if (
    /responding to bullies|favorite person|same age as my parents|paparazzi|fishin|girlhood|too shy|summon me|tell me more about yourself/i.test(
      title,
    )
  ) {
    return "personal_story";
  }
  if (/bob|ootd|shoe|outfit|hair|fashion|color to my day|flicker|sketch my outfit|girl grip/i.test(text)) {
    return "beauty_fashion";
  }
  if (/spain|travel|beach|summer|where are you|vacation|fishin/i.test(text)) {
    return "travel_summer";
  }
  if (/chatgpt|ai\b|script|seo|search|geo|api|changelog|integration/i.test(text)) {
    return "ai_tech";
  }
  if (/documentary|netflix|describe your job|make it illegal|myth vs fact|trust-stack/i.test(text)) {
    return "skit_documentary";
  }
  if (/worth the money|worth the stack|reasons to|what i did|hour-by-hour|subtitle gratitude|roi/i.test(text)) {
    return "list_value";
  }
  if (/transition|reveal|tap to|stomp|spark|ugly-to-hot|shoe transition|before\/after|locker-room|on-body|fit check/i.test(text)) {
    return "reveal_product";
  }
  if (/pov|ghosting|hands are full|camera roll|behind|desk|office|reaching out|influencer|day in the life/i.test(text)) {
    return "pov_bts";
  }
  if (/how different|two personalit|comparison|vs\b|side by side|teardown|campaign teardown/i.test(text)) {
    return "comparison";
  }
  if (/ghosting|joke|comedy|personalit/i.test(text)) {
    return "lifestyle_comedy";
  }
  return "other";
}

function bestAudienceForLane(
  audiences: AudienceKind[],
  trendLane: TrendLane,
  signal?: TrendSignal,
): { kind: AudienceKind; score: number } {
  const text = `${signal?.title ?? ""} ${signal?.summary ?? ""} ${signal?.source ?? ""}`.toLowerCase();
  let best: AudienceKind = audiences[0] ?? "general";
  let score = AUDIENCE_AFFINITY[best][trendLane] ?? 0;
  for (const kind of audiences) {
    let s = AUDIENCE_AFFINITY[kind][trendLane] ?? 0;
    // Soft hints from copy / playbook labels
    if (kind === "healthcare" && /patient|clinic|medical|trust-stack|myth/.test(text)) s += 8;
    if (kind === "marketers" && /marketer|campaign teardown|stitch bait/.test(text)) s += 10;
    if (kind === "developers" && /developer|changelog|api|integration|tooling/.test(text)) s += 8;
    if (kind === "athletes" && /athlete|locker-room|on-body|fit check|sport/.test(text)) s += 8;
    if (kind === "consumers" && /consumer|ootd|bob|shop/.test(text)) s += 6;
    if (kind === "founders" && /founder|operator|roi|stack vs/.test(text)) s += 6;
    if (s > score) {
      score = s;
      best = kind;
    }
  }
  return { kind: best, score };
}

function labelForKind(kind: AudienceKind, report: BrandReport): string {
  const match = (report.audiences ?? []).find((a) => audienceKindFromLabel(a) === kind);
  if (match) return match;
  switch (kind) {
    case "healthcare":
      return "Healthcare & medical decision-makers";
    case "marketers":
      return "Marketers & brand teams";
    case "founders":
      return "SME founders & operators";
    case "b2b":
      return "B2B / corporate buyers";
    case "developers":
      return "Developers & technical buyers";
    case "designers":
      return "Designers & product teams";
    case "athletes":
      return "Athletes & sports consumers";
    case "consumers":
      return "Consumer audiences";
    default:
      return primaryAudienceLabel(report);
  }
}

export function scoreBrandTrendFit(
  report: BrandReport,
  signal: TrendSignal,
): {
  score: number;
  reason: string;
  trendLane: TrendLane;
  brandLanes: BrandLane[];
  targetAudience: string;
  audienceKind: AudienceKind;
} {
  const profile = classifyBrand(report);
  const trendLane = classifyTrend(signal);
  const { kind: audienceKind, score: audienceScore } = bestAudienceForLane(
    profile.audiences,
    trendLane,
    signal,
  );
  const targetAudience = labelForKind(audienceKind, report);

  // Audience is the main driver; heat is secondary
  let score = 18 + Math.round(signal.heat / 14) + audienceScore;

  const text = `${signal.title} ${signal.summary}`.toLowerCase();
  const offerBits = profile.primaryOffer
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 4);
  const hits = offerBits.filter((w) => text.includes(w));
  if (hits.length) score += Math.min(10, hits.length * 3);

  let reason = `Matched to ${targetAudience}.`;
  if (trendLane === "culture_news") {
    const geo = geoFromReport(report);
    const isLiveRegional =
      signal.tag?.startsWith("live-") ||
      signal.tag === `live-${geo.countryCode.toLowerCase()}` ||
      signal.source.includes(geo.countryCode) ||
      signal.source.includes(geo.countryName);
    const localBrand =
      profile.corpus.includes(geo.countryName.toLowerCase()) ||
      profile.corpus.includes(`.${geo.countryCode.toLowerCase()}`) ||
      report.domain.toLowerCase().includes(`.${geo.countryCode.toLowerCase()}`) ||
      geo.confidence !== "low";
    if (isLiveRegional && localBrand) {
      score += 14;
      reason = `Live ${geo.countryName} moment for ${targetAudience}.`;
    } else if (isLiveRegional) {
      score += 4;
      reason = `Live ${geo.countryName} trend — bridge carefully to ${profile.primaryOffer}.`;
    } else if (localBrand) {
      score -= 4;
      reason = `Culture spike — only if it bridges to ${profile.primaryOffer}.`;
    } else {
      score -= 8;
      reason = `Culture spike — weak for ${targetAudience} unless adapted.`;
    }
  } else if (audienceScore >= 22) {
    reason = `Strong for ${targetAudience} (${trendLane.replace(/_/g, " ")}).`;
  } else if (audienceScore >= 8) {
    reason = `Usable for ${targetAudience} with a “${profile.primaryOffer}” angle.`;
  } else if (audienceScore < 0) {
    reason = `Poor fit for ${targetAudience} — hide unless you parody hard.`;
  }

  // Playbook rows are already audience-native
  if (/audience playbook/i.test(signal.source)) {
    score += 12;
    reason = `Built for ${targetAudience}.`;
  }

  return {
    score: Math.max(6, Math.min(98, score)),
    reason,
    trendLane,
    brandLanes: profile.lanes,
    targetAudience,
    audienceKind,
  };
}

/** Audience-native formats so feeds differ even when viral charts overlap. */
export function audiencePlaybookSignals(report: BrandReport): TrendSignal[] {
  const kinds = audienceKinds(report);
  const brand = report.name;
  const offer = classifyBrand(report).primaryOffer;
  const out: TrendSignal[] = [];

  const add = (
    id: string,
    platform: "tiktok" | "instagram",
    title: string,
    summary: string,
    audience: string,
  ) => {
    out.push({
      id: `playbook-${id}`,
      title,
      category: platform,
      platform,
      source: `Audience playbook · ${audience}`,
      heat: 90,
      summary,
      tag: "audience-playbook",
    });
  };

  if (kinds.includes("healthcare")) {
    add(
      "hc-myth",
      "tiktok",
      "Myth vs fact (patient FAQ)",
      `3 myths ${brand}'s healthcare clients still hear — calm corrections for medical decision-makers.`,
      "Healthcare & medical decision-makers",
    );
    add(
      "hc-trust",
      "instagram",
      "Trust-stack carousel",
      `Review → process → team → soft CTA. ORM-safe proof for clinic owners evaluating ${offer}.`,
      "Healthcare & medical decision-makers",
    );
  }
  if (kinds.includes("marketers")) {
    add(
      "mkt-teardown",
      "tiktok",
      "Campaign teardown stitch bait",
      `Marketer-facing teardown: what worked, what we’d cut, one tactic to steal from ${brand}.`,
      "Marketers & brand teams",
    );
  }
  if (kinds.includes("developers")) {
    add(
      "dev-doc",
      "tiktok",
      "Changelog as documentary",
      `Deadpan “documentary” on a real ${offer} changelog / integration win for developers.`,
      "Developers & technical buyers",
    );
    add(
      "dev-worth",
      "instagram",
      "Worth the stack (tooling ROI)",
      `Listicle: what in the ${offer} stack is actually worth paying for — for technical buyers & founders.`,
      "Developers & technical buyers",
    );
  }
  if (kinds.includes("founders") || kinds.includes("b2b")) {
    if (!kinds.includes("developers")) {
      add(
        "founder-worth",
        "instagram",
        "Worth it for operators",
        `Founder/B2B “worth the money” list tied to ${offer} outcomes, not lifestyle flex.`,
        kinds.includes("founders")
          ? "SME founders & operators"
          : "B2B / corporate buyers",
      );
    }
    add(
      "founder-compare",
      "tiktok",
      "Old stack vs new stack",
      `Side-by-side: DIY ops vs ${brand} for ${offer}. Built for founders and buyers.`,
      kinds.includes("founders")
        ? "SME founders & operators"
        : "B2B / corporate buyers",
    );
  }
  if (kinds.includes("athletes") || kinds.includes("consumers")) {
    add(
      "ath-reveal",
      "tiktok",
      "Locker-room product reveal",
      `Reveal/transition built for athletes & sports consumers — product proof in motion for ${brand}.`,
      kinds.includes("athletes")
        ? "Athletes & sports consumers"
        : "Consumer audiences",
    );
    add(
      "ath-ootd",
      "instagram",
      "Fit check / on-body transition",
      `OOTD or shoe-transition native to ${brand}'s consumer audience — show the product on a real body.`,
      kinds.includes("athletes")
        ? "Athletes & sports consumers"
        : "Consumer audiences",
    );
  }
  if (kinds.includes("designers")) {
    add(
      "des-reveal",
      "instagram",
      "File → final reveal",
      `Design process reveal for product/design teams using ${offer}.`,
      "Designers & product teams",
    );
  }

  return out;
}

/** Concrete brand + audience adaptation. */
export function adaptTrendForBrand(
  report: BrandReport,
  signal: TrendSignal,
): { angle: string; hooks: string[]; topicPrompt: string; voiceBlend: string; targetAudience: string } {
  const profile = classifyBrand(report);
  const fit = scoreBrandTrendFit(report, signal);
  const trendLane = fit.trendLane;
  const brand = report.name;
  const trait = report.personality[0]?.label ?? "Bold";
  const offer = profile.primaryOffer;
  const audience = fit.targetAudience;
  const title = signal.title;

  const geo = geoFromReport(report);
  const voiceBlend = `Format “${title}” → rewrite every beat for ${brand}'s ${audience} in ${geo.countryName} (${offer}). Voice: ${trait} / ${report.archetype}.`;

  let angle = "";
  let hooks: string[] = [];

  switch (trendLane) {
    case "skit_documentary":
      angle = `Deadpan documentary confessional about ${offer}, aimed at ${audience}.`;
      hooks = [
        `Netflix would cast ${offer} as a thriller for ${audience}.`,
        `${brand} ep.1 for ${audience}: the brief that wouldn’t die.`,
        `Confession booth: what ${audience} still get wrong.`,
      ];
      break;
    case "list_value":
      angle = `“Worth it” list of ${offer} proof points ${audience} will actually save.`;
      hooks = [
        `5 things worth the money in ${offer} — for ${audience}.`,
        `${audience}: skip the fluff, pay for this.`,
        `${brand}'s worth-it list for ${audience}.`,
      ];
      break;
    case "comparison":
      angle = `Old way vs ${brand} — comparison built for ${audience}.`;
      hooks = [
        `How different our lives are: DIY vs ${brand} (${audience}).`,
        `Two personalities: chaos vs ${brand} process.`,
        `${audience} before/after ${brand}.`,
      ];
      break;
    case "pov_bts":
      angle = `POV/BTS of ${offer} work that ${audience} respects.`;
      hooks = [
        `POV: ${audience} waiting on the ${offer} deliverable.`,
        `Me and my POV: ${brand} building for ${audience}.`,
        `Hands full — shipping ${offer}.`,
      ];
      break;
    case "ai_tech":
      angle = `AI/script format reframed as a ${offer} workflow ${audience} would use.`;
      hooks = [
        `ChatGPT drafted a ${offer} plan. ${brand} fixed it for ${audience}.`,
        `AI step we’d keep for ${audience} — and the one we’d cut.`,
        `${audience}: the integration tip inside the skit.`,
      ];
      break;
    case "reveal_product":
      angle = `Reveal/transition that shows ${offer} to ${audience}.`;
      hooks = [
        `Tap to reveal: the ${offer} moment for ${audience}.`,
        `Before → after with ${brand}.`,
        `${audience} product proof in under 8s.`,
      ];
      break;
    case "culture_news":
      angle = `Timely “${title}” take with a useful ${offer} bridge for ${audience}.`;
      hooks = [
        `${title}: what ${audience} should do this week.`,
        `${brand} → ${audience} on ${title}.`,
        `Newsjack only if it sells ${offer}.`,
      ];
      break;
    case "personal_story":
    case "beauty_fashion":
    case "travel_summer":
    case "lifestyle_comedy":
      if (
        fit.audienceKind === "healthcare" ||
        fit.audienceKind === "b2b" ||
        fit.audienceKind === "developers" ||
        fit.audienceKind === "founders" ||
        fit.audienceKind === "marketers"
      ) {
        angle = `Parody “${title}” — same beats, message = ${offer} for ${audience}.`;
        hooks = [
          `“${title}” but make it ${offer} for ${audience}.`,
          `${brand} parody cut for ${audience}.`,
          `Steal the format, skip the lifestyle flex.`,
        ];
      } else {
        angle = `Native “${title}” for ${audience} shopping / following ${brand}.`;
        hooks = [
          `${brand} × “${title}” for ${audience}.`,
          `On-body / in-community take for ${audience}.`,
          `${title} → shop / save ${brand}.`,
        ];
      }
      break;
    case "audio_only":
      angle = `Trending sound + ${offer} storyboard written for ${audience}.`;
      hooks = [
        `Sound is borrowed — script sells ${offer} to ${audience}.`,
        `Text overlays do the work for ${audience}.`,
        `${audience} need the tip, not just the audio.`,
      ];
      break;
    default:
      angle = `Adapt “${title}” into a ${offer} story for ${audience}.`;
      hooks = [
        `${brand} → ${audience} on “${title}”.`,
        `Format: ${title}. Message: ${offer}.`,
        `For ${audience} only.`,
      ];
  }

  const topicPrompt = [
    `Adapt trend “${title}” (${signal.source}) for ${brand}.`,
    `MARKET / COUNTRY (required): ${geo.countryName} (${geo.countryCode}).`,
    `TARGET AUDIENCE (required): ${audience}.`,
    `Offer: ${offer}. Trend type: ${trendLane.replace(/_/g, " ")}.`,
    angle,
    `Voice: ${trait} / ${report.archetype}. ${report.voiceSummary}`,
    `Every hook and CTA must speak to ${audience} in ${geo.countryName} — not a generic global follower.`,
    signal.summary ? `Trend context: ${signal.summary}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return { angle, hooks, topicPrompt, voiceBlend, targetAudience: audience };
}

/** Keep feeds varied: high audience fit first, then diversify trend lanes. */
export function rankSignalsForBrand(
  report: BrandReport,
  signals: TrendSignal[],
  options?: { minScore?: number; limit?: number; maxPerLane?: number },
): TrendSignal[] {
  const minScore = options?.minScore ?? 46;
  const limit = options?.limit ?? 16;
  const maxPerLane = options?.maxPerLane ?? 2;

  const scored = signals
    .map((s) => ({ s, fit: scoreBrandTrendFit(report, s) }))
    .filter((x) => x.fit.score >= minScore)
    .sort((a, b) => b.fit.score - a.fit.score || b.s.heat - a.s.heat);

  const picked: TrendSignal[] = [];
  const laneCounts = new Map<string, number>();

  for (const row of scored) {
    if (picked.length >= limit) break;
    const lane = row.fit.trendLane;
    const n = laneCounts.get(lane) ?? 0;
    if (n >= maxPerLane) continue;
    laneCounts.set(lane, n + 1);
    picked.push(row.s);
  }

  // If diversification was too strict, fill with next-best fits
  if (picked.length < Math.min(limit, scored.length)) {
    for (const row of scored) {
      if (picked.length >= limit) break;
      if (!picked.some((p) => p.id === row.s.id)) picked.push(row.s);
    }
  }

  return picked;
}
