import type { BrandReport } from "../types";
import { servicePrompts } from "./services";

/** Infer who the brand is talking to from site copy. */
export function detectAudiences(corpus: string): string[] {
  const t = corpus.toLowerCase();
  const out: string[] = [];

  if (
    /healthcare|medical marketing|clinic|hospital|pharma|doctor|dental|aesthetic|patient|medicine/.test(
      t,
    )
  ) {
    out.push("Healthcare & medical decision-makers");
  }
  if (
    /digital marketing|marketing agency|marketer|sem\b|seo\b|social media|advertising|brand strateg/.test(
      t,
    )
  ) {
    out.push("Marketers & brand teams");
  }
  if (/sme|small business|startup|founder/.test(t)) {
    out.push("SME founders & operators");
  }
  if (/b2b|enterprise|corporate/.test(t)) {
    out.push("B2B / corporate buyers");
  }
  if (/consumer|ecommerce|shopper|retail/.test(t) && !out.includes("SME founders & operators")) {
    out.push("Consumer audiences");
  }

  // Agency serving clients → dual audience is the product
  if (/agency|consultancy|services/.test(t) && out.length === 0) {
    out.push("Prospective clients", "Marketing leaders");
  }

  return [...new Set(out)].slice(0, 4);
}

export function audienceLine(report: BrandReport): string {
  if (!report.audiences?.length) return "general brand followers";
  if (report.audiences.length === 1) return report.audiences[0]!;
  return `${report.audiences.slice(0, -1).join(", ")} and ${report.audiences.at(-1)}`;
}

/** Suggested briefs from audiences + detected service lines (Activa Media catalog). */
export function audiencePrompts(report: BrandReport): string[] {
  const fromServices = servicePrompts(report);
  const a = (report.audiences ?? []).join(" ").toLowerCase();
  const healthcare = /health|medical|clinic|patient/.test(a);
  const marketers = /market/.test(a);
  const fromAudience: string[] = [];
  if (healthcare && marketers) {
    fromAudience.push(
      "Clinic lead-gen Reel for medical directors",
      "Myth-bust medical SEO for marketers",
      "Marketer-to-clinic-owner explainer",
    );
  } else if (healthcare) {
    fromAudience.push("Trust-building clinic Reel", "Patient FAQ myth-bust");
  } else if (marketers) {
    fromAudience.push("Agency POV hot take", "Campaign teardown for marketers");
  }
  return [...fromServices, ...fromAudience].slice(0, 10);
}
