import type { BrandReport, TrendSuggestion } from "../types";
import { audienceLine } from "./audience";

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

function brandMatchesTrend(report: BrandReport, trend: FutureTrend): number {
  const corpus = [
    report.name,
    report.domain,
    report.description,
    report.tagline,
    ...(report.keywords ?? []),
    ...(report.audiences ?? []),
    ...(report.services ?? []),
  ]
    .join(" ")
    .toLowerCase();

  const isHealthcare = /healthcare|medical|clinic|hospital|patient|pharma/.test(corpus);
  const isAgency = /agency|marketing|seo|sem|advertising|activa/.test(corpus);
  const isB2b = /saas|b2b|api|payment|fintech|software|enterprise|stripe/.test(corpus);

  let score = 28;
  for (const tag of trend.forAudiences) {
    if (corpus.includes(tag)) score += 14;
  }
  // Healthcare-coded bets should not dominate fintech/SaaS brands
  if (!isHealthcare && !isAgency && /clinic|medical|patient|healthcare/.test(trend.title + trend.summary)) {
    score -= 22;
  }
  if (isB2b && /marketer|seo|case-study|ai intake|duo/i.test(trend.title + trend.id)) {
    score += 10;
  }
  if (isHealthcare || isAgency) score += 8;
  if (trend.horizon === "near") score += 6;
  if (trend.horizon === "emerging") score += 2;
  return Math.max(10, Math.min(96, score));
}

export function suggestFutureTrends(report: BrandReport): TrendSuggestion[] {
  const audience = audienceLine(report);
  const trait = report.personality[0]?.label ?? "Bold";
  const service = report.services?.[0] || report.keywords?.[0] || "your offer";

  return FUTURE_TRENDS.map((t) => {
    const fitScore = brandMatchesTrend(report, t);
    const fit: "high" | "medium" | "low" =
      fitScore >= 70 ? "high" : fitScore >= 48 ? "medium" : "low";

    const voiceBlend = `Run “${t.title}” for ${audience} in ${report.name}'s ${trait.toLowerCase()} voice — ${report.archetype}. Anchor every beat in ${service}.`;
    const angle = `${t.summary} ${t.why} Fit for ${report.name}: ${fit}.`;
    const hooks = [
      `POV: ${report.name} shows ${audience} how “${t.title}” works for ${service}.`,
      `${t.platform === "tiktok" ? "TikTok" : "Reels"} play for ${report.name}: ${t.title}.`,
      `${t.title}: what ${report.name} would ship for ${audience} this month.`,
    ];
    const topicPrompt = [
      `Create a ${t.platform === "tiktok" ? "TikTok" : "Instagram Reels"} concept: “${t.title}”.`,
      `Brand: ${report.name}. Audiences: ${audience}. Service: ${service}.`,
      `Horizon: ${t.horizon}. ${t.summary}`,
      `Voice: ${trait} / ${report.archetype}. ${voiceBlend}`,
      `Adapt away from generic clinic talk unless ${report.name} is healthcare.`,
    ].join(" ");

    return {
      id: `future-${t.id}`,
      trendId: t.id,
      trendTitle: t.title,
      category: t.platform,
      platform: t.platform,
      headline: `Future · ${t.title} → ${report.name}`,
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
          ? `Strong match for ${audience}.`
          : fit === "medium"
            ? `Usable if rewritten for ${report.name}.`
            : `Weak for ${report.name} — skip unless you adapt hard.`,
      timing: t.horizon === "near" ? "this_week" : "seasonal",
      voiceBlend,
    } satisfies TrendSuggestion;
  })
    .filter((s) => s.fitScore >= 36)
    .sort((a, b) => b.fitScore - a.fitScore);
}

export function futureTrendsNote(): string {
  return "Future trends are format bets for the next 1–2 quarters (healthcare + marketer playbooks), not live TikTok Creative Center or Instagram rankings.";
}
