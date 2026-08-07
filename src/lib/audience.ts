import type { BrandReport } from "../types";
import { servicePrompts } from "./services";

/** Coarse audience kinds used for trend ranking. */
export type AudienceKind =
  | "healthcare"
  | "marketers"
  | "founders"
  | "b2b"
  | "developers"
  | "designers"
  | "athletes"
  | "consumers"
  | "general";

const KIND_LABEL: Record<AudienceKind, string> = {
  healthcare: "Healthcare & medical decision-makers",
  marketers: "Marketers & brand teams",
  founders: "SME founders & operators",
  b2b: "B2B / corporate buyers",
  developers: "Developers & technical buyers",
  designers: "Designers & product teams",
  athletes: "Athletes & sports consumers",
  consumers: "Consumer audiences",
  general: "General brand followers",
};

/** Infer who the brand is talking to from site copy — ordered by priority. */
export function detectAudiences(corpus: string): string[] {
  const t = corpus.toLowerCase();
  const isAgency =
    /digital marketing agency|marketing agency|advertising agency|activa media|healthcare marketing|medical marketing/.test(
      t,
    );
  const isConsumerBrand =
    !isAgency &&
    /sneaker|footwear|just do it|athlete|apparel|beauty|cosmetic|nike|jordan|running shoe/.test(
      t,
    );
  // Require strong product-platform signals — random “API”/“docs” in footers don’t count
  const isDevPlatform =
    !isConsumerBrand &&
    (/payment infrastructure|financial infrastructure|\bstripe\b/.test(t) ||
      (/\b(?:rest )?api\b/.test(t) &&
        /for developers|developer docs|sdk\b|api reference/.test(t)));
  const isDesignTool =
    !isConsumerBrand &&
    /figma|design tool|prototype|whiteboard|canva|creative suite/.test(t) &&
    !isAgency;

  const out: string[] = [];

  // Consumer / sport brands: keep the audience list about buyers, not marketers
  if (isConsumerBrand || /athlete|sport|sneaker|footwear|just do it/.test(t)) {
    if (/athlete|sport|sneaker|footwear|just do it|nike|jordan/.test(t)) {
      out.push(KIND_LABEL.athletes);
    }
    out.push(KIND_LABEL.consumers);
    return [...new Set(out)].slice(0, 4);
  }

  if (isAgency && /healthcare|medical|clinic|hospital|patient/.test(t)) {
    out.push(KIND_LABEL.healthcare);
  }
  if (isAgency) {
    out.push(KIND_LABEL.marketers);
  }
  if (isDevPlatform) {
    out.push(KIND_LABEL.developers);
    out.push(KIND_LABEL.founders);
    out.push(KIND_LABEL.b2b);
  } else if (isDesignTool) {
    out.push(KIND_LABEL.designers);
    out.push(KIND_LABEL.founders);
  } else if (/b2b|enterprise|saas|fintech|software platform|corporate/.test(t)) {
    out.push(KIND_LABEL.b2b);
    if (/sme|startup|founder|small business/.test(t)) out.push(KIND_LABEL.founders);
  }

  if (/consumer|ecommerce|shopper|retail/.test(t) && !isAgency) {
    out.push(KIND_LABEL.consumers);
  }

  if (!isAgency && !isDevPlatform && /sme|small business|startup|founder/.test(t)) {
    if (!out.includes(KIND_LABEL.founders)) out.push(KIND_LABEL.founders);
  }

  // Agency serving clients with no healthcare signal
  if (isAgency && out.length === 1 && out[0] === KIND_LABEL.marketers) {
    out.push("Prospective clients");
  }

  if (!out.length) {
    if (/agency|consultancy|services/.test(t)) {
      out.push("Prospective clients", KIND_LABEL.marketers);
    } else {
      out.push(KIND_LABEL.general);
    }
  }

  return [...new Set(out)].slice(0, 4);
}

export function audienceKindFromLabel(label: string): AudienceKind {
  const t = label.toLowerCase();
  if (/health|medical|clinic|patient/.test(t)) return "healthcare";
  if (/marketer|brand team/.test(t)) return "marketers";
  if (/developer|technical/.test(t)) return "developers";
  if (/designer|product team/.test(t)) return "designers";
  if (/athlete|sport/.test(t)) return "athletes";
  if (/founder|sme|operator/.test(t)) return "founders";
  if (/b2b|corporate|enterprise/.test(t)) return "b2b";
  if (/consumer/.test(t)) return "consumers";
  return "general";
}

/** Ordered audience kinds for a brand report. */
export function audienceKinds(report: BrandReport): AudienceKind[] {
  const fromLabels = (report.audiences ?? []).map(audienceKindFromLabel);
  if (fromLabels.length) return [...new Set(fromLabels)];
  return ["general"];
}

export function audienceLine(report: BrandReport): string {
  if (!report.audiences?.length) return "general brand followers";
  if (report.audiences.length === 1) return report.audiences[0]!;
  return `${report.audiences.slice(0, -1).join(", ")} and ${report.audiences.at(-1)}`;
}

export function primaryAudienceLabel(report: BrandReport): string {
  return report.audiences?.[0] || KIND_LABEL.general;
}

/** Suggested briefs from audiences + detected service lines. */
export function audiencePrompts(report: BrandReport): string[] {
  const fromServices = servicePrompts(report);
  const kinds = audienceKinds(report);
  const fromAudience: string[] = [];

  if (kinds.includes("healthcare") && kinds.includes("marketers")) {
    fromAudience.push(
      "Clinic lead-gen Reel for medical directors",
      "Myth-bust medical SEO for marketers",
      "Marketer-to-clinic-owner explainer",
      "Trust-stack carousel for clinic owners",
      "What we’d never claim in a healthcare ad",
      "GEO tip marketers can pitch to medical clients",
    );
  } else if (kinds.includes("healthcare")) {
    fromAudience.push(
      "Trust-building clinic Reel",
      "Patient FAQ myth-bust",
      "Consent-first day-in-the-life",
      "Review → process → booking CTA carousel",
    );
  }
  if (kinds.includes("developers")) {
    fromAudience.push(
      "API / integration tip for developers",
      "Founder checkout friction skit",
      "Changelog-as-documentary",
      "Worth the stack (tooling ROI)",
      "Old stack vs new stack comparison",
    );
  }
  if (kinds.includes("athletes") || kinds.includes("consumers")) {
    fromAudience.push(
      "Product reveal transition",
      "Athlete / community POV Reel",
      "Fit check / on-body transition",
      "Locker-room product reveal",
      "Worth the money gear list",
      "OOTD stop-and-details",
    );
  }
  if (kinds.includes("marketers") && !kinds.includes("healthcare")) {
    fromAudience.push(
      "Agency POV hot take",
      "Campaign teardown for marketers",
      "Hook formulas that don’t sound salesy",
      "5 metrics marketers should stop worshipping",
    );
  }
  if (kinds.includes("founders") || kinds.includes("b2b")) {
    fromAudience.push(
      "ROI listicle Reel for founders",
      "Before/after ops documentary",
      "Old stack vs new stack",
      "Case-study carousel: problem → metric → CTA",
    );
  }
  if (kinds.includes("designers")) {
    fromAudience.push(
      "File → final reveal",
      "Two personalities: draft vs polish",
      "Collab tip for product designers",
    );
  }

  return [...fromServices, ...fromAudience].slice(0, 14);
}

export { KIND_LABEL };
