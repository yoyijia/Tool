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

function ideaSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function rotate<T>(arr: T[], by: number): T[] {
  if (arr.length < 2) return arr;
  const n = by % arr.length;
  return [...arr.slice(n), ...arr.slice(0, n)];
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
  const seed = ideaSeed(report.domain || brand);
  const out: string[] = [];

  // Company-specific ingredients so no two brands get the same list
  const services = (report.services ?? []).slice(0, 4);
  const keywords = (report.keywords ?? []).filter((k) => k.length > 3).slice(0, 5);
  const trendTitle = report.trends[0]?.title;
  const trait = report.personality[0]?.label?.toLowerCase() ?? "confident";
  const tagline =
    report.tagline && report.tagline.length < 70 ? report.tagline : null;
  const country = report.geo?.countryName;
  const kw = (i: number) => keywords[i % Math.max(1, keywords.length)] ?? offer;
  const svc = (i: number) => services[i % Math.max(1, services.length)] ?? offer;

  const push = (...items: string[]) => {
    for (const item of items) {
      if (!out.includes(item)) out.push(item);
    }
  };

  if (focus) {
    const focusPool = [
      `Reel for ${focus}: the “${kw(0)}” myth ${brand} hears most, calmly corrected`,
      `Carousel for ${focus}: ${svc(0)} problem → ${brand} fix → proof → CTA`,
      `POV skit for ${focus}: waiting on the ${svc(1)} deliverable`,
      `“Worth it” list for ${focus} — what to actually pay for in ${offer}`,
      `Hot take for ${focus}: what most brands get wrong about ${kw(1)}`,
      `Behind the scenes for ${focus}: how ${brand} ships ${svc(0)}`,
      `A ${trait} explainer of ${kw(2)} for ${focus} in 30 seconds`,
      `Client-question Reel: the ${kw(0)} question ${focus} always ask ${brand}`,
      `Before/after for ${focus}: one real ${svc(0)} win (numbers on screen)`,
      `Soft CTA for ${focus}: save / share / book a chat with ${brand}`,
    ];
    if (trendTitle) {
      focusPool.splice(
        3,
        0,
        `“${trendTitle}” angle for ${focus} — ${brand}'s useful take`,
      );
    }
    if (tagline) {
      focusPool.splice(
        5,
        0,
        `“${tagline}” — shown (not said) in one Reel for ${focus}`,
      );
    }
    if (country) {
      focusPool.push(
        `${country} moment: a local hook for ${focus} tied to ${svc(0)}`,
      );
    }
    push(...rotate(focusPool, seed % 5));
  }

  if (kinds.includes("healthcare")) {
    push(
      ...rotate(
        [
          `Myth vs fact Reel: 3 patient myths about ${svc(0)}`,
          `Trust-stack carousel for clinic owners (review → process → CTA)`,
          `Day-in-the-life of a medical marketer (consent-first)`,
          `“What we’d never claim in a healthcare ad” hot take from ${brand}`,
          `Before/after: clinic ${kw(0)} that actually booked consults`,
          `Soft CTA: download ${brand}'s healthcare content checklist`,
        ],
        seed % 3,
      ),
    );
  }
  if (kinds.includes("marketers")) {
    push(
      ...rotate(
        [
          `Campaign teardown: what worked last month for ${brand}`,
          `Marketer tip: ${kw(1)} hooks that don’t sound salesy`,
          `Steal this brief — how ${brand} scopes a ${svc(0)} sprint`,
          `GEO / AI search: what brand teams should do about ${kw(0)} this quarter`,
          `Carousel: 5 ${kw(2)} metrics marketers should stop worshipping`,
        ],
        seed % 3,
      ),
    );
  }
  if (kinds.includes("developers")) {
    push(
      ...rotate(
        [
          `Changelog-as-documentary: one ${offer} ship for developers`,
          `Worth the stack: what in ${offer} is actually worth paying for`,
          `Integration skit: DIY ${kw(0)} vs ${brand}`,
          `${kw(1)} tip in 20s for technical buyers`,
          `Founder + developer duo: ${kw(2)} friction confession`,
        ],
        seed % 3,
      ),
    );
  }
  if (kinds.includes("founders") || kinds.includes("b2b")) {
    push(
      ...rotate(
        [
          `Old stack vs ${brand}: side-by-side for operators`,
          `ROI listicle: 5 things worth the money in ${offer}`,
          `Documentary bit: the ${kw(0)} invoice that wouldn’t die`,
          `Case-study carousel: ${svc(0)} problem → approach → metric → CTA`,
          `POV: explaining ${kw(1)} to the board in one slide`,
        ],
        seed % 3,
      ),
    );
  }
  if (kinds.includes("athletes") || kinds.includes("consumers")) {
    push(
      ...rotate(
        [
          `Locker-room product reveal for ${brand}`,
          `Fit check / on-body transition with a ${kw(0)} hero product`,
          `Athlete POV: first wear of the new ${brand} drop`,
          `Community challenge Reel tied to ${kw(1)}`,
          `“Worth the money” list for ${offer} that actually lasts`,
          `OOTD stop-and-details on ${brand}'s hero product`,
        ],
        seed % 3,
      ),
    );
  }
  if (kinds.includes("designers")) {
    push(
      `File → final reveal for design teams`,
      `Two personalities: messy draft vs ${brand} polish`,
      `Collab tip carousel for product designers using ${kw(0)}`,
    );
  }

  const genericPool = [
    `Behind the scenes: how ${brand} ships ${svc(0)}`,
    `Customer win story aimed at ${primaryAudienceLabel(report)}`,
    `Myth-busting tip on ${kw(0)} for ${primaryAudienceLabel(report)}`,
    `${kw(1)} explainer in ${brand}'s ${trait} voice`,
    `Hot take: what ${primaryAudienceLabel(report)} still get wrong about ${kw(2)}`,
    `Soft CTA: save/share this ${svc(0)} tip with your team`,
  ];
  if (trendTitle) {
    genericPool.unshift(`Riff on “${trendTitle}” in ${brand}'s voice`);
  }
  push(...rotate(genericPool, seed % 4));

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
