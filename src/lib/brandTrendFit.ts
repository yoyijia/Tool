import type { BrandReport, TrendSignal } from "../types";

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
}

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
    return "sport & footwear culture";
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
  if (report.keywords?.length) {
    return report.keywords.slice(0, 2).join(" / ");
  }
  if (report.tagline && report.tagline.length < 80) return report.tagline;
  const desc = (report.description || "").replace(/\s+/g, " ").trim();
  if (desc) return desc.slice(0, 60);
  return "your product";
}

export function classifyBrand(report: BrandReport): BrandProfile {
  const corpus = brandCorpus(report);
  const lanes: BrandLane[] = [];

  const isAgency =
    /digital marketing agency|marketing agency|advertising agency|activa media|healthcare marketing|medical marketing/.test(
      corpus,
    );
  const isHealthcare =
    isAgency &&
    /healthcare|medical marketing|clinic|hospital|pharma|dental|patient/.test(corpus);
  const isB2b =
    /saas|b2b|api\b|cloud platform|fintech|payment|stripe|software platform|developer|enterprise software|financial infrastructure/.test(
      corpus,
    ) && !/just do it|sneaker|footwear/.test(corpus);
  const isConsumer =
    /fashion|beauty|cosmetic|apparel|retail|ecommerce|sneaker|footwear|athlete|just do it|sport|nike|consumer|shop now/.test(
      corpus,
    );
  const isCreative =
    /design tool|figma|creative suite|canva|prototype|whiteboard/.test(corpus) &&
    !isAgency;

  if (isHealthcare) lanes.push("healthcare");
  if (isAgency) lanes.push("agency");
  if (isB2b) lanes.push("b2b");
  if (isConsumer) lanes.push("consumer");
  if (isCreative) lanes.push("creative");
  if (!lanes.length) lanes.push("general");

  const audienceLabel =
    report.audiences?.slice(0, 2).join(" + ") ||
    (lanes.includes("healthcare")
      ? "healthcare decision-makers"
      : lanes.includes("b2b")
        ? "B2B buyers"
        : lanes.includes("agency")
          ? "marketers & clients"
          : lanes.includes("consumer")
            ? "consumers"
            : "your audience");

  return {
    lanes,
    corpus,
    primaryOffer: inferOffer(report, corpus, lanes),
    audienceLabel,
  };
}

export function classifyTrend(signal: TrendSignal): TrendLane {
  const title = signal.title.toLowerCase();
  const text = `${signal.title} ${signal.summary}`.toLowerCase();

  if (signal.tag === "live-sg" || /news sg|trends sg|google trends/i.test(signal.source)) {
    return "culture_news";
  }

  // Naked audio charts (Buffer / SocialBee song titles)
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
  if (/chatgpt|ai\b|script|seo|search|geo/i.test(text)) {
    return "ai_tech";
  }
  if (/documentary|netflix|describe your job|make it illegal/i.test(text)) {
    return "skit_documentary";
  }
  if (/worth the money|reasons to|what i did|hour-by-hour|subtitle gratitude/i.test(text)) {
    return "list_value";
  }
  if (/pov|ghosting|hands are full|camera roll|behind|desk|office|reaching out|influencer/i.test(text)) {
    return "pov_bts";
  }
  if (/transition|reveal|tap to|stomp|spark|ugly-to-hot|shoe transition/i.test(text)) {
    return "reveal_product";
  }
  if (/how different|two personalit|comparison|vs\b|side by side/i.test(text)) {
    return "comparison";
  }
  if (/ghosting|joke|comedy|personalit/i.test(text)) {
    return "lifestyle_comedy";
  }
  return "other";
}

const LANE_AFFINITY: Record<BrandLane, Partial<Record<TrendLane, number>>> = {
  healthcare: {
    skit_documentary: 28,
    list_value: 24,
    pov_bts: 18,
    ai_tech: 22,
    culture_news: 18,
    comparison: 14,
    reveal_product: 8,
    lifestyle_comedy: 4,
    personal_story: -6,
    beauty_fashion: -24,
    travel_summer: -14,
    audio_only: -8,
    other: 0,
  },
  agency: {
    skit_documentary: 26,
    list_value: 22,
    pov_bts: 20,
    ai_tech: 24,
    culture_news: 20,
    comparison: 16,
    reveal_product: 10,
    lifestyle_comedy: 8,
    personal_story: 2,
    beauty_fashion: -12,
    travel_summer: -6,
    audio_only: -4,
    other: 2,
  },
  b2b: {
    skit_documentary: 30,
    list_value: 28,
    ai_tech: 26,
    comparison: 20,
    pov_bts: 18,
    culture_news: 8,
    reveal_product: 12,
    lifestyle_comedy: 2,
    personal_story: -10,
    beauty_fashion: -28,
    travel_summer: -16,
    audio_only: -12,
    other: 0,
  },
  consumer: {
    beauty_fashion: 28,
    lifestyle_comedy: 20,
    personal_story: 22,
    travel_summer: 18,
    reveal_product: 24,
    comparison: 14,
    audio_only: 14,
    list_value: 12,
    pov_bts: 12,
    skit_documentary: 10,
    culture_news: 4,
    ai_tech: 2,
    other: 4,
  },
  creative: {
    reveal_product: 24,
    comparison: 18,
    beauty_fashion: 14,
    pov_bts: 16,
    skit_documentary: 14,
    lifestyle_comedy: 12,
    personal_story: 10,
    audio_only: 10,
    list_value: 10,
    ai_tech: 10,
    culture_news: 4,
    travel_summer: 6,
    other: 4,
  },
  general: {
    skit_documentary: 12,
    list_value: 12,
    comparison: 10,
    pov_bts: 10,
    culture_news: 8,
    reveal_product: 8,
    lifestyle_comedy: 6,
    personal_story: 4,
    ai_tech: 6,
    beauty_fashion: 0,
    travel_summer: 0,
    audio_only: 0,
    other: 4,
  },
};

export function scoreBrandTrendFit(
  report: BrandReport,
  signal: TrendSignal,
): { score: number; reason: string; trendLane: TrendLane; brandLanes: BrandLane[] } {
  const profile = classifyBrand(report);
  const trendLane = classifyTrend(signal);
  let score = 30 + Math.round(signal.heat / 10);

  // Average affinity across lanes so consumer+b2b mistakes don't max() their way out
  const affs = profile.lanes.map((lane) => LANE_AFFINITY[lane][trendLane] ?? 0);
  const affinity = Math.round(affs.reduce((a, b) => a + b, 0) / affs.length);
  score += affinity;

  const text = `${signal.title} ${signal.summary}`.toLowerCase();
  const offerBits = profile.primaryOffer
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 4);
  const hits = offerBits.filter((w) => text.includes(w));
  if (hits.length) score += Math.min(12, hits.length * 4);

  let reason = `Possible adaptation for ${report.name}.`;
  if (trendLane === "culture_news") {
    const isWatchlist = signal.tag === "live-sg";
    const isLocalBrand = /singapore|\.sg\b|activa|clinic|healthcare/.test(profile.corpus);
    if (isWatchlist && isLocalBrand) {
      score += 14;
      reason = `Live Singapore moment relevant to ${profile.audienceLabel}.`;
    } else if (isWatchlist && !isLocalBrand) {
      score -= 10;
      reason = "Live SG watchlist item — optional unless you sell into Singapore.";
    } else if (isLocalBrand) {
      // Raw Google search spike — keep below real format trends
      score -= 6;
      reason = "SG search spike — only use if you can bridge to the offer cleanly.";
    } else {
      score -= 18;
      reason = "SG search spike — weak fit for this company.";
    }
  } else if (affinity >= 18) {
    reason = `Strong format fit for ${profile.audienceLabel} (${trendLane.replace(/_/g, " ")}).`;
  } else if (affinity >= 6) {
    reason = `Usable for ${report.name} with a clear “${profile.primaryOffer}” angle.`;
  } else if (affinity < 0) {
    reason = `Weak literal fit for ${profile.audienceLabel} — only if you parody/adapt hard.`;
  }

  if (
    trendLane === "audio_only" &&
    (profile.lanes.includes("b2b") || profile.lanes.includes("healthcare"))
  ) {
    score -= 8;
  }

  return {
    score: Math.max(8, Math.min(98, score)),
    reason,
    trendLane,
    brandLanes: profile.lanes,
  };
}

/** Concrete brand adaptation — not “Brand does the trend” literally. */
export function adaptTrendForBrand(
  report: BrandReport,
  signal: TrendSignal,
): { angle: string; hooks: string[]; topicPrompt: string; voiceBlend: string } {
  const profile = classifyBrand(report);
  const trendLane = classifyTrend(signal);
  const brand = report.name;
  const trait = report.personality[0]?.label ?? "Bold";
  const offer = profile.primaryOffer;
  const audience = profile.audienceLabel;
  const title = signal.title;

  const voiceBlend = `Keep the native “${title}” format, but rewrite every beat for ${brand} → ${audience} (${offer}). Voice: ${trait} / ${report.archetype}.`;

  let angle = "";
  let hooks: string[] = [];

  switch (trendLane) {
    case "skit_documentary":
      angle = `Deadpan “documentary” confessional about ${offer} for ${audience} — mundane ops made cinematic.`;
      hooks = [
        `Netflix would cast our ${offer} process as a thriller.`,
        `${brand} documentary episode 1: the brief that wouldn’t die.`,
        `Sit-down confession: what ${audience} still get wrong about ${offer}.`,
      ];
      break;
    case "list_value":
      angle = `Quick-fire “worth it” list tied to ${offer} proof points ${audience} actually care about.`;
      hooks = [
        `5 things worth the money in ${offer} (from ${brand}).`,
        `Skip the fluff — what ${audience} should actually pay for.`,
        `${brand}'s worth-it list for ${audience}.`,
      ];
      break;
    case "comparison":
      angle = `Split comparison: old way vs ${brand}'s way for ${offer}.`;
      hooks = [
        `How different our lives are: DIY vs ${brand}.`,
        `Two personalities: chaos brief vs ${brand} process.`,
        `${audience}: before ${brand} / after ${brand}.`,
      ];
      break;
    case "pov_bts":
      angle = `POV / BTS of real ${brand} work — show the craft behind ${offer}.`;
      hooks = [
        `POV: you’re ghosting Slack because the ${offer} deck is due.`,
        `Me and my POV: ${brand} building for ${audience}.`,
        `Sorry, hands full — shipping ${offer}.`,
      ];
      break;
    case "ai_tech":
      angle = `AI/script trend reframed as a smart ${offer} workflow ${brand} would actually ship.`;
      hooks = [
        `We asked ChatGPT for a ${offer} plan. Then ${brand} fixed it.`,
        `AI drafted it. ${brand} made it client-ready.`,
        `${audience}: here’s the AI step we’d keep — and cut.`,
      ];
      break;
    case "reveal_product":
      angle = `Use the reveal/transition mechanic to unveil a ${offer} result or product proof.`;
      hooks = [
        `Tap to reveal: the ${offer} moment.`,
        `Transition: messy before → ${brand} after.`,
        `Before/after the ${offer} glow-up.`,
      ];
      break;
    case "culture_news":
      angle = `Timely take on “${title}” with a useful ${offer} angle for ${audience} — no empty newsjacking.`;
      hooks = [
        `${title}: what ${audience} should do this week.`,
        `${brand}'s practical take on ${title}.`,
        `Don’t just comment on ${title} — here’s the ${offer} move.`,
      ];
      break;
    case "personal_story":
    case "beauty_fashion":
    case "travel_summer":
    case "lifestyle_comedy":
      if (
        profile.lanes.includes("b2b") ||
        profile.lanes.includes("healthcare") ||
        profile.lanes.includes("agency")
      ) {
        angle = `Don’t copy the consumer literal — parody the format to talk ${offer} for ${audience}.`;
        hooks = [
          `“${title}” but make it ${offer}.`,
          `${brand} version for ${audience}: same beats, different joke.`,
          `Steal the format, skip the lifestyle flex.`,
        ];
      } else {
        angle = `Ride “${title}” natively for ${brand}'s ${audience} and ${offer}.`;
        hooks = [
          `${brand} on “${title}”.`,
          `Our take on ${title} for ${audience}.`,
          `${title} → shop / save / follow ${brand}.`,
        ];
      }
      break;
    case "audio_only":
      angle = `If you use this sound, pair it with a ${offer} storyboard for ${audience} — audio alone isn’t the idea.`;
      hooks = [
        `Sound is trending — ${brand}'s script still has to earn the view.`,
        `Use the audio; sell ${offer} in the text overlays.`,
        `${audience} don’t care about the sound unless the tip is clear.`,
      ];
      break;
    default:
      angle = `Adapt “${title}” into a ${offer} story for ${audience}.`;
      hooks = [
        `${brand}'s angle on “${title}”.`,
        `Format: ${title}. Message: ${offer}.`,
        `For ${audience}: ${title}, rewritten.`,
      ];
  }

  const topicPrompt = [
    `Adapt the trend “${title}” (${signal.source}) for ${brand}.`,
    `Audiences: ${audience}. Offer/angle: ${offer}.`,
    `Trend type: ${trendLane.replace(/_/g, " ")}. ${angle}`,
    `Voice: ${trait} / ${report.archetype}. ${report.voiceSummary}`,
    `Do NOT do a literal consumer copy — every beat should feel like ${brand}.`,
    signal.summary ? `Trend context: ${signal.summary}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return { angle, hooks, topicPrompt, voiceBlend };
}
