import type { BrandReport, ContentPlatform } from "../types";
import {
  audienceKinds,
  audienceLine,
  primaryAudienceLabel,
  type AudienceKind,
} from "./audience";
import { classifyBrand } from "./brandTrendFit";

export type IdeaVerdict = "strong" | "ok" | "weak";

export interface IdeaFitResult {
  score: number;
  verdict: IdeaVerdict;
  targetAudience: string;
  summary: string;
  works: string[];
  risks: string[];
  rewrite: string;
  examples: string[];
}

function verdictFor(score: number): IdeaVerdict {
  if (score >= 72) return "strong";
  if (score >= 48) return "ok";
  return "weak";
}

/** Many concrete example briefs tailored to this company + audiences. */
export function exampleIdeas(report: BrandReport, limit = 16): string[] {
  const brand = report.name;
  const offer = classifyBrand(report).primaryOffer;
  const kinds = audienceKinds(report);
  const out: string[] = [];

  const push = (...items: string[]) => {
    for (const item of items) {
      if (!out.includes(item)) out.push(item);
    }
  };

  if (kinds.includes("healthcare")) {
    push(
      `Myth vs fact Reel: 3 patient myths about ${offer}`,
      `Trust-stack carousel for clinic owners (review → process → CTA)`,
      `Day-in-the-life of a medical marketer (consent-first)`,
      `“What we’d never claim in a healthcare ad” hot take`,
      `Before/after: clinic site SEO that actually booked consults`,
      `Soft CTA: download a healthcare content checklist`,
    );
  }
  if (kinds.includes("marketers")) {
    push(
      `Campaign teardown: what worked last month for ${brand}`,
      `Marketer tip: hook formulas that don’t sound salesy`,
      `Steal this brief — how ${brand} scopes a social sprint`,
      `GEO / AI search: what brand teams should do this quarter`,
      `Carousal: 5 metrics marketers should stop worshipping`,
    );
  }
  if (kinds.includes("developers")) {
    push(
      `Changelog-as-documentary: one ${offer} ship for developers`,
      `Worth the stack: what in ${offer} is actually worth paying for`,
      `Integration skit: DIY webhook vs ${brand}`,
      `API tip in 20s for technical buyers`,
      `Founder + developer duo: checkout friction confession`,
    );
  }
  if (kinds.includes("founders") || kinds.includes("b2b")) {
    push(
      `Old stack vs ${brand}: side-by-side for operators`,
      `ROI listicle: 5 things worth the money in ${offer}`,
      `Netflix documentary bit: the invoice that wouldn’t die`,
      `POV: ghosting Slack because the board deck is due`,
      `Case-study carousel: problem → approach → metric → CTA`,
    );
  }
  if (kinds.includes("athletes") || kinds.includes("consumers")) {
    push(
      `Locker-room product reveal for ${brand}`,
      `Fit check / on-body transition (shoe or kit)`,
      `Athlete POV: first wear of the new drop`,
      `Community challenge Reel tied to ${offer}`,
      `“Worth the money” list for gear that actually lasts`,
      `OOTD stop-and-details for a hero product`,
    );
  }
  if (kinds.includes("designers")) {
    push(
      `File → final reveal for design teams`,
      `Two personalities: messy draft vs ${brand} polish`,
      `Collab tip carousel for product designers`,
    );
  }

  // Universal brand-safe fillers
  push(
    `Behind the scenes: how ${brand} ships ${offer}`,
    `Customer win story aimed at ${primaryAudienceLabel(report)}`,
    `Myth-busting tip for ${primaryAudienceLabel(report)}`,
    `Feature explainer in the brand voice`,
    `Hot take: what ${primaryAudienceLabel(report)} still get wrong`,
    `Soft CTA: save/share this for your team`,
  );

  return out.slice(0, limit);
}

function pickAudienceForIdea(report: BrandReport, idea: string): string {
  const t = idea.toLowerCase();
  const kinds = audienceKinds(report);
  const ranked: { kind: AudienceKind; n: number }[] = kinds.map((kind) => {
    let n = 0;
    if (kind === "healthcare" && /clinic|patient|medical|doctor|hospital|health/.test(t)) n += 3;
    if (kind === "marketers" && /marketer|campaign|seo|sem|ads|brand team/.test(t)) n += 3;
    if (kind === "developers" && /api|sdk|dev|integration|changelog|webhook/.test(t)) n += 3;
    if (kind === "founders" && /founder|operator|roi|startup|sme/.test(t)) n += 2;
    if (kind === "b2b" && /b2b|enterprise|buyer|procurement/.test(t)) n += 2;
    if (kind === "athletes" && /athlete|sport|locker|train|race|shoe|kit/.test(t)) n += 3;
    if (kind === "consumers" && /ootd|shop|fit check|style|drop|consumer/.test(t)) n += 2;
    if (kind === "designers" && /design|figma|prototype|ui|ux/.test(t)) n += 3;
    return { kind, n };
  });
  ranked.sort((a, b) => b.n - a.n);
  const best = ranked[0];
  if (best && best.n > 0) {
    const match = (report.audiences ?? []).find((a) =>
      a.toLowerCase().includes(
        best.kind === "b2b"
          ? "b2b"
          : best.kind === "founders"
            ? "founder"
            : best.kind.slice(0, 6),
      ),
    );
    return match || primaryAudienceLabel(report);
  }
  return primaryAudienceLabel(report);
}

/**
 * Score a freeform content idea against this company + its audiences.
 */
export function scoreIdea(
  report: BrandReport,
  rawIdea: string,
  platform: ContentPlatform = "instagram",
): IdeaFitResult {
  const idea = rawIdea.trim();
  const examples = exampleIdeas(report, 12);

  if (!idea) {
    return {
      score: 0,
      verdict: "weak",
      targetAudience: primaryAudienceLabel(report),
      summary: "Type an idea first — we’ll score it for this company and audience.",
      works: [],
      risks: ["Empty brief"],
      rewrite: examples[0] ?? `Customer win story for ${report.name}`,
      examples,
    };
  }

  const profile = classifyBrand(report);
  const kinds = audienceKinds(report);
  const offer = profile.primaryOffer;
  const t = idea.toLowerCase();
  const targetAudience = pickAudienceForIdea(report, idea);

  let score = 40;
  const works: string[] = [];
  const risks: string[] = [];

  // Offer / keyword overlap
  const offerBits = offer
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3);
  const offerHits = offerBits.filter((w) => t.includes(w));
  if (offerHits.length) {
    score += Math.min(18, offerHits.length * 6);
    works.push(`Ties to ${report.name}'s offer (${offerHits.slice(0, 2).join(", ")}).`);
  } else if (report.keywords.some((k) => t.includes(k.toLowerCase()))) {
    score += 10;
    works.push("Uses language close to the brand’s keywords.");
  } else {
    score -= 8;
    risks.push(`Doesn’t clearly mention ${offer} — audience may not get why ${report.name} is posting.`);
  }

  // Audience clarity
  const audienceBits = targetAudience
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 4);
  if (audienceBits.some((w) => t.includes(w)) || /for (clinic|founder|developer|marketer|athlete|buyer)/i.test(idea)) {
    score += 14;
    works.push(`Speaks to ${targetAudience}.`);
  } else {
    score -= 6;
    risks.push(`Name the audience in the brief (e.g. “for ${targetAudience}”).`);
  }

  // Format / platform clarity
  const hasFormat =
    /reel|tiktok|carousel|story|linkedin|skit|documentary|listicle|hook|cta|pov|transition/i.test(
      idea,
    );
  if (hasFormat) {
    score += 10;
    works.push("Has a clear format (easier to produce).");
  } else {
    score -= 4;
    risks.push(`Add a format (“${platform} Reel / carousel / skit”).`);
  }

  // Mismatch: consumer fluff for B2B / healthcare
  const lifestyle =
    /vacation|spain|ootd|bob haircut|girlhood|pilates|beach day|dating|ghosting you/i.test(t);
  const serious =
    kinds.includes("healthcare") ||
    kinds.includes("b2b") ||
    kinds.includes("developers") ||
    kinds.includes("founders");
  if (lifestyle && serious && !/parody|adapt|but make it/i.test(t)) {
    score -= 22;
    risks.push(
      "Reads like a consumer lifestyle trend — parody it or swap for a format your buyers trust.",
    );
  }

  // Healthcare compliance soft check
  if (kinds.includes("healthcare") && /guaranteed|cure|miracle|#1 doctor/i.test(t)) {
    score -= 20;
    risks.push("Risky medical claim language — keep outcomes soft and consent-first.");
  } else if (kinds.includes("healthcare") && /consent|myth|trust|review|process/i.test(t)) {
    score += 8;
    works.push("Healthcare-safe angle (trust / myth / process).");
  }

  // Brand name presence (nice-to-have)
  if (t.includes(report.name.toLowerCase().slice(0, 6)) || t.includes(report.domain.split(".")[0] ?? "")) {
    score += 4;
    works.push("Anchored to the brand name/domain.");
  }

  // Platform nudge
  if (platform === "linkedin" && /meme|dance|duet|stitch/i.test(t)) {
    score -= 10;
    risks.push("LinkedIn rarely loves dance/meme formats — keep it proof-led.");
  }
  if ((platform === "tiktok" || platform === "instagram") && /whitepaper|ebook|webinar only/i.test(t)) {
    score -= 6;
    risks.push("Heavy gated-asset energy — lead with a hook, soft-CTA the download.");
  }

  // Length
  if (idea.length < 24) {
    score -= 8;
    risks.push("Too thin — add audience + offer + format in one line.");
  } else if (idea.length > 40) {
    score += 4;
  }

  score = Math.max(8, Math.min(96, score));
  const verdict = verdictFor(score);

  const rewrite = buildRewrite(report, idea, targetAudience, offer, platform, risks);

  const summary =
    verdict === "strong"
      ? `Strong fit for ${report.name} → ${targetAudience}.`
      : verdict === "ok"
        ? `Usable for ${targetAudience} — tighten offer + format.`
        : `Weak for ${audienceLine(report)} — rewrite before you shoot.`;

  // Prefer examples that aren't identical to the idea
  const filteredExamples = examples.filter(
    (e) => e.toLowerCase() !== idea.toLowerCase(),
  );

  return {
    score,
    verdict,
    targetAudience,
    summary,
    works: works.slice(0, 4),
    risks: risks.slice(0, 4),
    rewrite,
    examples: filteredExamples.slice(0, 10),
  };
}

function buildRewrite(
  _report: BrandReport,
  idea: string,
  audience: string,
  offer: string,
  platform: ContentPlatform,
  risks: string[],
): string {
  const base = idea.replace(/\s+/g, " ").trim();
  const needsAudience = !new RegExp(audience.split(/\s+/)[0] ?? "Audience", "i").test(base);
  const needsOffer = !offer
    .split(/\W+/)
    .filter((w) => w.length > 4)
    .some((w) => base.toLowerCase().includes(w));
  const needsFormat = !/reel|tiktok|carousel|skit|documentary|listicle|pov|story/i.test(base);

  const format =
    platform === "linkedin"
      ? "LinkedIn carousel"
      : platform === "tiktok"
        ? "TikTok"
        : platform === "youtube"
          ? "YouTube Short"
          : "IG Reel / carousel";

  let out = base;
  if (needsFormat) out = `${format}: ${out}`;
  if (needsAudience) out = `${out} — for ${audience}`;
  if (needsOffer) out = `${out}. Anchor in ${offer}`;
  if (risks.some((r) => /lifestyle|parody/i.test(r))) {
    out = `${format} parody of a viral format, rewritten for ${offer} / ${audience} (not a literal lifestyle flex)`;
  }
  if (risks.some((r) => /medical claim/i.test(r))) {
    out = `${format}: myth vs fact for ${audience} about ${offer} — no outcome guarantees, consent-first CTA`;
  }

  // Keep rewrite punchy
  if (out.length > 220) out = out.slice(0, 217) + "…";
  if (out === base) {
    out = `${format} for ${audience}: ${base}. Make the ${offer} proof obvious in 3 beats + soft CTA.`;
  }
  return out;
}
