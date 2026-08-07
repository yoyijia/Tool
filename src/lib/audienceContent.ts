import type { AudienceKind } from "./audience";
import { audienceKindFromLabel } from "./audience";
import { classifyBrand } from "./brandTrendFit";
import type { BrandReport, ContentPlatform } from "../types";

/** Structured listening signal used to shape drafts (not just rename the audience). */
export interface ListeningBrief {
  trendTitle: string;
  angle: string;
  hookIdeas: string[];
  voiceBlend: string;
  fitReason: string;
  source?: string;
}

export interface AudienceScript {
  kind: AudienceKind;
  /** Who we are speaking as / to — used in copy, not a label dump */
  speakAs: string;
  pain: string;
  proof: string;
  formatName: string;
  hooks: string[];
  closers: string[];
  beats: string[];
  ctaStyle: string;
  tip: string;
  hashtags: string[];
}

const PLAYBOOKS: Record<AudienceKind, Omit<AudienceScript, "kind">> = {
  healthcare: {
    speakAs: "clinic owners and medical directors who need trust, not hype",
    pain: "patient acquisition feels risky when claims get loud",
    proof: "consent-first process, reviews, and calm myth-busting",
    formatName: "Trust-stack / myth vs fact",
    hooks: [
      "Three myths {audience} still hear about {offer}:",
      "What we’d never claim in a healthcare ad about {topic}:",
      "{audience}: trust beats volume. Here’s the stack.",
    ],
    closers: [
      "Save this before your next clinic brief.",
      "Want the checklist? Soft CTA — no outcome guarantees.",
      "Which myth should we bust next for {audience}?",
    ],
    beats: [
      "Name the myth {audience} actually believes",
      "Calm correction with process / consent language",
      "Show how {brand} runs {offer} without overclaiming",
      "Soft CTA: review → process → book a chat",
    ],
    ctaStyle: "soft, ORM-safe",
    tip: "Avoid outcome guarantees; lead with consent and process.",
    hashtags: ["HealthcareMarketing", "ClinicGrowth", "PatientTrust", "MedicalSEO"],
  },
  marketers: {
    speakAs: "in-house marketers and brand teams who need tactics they can ship",
    pain: "too many frameworks, not enough briefs that convert",
    proof: "campaign teardown, hook formulas, one stealable tactic",
    formatName: "Campaign teardown",
    hooks: [
      "Marketer teardown: what worked on {topic} (and what we’d cut).",
      "{audience}: stop worshipping vanity metrics on {topic}.",
      "Steal this {offer} brief — built for {audience}.",
    ],
    closers: [
      "Steal the tactic. Ship it this week.",
      "Which metric would you kill first?",
      "Save for your next campaign standup.",
    ],
    beats: [
      "Hook: the metric {audience} over-indexes on",
      "What actually moved the needle in {offer}",
      "One tactic to steal from {brand}",
      "CTA: comment the channel you’re testing next",
    ],
    ctaStyle: "peer-to-peer, save/share",
    tip: "Speak shop — hooks, briefs, and metrics marketers already use.",
    hashtags: ["MarketingStrategy", "CampaignTips", "ContentThatConverts", "BrandTeam"],
  },
  founders: {
    speakAs: "SME founders and operators weighing ROI, not vibes",
    pain: "busy operators can’t tell what’s worth paying for",
    proof: "side-by-side, ROI list, operator-readable proof",
    formatName: "Worth it for operators",
    hooks: [
      "Founders: what’s actually worth the money in {offer}.",
      "Old stack vs {brand} — for {audience}.",
      "{topic} only matters if it shows up on the P&L.",
    ],
    closers: [
      "If this saved you a meeting, share it with your ops lead.",
      "Want the ROI one-pager? Comment ROI.",
      "What’s the line item you’d cut first?",
    ],
    beats: [
      "Name the operator pain behind {topic}",
      "Show cost of DIY vs {brand} on {offer}",
      "One metric {audience} can take to the board",
      "CTA: book a short scoping chat",
    ],
    ctaStyle: "ROI / book a chat",
    tip: "Lead with time saved and money clarity — skip lifestyle fluff.",
    hashtags: ["FounderTips", "SMEGrowth", "OperatorLife", "ROI"],
  },
  b2b: {
    speakAs: "B2B and corporate buyers who need proof before budget",
    pain: "procurement wants clarity; fluff gets ignored",
    proof: "case-study beats, risk reduction, clear next step",
    formatName: "Case-study carousel",
    hooks: [
      "For {audience}: the {offer} decision without the brochure.",
      "Problem → approach → metric → CTA on {topic}.",
      "{brand} for buyers who hate vague decks.",
    ],
    closers: [
      "Share with your buying committee.",
      "Request the one-pager.",
      "What’s the blocker in your stack?",
    ],
    beats: [
      "Buyer problem in one line",
      "{brand} approach to {offer}",
      "Proof / risk-reduction for {audience}",
      "CTA: next step for procurement",
    ],
    ctaStyle: "committee-friendly",
    tip: "Write for the buyer and the champion who forwards the post.",
    hashtags: ["B2BMarketing", "EnterpriseBuyers", "CaseStudy", "Procurement"],
  },
  developers: {
    speakAs: "developers and technical buyers who smell marketing immediately",
    pain: "docs and demos beat slogans",
    proof: "changelog, integration tip, stack ROI",
    formatName: "Changelog / integration tip",
    hooks: [
      "Dev note: the {offer} tip inside {topic}.",
      "Changelog-as-documentary for {audience}.",
      "Worth the stack? What {audience} should actually pay for.",
    ],
    closers: [
      "Drop your stack in the comments.",
      "Docs link in the thread — go build.",
      "What broke last time you integrated this?",
    ],
    beats: [
      "Concrete friction {audience} hit",
      "One integration / API move from {brand}",
      "Show the before/after in the stack",
      "CTA: try the docs / sandbox",
    ],
    ctaStyle: "docs / ship",
    tip: "Be specific — name the friction, skip the brand adjectives.",
    hashtags: ["DevTools", "BuildInPublic", "DevRel", "APITips"],
  },
  designers: {
    speakAs: "designers and product teams who care about craft",
    pain: "messy drafts never make it to polish",
    proof: "file → final, collaboration tips, craft details",
    formatName: "File → final reveal",
    hooks: [
      "File → final: how {brand} ships {topic} for {audience}.",
      "Two personalities: messy draft vs {brand} polish.",
      "{audience}: the detail that sells {offer}.",
    ],
    closers: [
      "Save for your next critique.",
      "What’s the detail you’d never ship without?",
      "Tag a designer who obsesses over this.",
    ],
    beats: [
      "Show the messy draft",
      "The craft decision {audience} will notice",
      "How {brand} lands {offer}",
      "CTA: save / share with your product team",
    ],
    ctaStyle: "save / critique",
    tip: "Show craft, not slogans — designers trust process.",
    hashtags: ["ProductDesign", "DesignTips", "UIUX", "CreativeProcess"],
  },
  athletes: {
    speakAs: "athletes and sports fans who want on-body proof",
    pain: "generic ads don’t feel like training culture",
    proof: "locker-room reveal, first wear, community challenge",
    formatName: "Locker-room / on-body reveal",
    hooks: [
      "Locker-room reveal: {topic} for {audience}.",
      "First wear of {offer} — athlete POV.",
      "{audience}: fit check that actually matters.",
    ],
    closers: [
      "Tag your training partner.",
      "Save for race week.",
      "Drop your PR goal below.",
    ],
    beats: [
      "Cold open in training / locker energy",
      "On-body detail of {offer}",
      "Community / challenge beat for {audience}",
      "CTA: shop / join the challenge",
    ],
    ctaStyle: "community / shop",
    tip: "Stay in sport culture — movement, kit, community.",
    hashtags: ["SportsCulture", "AthleteLife", "TrainWithUs", "FitCheck"],
  },
  consumers: {
    speakAs: "shoppers who scroll for style, drops, and useful lists",
    pain: "feeds feel samey — they need a clear reason to save",
    proof: "OOTD detail, worth-it list, soft shop CTA",
    formatName: "Worth-it / OOTD detail",
    hooks: [
      "Worth it for {audience}: {topic}.",
      "Stop-and-details on {offer}.",
      "{brand} drop energy — made for {audience}.",
    ],
    closers: [
      "Save this for your next haul.",
      "Shop the detail you noticed first.",
      "Which piece are you taking?",
    ],
    beats: [
      "Visual hook {audience} will pause on",
      "One detail that sells {offer}",
      "Why it fits {audience} right now",
      "CTA: save / shop",
    ],
    ctaStyle: "save / shop",
    tip: "Lead with the visual detail, not brand jargon.",
    hashtags: ["OOTD", "WorthIt", "ShopTheLook", "ConsumerTrends"],
  },
  general: {
    speakAs: "people who follow the brand for clear, useful stories",
    pain: "generic posts that could belong to anyone",
    proof: "one concrete brand moment + clear CTA",
    formatName: "Brand story beat",
    hooks: [
      "{brand} on {topic} — for {audience}.",
      "A clearer take on {topic}.",
      "What {audience} actually need from {offer}:",
    ],
    closers: [
      "What’s your take?",
      "Follow for the next drop.",
      "Save this for later.",
    ],
    beats: [
      "Hook tied to {topic}",
      "How {brand} approaches {offer}",
      "One useful tip for {audience}",
      "CTA: engage / follow",
    ],
    ctaStyle: "simple engage",
    tip: "Make the post un-swappable — specific to this brand and audience.",
    hashtags: ["BrandStory", "AudienceFirst", "ContentTips", "SocialStrategy"],
  },
};

function fill(
  template: string,
  vars: Record<string, string>,
): string {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{${k}}`, v);
  }
  return out;
}

export function scriptForAudience(
  report: BrandReport,
  audienceLabel: string,
): AudienceScript {
  const kind = audienceKindFromLabel(audienceLabel);
  const base = PLAYBOOKS[kind];
  const offer = classifyBrand(report).primaryOffer;
  return {
    kind,
    ...base,
    speakAs: base.speakAs,
    pain: fill(base.pain, { offer, brand: report.name, audience: audienceLabel }),
    proof: fill(base.proof, { offer, brand: report.name, audience: audienceLabel }),
  };
}

export function fillAudienceLine(
  template: string,
  report: BrandReport,
  audience: string,
  topic: string,
): string {
  const offer = classifyBrand(report).primaryOffer;
  return fill(template, {
    brand: report.name,
    audience,
    topic,
    offer,
  });
}

/** Pick a playbook-native listening seed when the user didn’t pick a live trend. */
export function listeningSeedForAudience(
  report: BrandReport,
  audienceLabel: string,
): ListeningBrief {
  const script = scriptForAudience(report, audienceLabel);
  const offer = classifyBrand(report).primaryOffer;
  const brand = report.name;
  return {
    trendTitle: script.formatName,
    angle: `${script.formatName} for ${audienceLabel}: ${script.proof}. Offer: ${offer}.`,
    hookIdeas: script.hooks
      .slice(0, 3)
      .map((h) => fillAudienceLine(h, report, audienceLabel, offer)),
    voiceBlend: `Audience playbook (${script.kind}) → rewrite every beat for ${brand}'s ${audienceLabel}.`,
    fitReason: `Matched ${audienceLabel} playbook (${script.formatName}) so drafts aren’t generic renames.`,
    source: `Audience playbook · ${audienceLabel}`,
  };
}

export function platformBeats(
  platform: ContentPlatform,
  script: AudienceScript,
  vars: Record<string, string>,
): string[] {
  const filled = script.beats.map((b) => fill(b, vars));
  if (platform === "tiktok" || platform === "youtube") {
    return [
      `0–1s: on-screen hook for ${vars.audience}`,
      ...filled.map((b, i) => `${i + 1}. ${b}`),
      `Close: ${script.ctaStyle} CTA`,
    ];
  }
  return filled;
}
