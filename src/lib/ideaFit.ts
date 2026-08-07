import type { BrandReport, ContentPlatform } from "../types";
import {
  audienceKinds,
  primaryAudienceLabel,
  type AudienceKind,
} from "./audience";
import { classifyBrand } from "./brandTrendFit";

export type IdeaVerdict = "works" | "maybe" | "wont";

export interface IdeaFitResult {
  score: number;
  verdict: IdeaVerdict;
  /** Plain-language answer to “does this work?” */
  answer: string;
  targetAudience: string;
  summary: string;
  works: string[];
  risks: string[];
  rewrite: string;
  examples: string[];
}

function verdictFor(score: number): IdeaVerdict {
  if (score >= 70) return "works";
  if (score >= 45) return "maybe";
  return "wont";
}

function answerFor(verdict: IdeaVerdict, audience: string, brand: string): string {
  if (verdict === "works") {
    return `Yes — this can work for ${audience} from ${brand}.`;
  }
  if (verdict === "maybe") {
    return `Maybe — usable for ${audience}, but tighten it before you shoot.`;
  }
  return `No — this won’t land well for ${audience} as written.`;
}

/** Many concrete example briefs tailored to this company + audiences. */
export function exampleIdeas(
  report: BrandReport,
  limit = 16,
  focusAudience?: string,
): string[] {
  const brand = report.name;
  const offer = classifyBrand(report).primaryOffer;
  const kinds = audienceKinds(report);
  const focus = focusAudience?.trim();
  const out: string[] = [];

  const push = (...items: string[]) => {
    for (const item of items) {
      if (!out.includes(item)) out.push(item);
    }
  };

  if (focus) {
    push(
      `Reel for ${focus}: one myth about ${offer}, calmly corrected`,
      `Carousel for ${focus}: problem → ${brand} approach → proof → CTA`,
      `POV skit aimed at ${focus} about ${offer}`,
      `“Worth it” list for ${focus} — what to pay for in ${offer}`,
      `Hot take for ${focus}: what most people still get wrong`,
      `Behind the scenes for ${focus}: how ${brand} ships ${offer}`,
      `Documentary bit for ${focus}: the brief that wouldn’t die`,
      `Soft CTA for ${focus}: save / share / book a chat`,
    );
  }

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
      `Carousel: 5 metrics marketers should stop worshipping`,
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

function ideaMentionsAudience(idea: string, audience: string): boolean {
  const t = idea.toLowerCase();
  const bits = audience
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3);
  if (bits.some((w) => t.includes(w))) return true;
  return /\bfor\b.{0,40}\b(clinic|founder|developer|marketer|athlete|buyer|patient|owner|shopper|gen z)/i.test(
    idea,
  );
}

function ideaMentionsOffer(idea: string, offer: string, report: BrandReport): boolean {
  const t = idea.toLowerCase();
  const bits = offer
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3);
  if (bits.some((w) => t.includes(w))) return true;
  if (report.keywords.some((k) => k.length > 3 && t.includes(k.toLowerCase()))) return true;
  if (t.includes(report.domain.split(".")[0] ?? "")) return true;
  return /seo|sem|marketing|payment|api|product|campaign|brand|service|clinic|gear|shoe/i.test(
    t,
  );
}

/**
 * Score a freeform content idea against this company + a chosen audience.
 * Returns a clear yes / maybe / no so users can see if the concept works.
 */
export function scoreIdea(
  report: BrandReport,
  rawIdea: string,
  platform: ContentPlatform = "instagram",
  targetAudienceOverride?: string,
): IdeaFitResult {
  const idea = rawIdea.trim();
  const targetAudience =
    targetAudienceOverride?.trim() ||
    (idea ? pickAudienceForIdea(report, idea) : primaryAudienceLabel(report));
  const examples = exampleIdeas(report, 12, targetAudience);

  if (!idea) {
    return {
      score: 0,
      verdict: "wont",
      answer: "Type a rough concept first — then we’ll say if it works.",
      targetAudience,
      summary: "No idea yet.",
      works: [],
      risks: ["Empty concept"],
      rewrite: examples[0] ?? `Customer win story for ${report.name}`,
      examples,
    };
  }

  const profile = classifyBrand(report);
  const kinds = audienceKinds(report);
  const offer = profile.primaryOffer;
  const t = idea.toLowerCase();

  let score = 28;
  const works: string[] = [];
  const risks: string[] = [];

  // 1) Specificity — rough one-liners need more meat
  if (idea.length < 18 || /^(idea|post|content|video|reel)\b/i.test(idea)) {
    score -= 14;
    risks.push("Too vague — say what happens in the post (hook + point).");
  } else if (idea.length >= 40) {
    score += 8;
    works.push("Specific enough to brief a creator.");
  } else {
    score += 2;
  }

  // 2) Does it connect to the brand offer?
  if (ideaMentionsOffer(idea, offer, report)) {
    score += 18;
    works.push(`Links to what ${report.name} sells (${offer}).`);
  } else {
    score -= 16;
    risks.push(
      `Doesn’t connect to ${report.name}'s offer (${offer}) — ${targetAudience} won’t know why you’re posting.`,
    );
  }

  // 3) Does the concept fit THIS audience?
  const audienceHit = ideaMentionsAudience(idea, targetAudience);
  if (audienceHit) {
    score += 14;
    works.push(`Clearly aimed at ${targetAudience}.`);
  } else {
    score -= 10;
    risks.push(
      `Not clearly written for ${targetAudience} — add “for ${targetAudience}” or their pain point.`,
    );
  }

  // Extra: lifestyle fluff that won't work for serious audiences
  const lifestyle =
    /vacation|spain|ootd|bob haircut|girlhood|pilates|beach|dating|ghosting you|party vibes|just for fun/i.test(
      t,
    );
  const serious =
    /clinic|medical|health|founder|b2b|developer|enterprise|buyer|marketer|patient|seo|sem/i.test(
      targetAudience,
    ) ||
    kinds.includes("healthcare") ||
    kinds.includes("b2b") ||
    kinds.includes("developers") ||
    kinds.includes("founders");

  if (lifestyle && serious && !/parody|adapt|but make it|myth/i.test(t)) {
    score -= 24;
    risks.push(
      `Lifestyle / vacation energy won’t work for ${targetAudience} — parody the format or pick a proof-led angle.`,
    );
  } else if (!lifestyle && serious) {
    score += 4;
  }

  // 4) Format clarity
  const hasFormat =
    /reel|tiktok|carousel|story|linkedin|skit|documentary|listicle|hook|cta|pov|transition|short|thread/i.test(
      idea,
    );
  if (hasFormat) {
    score += 10;
    works.push("Names a format (easier to produce).");
  } else {
    score -= 6;
    risks.push(`Add a format (“${platform} Reel / carousel / skit”).`);
  }

  // 5) Healthcare claim risk
  if (
    (/health|clinic|medical|patient/i.test(targetAudience) || kinds.includes("healthcare")) &&
    /guaranteed|cure|miracle|#1 doctor|100% results/i.test(t)
  ) {
    score -= 22;
    risks.push("Risky medical claim — keep outcomes soft and consent-first.");
  } else if (
    (/health|clinic|medical/i.test(targetAudience) || kinds.includes("healthcare")) &&
    /consent|myth|trust|review|process|faq/i.test(t)
  ) {
    score += 8;
    works.push("Healthcare-safe angle (trust / myth / process).");
  }

  // 6) Platform mismatch
  if (platform === "linkedin" && /meme|dance|duet|stitch|thirst/i.test(t)) {
    score -= 12;
    risks.push("Won’t work on LinkedIn — drop the meme/dance energy.");
  }

  // Nonsense / gibberish
  if (/^[a-z]{8,}$/i.test(idea.replace(/\s/g, "")) && !/[aeiou]{2}/i.test(idea)) {
    score = 8;
    risks.push("Looks like placeholder text — write a real concept.");
  }

  score = Math.max(5, Math.min(96, Math.round(score)));
  const verdict = verdictFor(score);
  const rewrite = buildRewrite(report, idea, targetAudience, offer, platform, risks);
  const answer = answerFor(verdict, targetAudience, report.name);

  const summary =
    verdict === "works"
      ? `Good fit for ${targetAudience}.`
      : verdict === "maybe"
        ? `Borderline for ${targetAudience} — fix the gaps below.`
        : `Poor fit for ${targetAudience} — use the rewrite.`;

  return {
    score,
    verdict,
    answer,
    targetAudience,
    summary,
    works: works.slice(0, 4),
    risks: risks.slice(0, 4),
    rewrite,
    examples: examples.filter((e) => e.toLowerCase() !== idea.toLowerCase()).slice(0, 10),
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
  const needsAudience = !ideaMentionsAudience(base, audience);
  const needsOffer = !offer
    .split(/\W+/)
    .filter((w) => w.length > 4)
    .some((w) => base.toLowerCase().includes(w));
  const needsFormat = !/reel|tiktok|carousel|skit|documentary|listicle|pov|story|short|thread/i.test(
    base,
  );

  const format =
    platform === "linkedin"
      ? "LinkedIn carousel"
      : platform === "tiktok"
        ? "TikTok"
        : platform === "youtube"
          ? "YouTube Short"
          : "IG Reel / carousel";

  if (risks.some((r) => /lifestyle|vacation/i.test(r))) {
    return `${format} for ${audience}: parody a viral format to explain ${offer} (proof + soft CTA — not a lifestyle flex)`;
  }
  if (risks.some((r) => /medical claim/i.test(r))) {
    return `${format}: myth vs fact for ${audience} about ${offer} — no outcome guarantees, consent-first CTA`;
  }
  if (risks.some((r) => /vague|placeholder/i.test(r))) {
    return `${format} for ${audience}: one clear problem with ${offer} → ${_report.name} fix → soft CTA`;
  }

  let out = base;
  if (needsFormat) out = `${format}: ${out}`;
  if (needsAudience) out = `${out} — for ${audience}`;
  if (needsOffer) out = `${out}. Make ${offer} the proof point`;
  if (out.length > 220) out = `${out.slice(0, 217)}…`;
  if (out === base) {
    out = `${format} for ${audience}: ${base}. Show ${offer} in 3 beats + soft CTA.`;
  }
  return out;
}
