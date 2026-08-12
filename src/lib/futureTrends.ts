import type { BrandReport, TrendSuggestion } from "../types";
import { audienceKinds, audienceLine, primaryAudienceLabel } from "./audience";

export interface FutureTrend {
  id: string;
  platform: "tiktok" | "instagram";
  title: string;
  horizon: "near" | "next" | "emerging";
  summary: string;
  /** Who this is especially useful for */
  forAudiences: string[];
  why: string;
}

/**
 * Forward-looking format bets for TikTok / Instagram — not live charts.
 * Tuned for agencies serving healthcare clients + marketers (e.g. Activa Media).
 */
const FUTURE_TRENDS: FutureTrend[] = [
  {
    id: "tt-clinic-dil",
    platform: "tiktok",
    title: "Clinic day-in-the-life (consent-first)",
    horizon: "near",
    summary:
      "Staff/doctor POV with on-screen compliance disclaimers — humanizes clinics without overclaiming outcomes.",
    forAudiences: ["healthcare", "medical", "marketers"],
    why: "Search + For You both reward authentic facility tours; high trust for medical lead-gen.",
  },
  {
    id: "tt-myth-fact",
    platform: "tiktok",
    title: "Myth vs fact medical carousels → stitch bait",
    horizon: "near",
    summary:
      "3 myths patients Google, one calm correction, invite stitch “what your clinic still gets wrong.”",
    forAudiences: ["healthcare", "medical", "marketers"],
    why: "Educational formats keep winning saves; stitches expand reach to marketers and clinic owners.",
  },
  {
    id: "tt-seo-search",
    platform: "tiktok",
    title: "TikTok Search SEO for clinic keywords",
    horizon: "next",
    summary:
      "Treat TikTok like Google: answer “best [treatment] Singapore” style queries with chaptered text overlays.",
    forAudiences: ["healthcare", "marketers", "seo"],
    why: "Platform search is becoming a discovery channel clinics underestimate.",
  },
  {
    id: "ig-trust-carousel",
    platform: "instagram",
    title: "Trust-stack carousels (reviews → process → CTA)",
    horizon: "near",
    summary:
      "Slide 1 review quote, slide 2 process proof, slide 3 team, slide 4 soft booking CTA — ORM-friendly.",
    forAudiences: ["healthcare", "medical", "marketers"],
    why: "Carousels still drive saves; perfect for medical reputation work.",
  },
  {
    id: "ig-reels-duo",
    platform: "instagram",
    title: "Marketer × clinician duo Reels",
    horizon: "next",
    summary:
      "Split-screen: marketer explains the funnel, clinician explains the care moment — dual audience in one asset.",
    forAudiences: ["healthcare", "marketers"],
    why: "Activa-style agencies sell to both sides; one Reel speaks both languages.",
  },
  {
    id: "tt-ai-intake",
    platform: "tiktok",
    title: "AI intake / booking explainer skits",
    horizon: "emerging",
    summary:
      "Playful “patient vs chatbot vs human coordinator” skits that position smart digital ops for clinics.",
    forAudiences: ["healthcare", "marketers", "ai"],
    why: "GEO/AI marketing is a live agency wedge; skits make it concrete.",
  },
  {
    id: "ig-ugc-consent",
    platform: "instagram",
    title: "Consent-framed UGC testimonials",
    horizon: "near",
    summary:
      "Patient or client UGC with visible consent line + clinic reply sticker — builds ORM without risk.",
    forAudiences: ["healthcare", "medical"],
    why: "Regulated categories need proof that still feels native.",
  },
  {
    id: "tt-locale",
    platform: "tiktok",
    title: "Bilingual SG captions (EN + ZH/MS)",
    horizon: "next",
    summary:
      "Same Reel, dual-language text for Singapore medical catchments — expands search surface.",
    forAudiences: ["healthcare", "marketers", "singapore"],
    why: "Local SEO + social collide; agencies in SG can own this playbook.",
  },
  {
    id: "ig-case-doc",
    platform: "instagram",
    title: "Mini case-study documents for LinkedIn→IG cross-post",
    horizon: "near",
    summary:
      "5-slide “problem → approach → metric → lesson → CTA” for marketers evaluating agencies.",
    forAudiences: ["marketers"],
    why: "Marketer buyers still want proof packs they can forward internally.",
  },
  {
    id: "tt-green-review",
    platform: "tiktok",
    title: "Green-screen over Google review walls",
    horizon: "near",
    summary:
      "React to real reviews (anonymized) — ORM content that feels like native TikTok commentary.",
    forAudiences: ["healthcare", "marketers", "orm"],
    why: "Reputation management becomes entertainment; strong for clinic acquisition.",
  },
];

function brandMatchesTrend(report: BrandReport, trend: FutureTrend): {
  score: number;
  targetAudience: string;
} {
  const kinds = audienceKinds(report);
  const corpus = [
    report.name,
    report.domain,
    report.description,
    ...(report.audiences ?? []),
    ...(report.services ?? []),
  ]
    .join(" ")
    .toLowerCase();

  let score = 24;
  let targetAudience = primaryAudienceLabel(report);

  for (const tag of trend.forAudiences) {
    if (corpus.includes(tag)) score += 16;
    if (tag === "healthcare" && kinds.includes("healthcare")) {
      score += 10;
      targetAudience = "Healthcare & medical decision-makers";
    }
    if (tag === "marketers" && kinds.includes("marketers")) {
      score += 8;
      if (!kinds.includes("healthcare")) targetAudience = "Marketers & brand teams";
    }
  }

  const healthcareTrend = /clinic|medical|patient|healthcare|consent|doctor/.test(
    `${trend.title} ${trend.summary}`,
  );
  if (healthcareTrend && !kinds.includes("healthcare")) score -= 28;
  if (!healthcareTrend && (kinds.includes("developers") || kinds.includes("founders"))) {
    score += 8;
  }
  if (
    (kinds.includes("athletes") || kinds.includes("consumers")) &&
    /ugc|duo|case-study|seo|clinic/i.test(trend.id)
  ) {
    score -= 18;
  }
  if (trend.horizon === "near") score += 6;
  if (trend.horizon === "emerging") score += 2;

  return {
    score: Math.max(8, Math.min(96, score)),
    targetAudience,
  };
}

export function suggestFutureTrends(report: BrandReport): TrendSuggestion[] {
  const audience = audienceLine(report);
  const trait = report.personality[0]?.label ?? "Bold";
  const service = report.services?.[0] || report.keywords?.[0] || "your offer";

  return FUTURE_TRENDS.map((t) => {
    const { score: fitScore, targetAudience } = brandMatchesTrend(report, t);
    const fit: "high" | "medium" | "low" =
      fitScore >= 70 ? "high" : fitScore >= 48 ? "medium" : "low";

    const voiceBlend = `Run “${t.title}” for ${targetAudience} in ${report.name}'s ${trait.toLowerCase()} voice — ${report.archetype}. Anchor every beat in ${service}.`;
    const angle = `${t.summary} Written for ${targetAudience}. ${t.why}`;
    const hooks = [
      `POV: ${report.name} shows ${targetAudience} how “${t.title}” works.`,
      `${t.platform === "tiktok" ? "TikTok" : "Reels"} for ${targetAudience}: ${t.title}.`,
      `${t.title}: what ${report.name} would ship for ${targetAudience}.`,
    ];
    const topicPrompt = [
      `Create a ${t.platform === "tiktok" ? "TikTok" : "Instagram Reels"} concept: “${t.title}”.`,
      `Brand: ${report.name}. TARGET AUDIENCE: ${targetAudience}.`,
      `Also consider: ${audience}. Service: ${service}.`,
      `Horizon: ${t.horizon}. ${t.summary}`,
      `Voice: ${trait} / ${report.archetype}. ${voiceBlend}`,
    ].join(" ");

    return {
      id: `future-${t.id}`,
      trendId: t.id,
      trendTitle: t.title,
      category: t.platform,
      platform: t.platform,
      headline: `Future · ${t.title} → ${targetAudience}`,
      angle,
      platforms:
        t.platform === "tiktok"
          ? ["TikTok", "Instagram Reels"]
          : ["Instagram Reels", "TikTok"],
      hookIdeas: hooks,
      topicPrompt,
      fitScore,
      fitReason:
        fit === "high"
          ? `Strong match for ${targetAudience}.`
          : fit === "medium"
            ? `Usable if rewritten for ${targetAudience}.`
            : `Weak for ${targetAudience}.`,
      timing: t.horizon === "near" ? "this_week" : "seasonal",
      voiceBlend,
      targetAudience,
    } satisfies TrendSuggestion;
  })
    .filter((s) => s.fitScore >= 40)
    .sort((a, b) => b.fitScore - a.fitScore);
}

export function futureTrendsNote(): string {
  return "Future trends are format bets for the next 1–2 quarters (healthcare + marketer playbooks), not live TikTok Creative Center or Instagram rankings.";
}
