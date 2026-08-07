import type { BrandReport } from "../types";

export interface BrandService {
  id: string;
  label: string;
  /** Short label for chips */
  short: string;
  themes: string[];
}

/** Canonical Activa Media–style service catalog (matched from site copy). */
export const SERVICE_CATALOG: BrandService[] = [
  {
    id: "healthcare",
    label: "Healthcare & medical marketing",
    short: "Healthcare",
    themes: ["healthcare", "medical marketing", "clinic", "hospital", "patient"],
  },
  {
    id: "seo",
    label: "Search engine optimisation (SEO)",
    short: "SEO",
    themes: ["seo", "search engine optimisation", "search engine optimization", "organic"],
  },
  {
    id: "sem",
    label: "Search engine marketing (SEM)",
    short: "SEM",
    themes: ["sem", "search engine marketing", "ppc", "google ads", "paid search"],
  },
  {
    id: "social",
    label: "Social media content & advertising",
    short: "Social",
    themes: ["social media", "content & advertising", "social advertising", "paid social"],
  },
  {
    id: "ai-geo",
    label: "AI & generative engine optimisation (GEO)",
    short: "AI & GEO",
    themes: ["generative engine", "geo", "ai &", "generative ai", "llm"],
  },
  {
    id: "orm",
    label: "Online reputation management (ORM)",
    short: "ORM",
    themes: ["reputation", "orm", "reviews", "online reputation"],
  },
  {
    id: "facebook",
    label: "Facebook",
    short: "Facebook",
    themes: ["facebook", "meta ads"],
  },
  {
    id: "instagram",
    label: "Instagram",
    short: "Instagram",
    themes: ["instagram", "reels"],
  },
  {
    id: "youtube",
    label: "YouTube",
    short: "YouTube",
    themes: ["youtube", "shorts"],
  },
  {
    id: "tiktok",
    label: "TikTok",
    short: "TikTok",
    themes: ["tiktok", "for you"],
  },
  {
    id: "web",
    label: "Website / mobile website",
    short: "Website",
    themes: ["website design", "web design", "mobile website", "web development"],
  },
  {
    id: "am-track",
    label: "AM-Track®",
    short: "AM-Track",
    themes: ["am-track", "am track", "amtrack"],
  },
];

export function detectServices(corpus: string): string[] {
  const t = corpus.toLowerCase();
  const found: string[] = [];
  for (const s of SERVICE_CATALOG) {
    if (s.themes.some((theme) => t.includes(theme))) {
      found.push(s.label);
    }
  }
  // Agency fallback: if clearly a digital marketing agency but few matches
  if (found.length < 2 && /digital marketing agency/.test(t)) {
    return SERVICE_CATALOG.filter((s) =>
      ["healthcare", "seo", "sem", "social", "ai-geo", "orm", "web"].includes(s.id),
    ).map((s) => s.label);
  }
  return found;
}

export function servicePrompts(report: BrandReport): string[] {
  const labels = (report.services ?? []).join(" ").toLowerCase();
  const prompts: string[] = [];
  if (/healthcare|medical/.test(labels)) {
    prompts.push("Healthcare campaign teaser for clinic owners");
  }
  if (/\bseo\b|optimisation|optimization/.test(labels)) {
    prompts.push("SEO win story for a medical site");
  }
  if (/\bsem\b|search engine marketing/.test(labels)) {
    prompts.push("SEM / paid search tip for marketers");
  }
  if (/social media/.test(labels)) {
    prompts.push("Social content pack for FB + IG + TikTok");
  }
  if (/geo|generative|ai &/.test(labels)) {
    prompts.push("AI & GEO explainer for brand teams");
  }
  if (/reputation|orm/.test(labels)) {
    prompts.push("ORM / review-response Reel");
  }
  if (/am-track/.test(labels)) {
    prompts.push("AM-Track reporting highlight for clients");
  }
  if (/website|web design/.test(labels)) {
    prompts.push("Website redesign before/after (mobile-first)");
  }
  if (/tiktok/.test(labels)) {
    prompts.push("TikTok ad creative for a clinic launch");
  }
  return prompts.slice(0, 8);
}

export function servicesLine(report: BrandReport): string {
  const s = report.services ?? [];
  if (!s.length) return "digital marketing services";
  if (s.length <= 2) return s.join(" & ");
  return `${s.slice(0, 2).join(", ")} +${s.length - 2} more`;
}
