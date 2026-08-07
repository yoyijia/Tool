import type {
  BrandReport,
  ContentBrief,
  ContentPlatform,
  GeneratedPost,
  VoicePreset,
  VoicePresetId,
} from "../types";
import { resolveTargetAudience } from "./audience";
import {
  fillAudienceLine,
  listeningSeedForAudience,
  platformBeats,
  scriptForAudience,
  type ListeningBrief,
} from "./audienceContent";
import { classifyBrand } from "./brandTrendFit";
import { servicesLine } from "./services";

export const VOICE_PRESETS: VoicePreset[] = [
  {
    id: "detected",
    label: "Detected voice",
    blurb: "Match the tone inferred from the reference site.",
    hooks: [],
    closers: [],
    styleNotes: [],
  },
  {
    id: "bold",
    label: "Bold & disruptive",
    blurb: "Punchy claims, strong opinions, zero fluff.",
    hooks: [
      "Most brands get this wrong.",
      "Stop doing {topic} the old way.",
      "Unpopular opinion about {topic}:",
    ],
    closers: [
      "Agree? Say so below.",
      "If this hit, share it with someone still playing safe.",
      "Ready to move differently? Start here.",
    ],
    styleNotes: ["short sentences", "provocative openers", "high contrast CTAs"],
  },
  {
    id: "warm",
    label: "Warm & conversational",
    blurb: "Human, inviting, community-first storytelling.",
    hooks: [
      "Can we talk about {topic} for a second?",
      "We’ve been thinking a lot about {topic}.",
      "Real talk: {topic} doesn’t have to feel hard.",
    ],
    closers: [
      "We’re with you — drop your take in the comments.",
      "Tag someone who needs this reminder.",
      "What’s your version of this story?",
    ],
    styleNotes: ["you/we language", "empathy", "soft CTAs"],
  },
  {
    id: "premium",
    label: "Premium & refined",
    blurb: "Sparse, elegant, detail-obsessed.",
    hooks: [
      "A quieter take on {topic}.",
      "Crafted for those who notice.",
      "On {topic} — less noise, more intention.",
    ],
    closers: [
      "Explore the details.",
      "Reserved for those who care about the craft.",
      "See how it’s made.",
    ],
    styleNotes: ["restrained adjectives", "space and cadence", "exclusive CTA"],
  },
  {
    id: "playful",
    label: "Playful & witty",
    blurb: "Light, meme-adjacent energy with clever turns.",
    hooks: [
      "Plot twist: {topic} just got interesting.",
      "{topic}, but make it fun.",
      "We tried {topic}. Chaos ensued (in a good way).",
    ],
    closers: [
      "You’re welcome. Go be chaotic.",
      "Save this for later. Or for your group chat.",
      "Tell us your funniest {topic} fail ↓",
    ],
    styleNotes: ["humor", "surprises", "shareable lines"],
  },
  {
    id: "expert",
    label: "Expert & authoritative",
    blurb: "Proof-led, educational, credibility-forward.",
    hooks: [
      "Here’s what actually works for {topic}.",
      "3 signals we watch when evaluating {topic}.",
      "A clearer framework for {topic}:",
    ],
    closers: [
      "Save this for your next decision.",
      "Want the full breakdown? Link in comments.",
      "What metric do you trust most?",
    ],
    styleNotes: ["lists", "frameworks", "proof language"],
  },
  {
    id: "minimal",
    label: "Minimal & clear",
    blurb: "One idea, clean lines, no filler.",
    hooks: [
      "{topic}. Simplified.",
      "One thing about {topic}:",
      "Clear > clever.",
    ],
    closers: [
      "That’s it.",
      "Try it once.",
      "Keep what works. Drop the rest.",
    ],
    styleNotes: ["short lines", "white space", "single CTA"],
  },
  {
    id: "innovative",
    label: "Innovative & futurist",
    blurb: "Forward-looking product energy and launch heat.",
    hooks: [
      "The next chapter of {topic} starts here.",
      "We rebuilt {topic} from first principles.",
      "What if {topic} just worked?",
    ],
    closers: [
      "Join the waitlist.",
      "Ship feedback. Shape what comes next.",
      "Early access is open — claim yours.",
    ],
    styleNotes: ["future tense", "product drops", "build-in-public"],
  },
];

const PLATFORM_META: Record<
  ContentPlatform,
  { label: string; format: string; tip: string }
> = {
  instagram: {
    label: "Instagram",
    format: "Caption + carousel hook",
    tip: "Lead with a line that works as on-image text; keep the first 125 chars magnetic.",
  },
  linkedin: {
    label: "LinkedIn",
    format: "Thought-leadership post",
    tip: "Break lines aggressively; open with a claim, close with a question.",
  },
  tiktok: {
    label: "TikTok / Reels",
    format: "15–30s spoken script",
    tip: "Hook in 1 second; pattern interrupt mid-script; end on a loopable line.",
  },
  x: {
    label: "X / Twitter",
    format: "Thread (3 beats)",
    tip: "Tweet 1 = hook, Tweet 2 = proof, Tweet 3 = CTA. Stay under 240 chars each.",
  },
  youtube: {
    label: "YouTube Shorts",
    format: "Shorts script + title",
    tip: "Title = curiosity gap; script = demo or insight in under 45 seconds.",
  },
};

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length]!;
}

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function titleCaseTopic(topic: string): string {
  const t = topic.trim().replace(/\s+/g, " ");
  if (!t) return "your next launch";
  return t.length > 90 ? `${t.slice(0, 87)}…` : t;
}

/** Strip meta topic prompts down to a usable short brief. */
function cleanTopic(raw: string): string {
  const t = raw.trim().replace(/\s+/g, " ");
  if (!t) return "your next launch";
  if (t.length > 120 && /TARGET AUDIENCE|Adapt trend/i.test(t)) {
    const angle = t.match(
      /(?:Parody|Adapt|Deadpan|Worth|POV|Reveal|Timely|Native|Format)[^.]+/i,
    );
    if (angle) return titleCaseTopic(angle[0]!.slice(0, 100));
    return titleCaseTopic(t.slice(0, 90));
  }
  return titleCaseTopic(t);
}

function detectedVoiceFromReport(report: BrandReport): VoicePreset {
  const top = report.personality[0]?.label.toLowerCase() ?? "";
  const map: Record<string, VoicePresetId> = {
    bold: "bold",
    warm: "warm",
    premium: "premium",
    playful: "playful",
    trustworthy: "expert",
    innovative: "innovative",
    minimal: "minimal",
    expert: "expert",
  };
  const id = map[top] ?? "warm";
  const base = VOICE_PRESETS.find((v) => v.id === id)!;
  return {
    ...base,
    id: "detected",
    label: `Detected · ${base.label}`,
    blurb: report.voiceSummary,
    styleNotes: [
      ...base.styleNotes,
      `archetype: ${report.archetype}`,
      ...report.keywords.slice(0, 3),
    ],
  };
}

export function resolveVoice(
  voiceId: VoicePresetId,
  report: BrandReport,
): VoicePreset {
  if (voiceId === "detected") return detectedVoiceFromReport(report);
  return VOICE_PRESETS.find((v) => v.id === voiceId) ?? VOICE_PRESETS[1]!;
}

function brandAccent(report: BrandReport): string {
  return (
    report.palette.find((c) => c.role === "accent")?.hex ||
    report.palette[0]?.hex ||
    "#C8F542"
  );
}

function resolveListening(
  report: BrandReport,
  audience: string,
  brief: ContentBrief,
): ListeningBrief {
  if (brief.listening?.trendTitle) {
    return {
      trendTitle: brief.listening.trendTitle,
      angle: brief.listening.angle,
      hookIdeas: brief.listening.hookIdeas ?? [],
      voiceBlend: brief.listening.voiceBlend,
      fitReason: brief.listening.fitReason,
      source: brief.listening.source,
    };
  }
  return listeningSeedForAudience(report, audience);
}

function hashtagPack(
  report: BrandReport,
  topic: string,
  seed: number,
  audience: string,
): string[] {
  const brand = report.name.replace(/\s+/g, "");
  const script = scriptForAudience(report, audience);
  const topicTag = topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");

  const pool = [
    brand,
    topicTag || script.hashtags[0] || "BrandStory",
    report.keywords[0]
      ? report.keywords[0].replace(/[^a-z0-9]/gi, "")
      : script.hashtags[1],
    pick(script.hashtags, seed),
    pick(script.hashtags, seed + 3),
  ]
    .filter(Boolean)
    .map((t) => `#${String(t).charAt(0).toUpperCase()}${String(t).slice(1)}`);

  return [...new Set(pool)].slice(0, 5);
}

function engagementTips(
  platform: ContentPlatform,
  voice: VoicePreset,
  scriptTip: string,
  listening: ListeningBrief,
): string[] {
  const shared = [
    scriptTip,
    `Listening angle: ${listening.trendTitle} — ${listening.fitReason}`,
    `Lean into ${voice.styleNotes[0] ?? "clear voice"} — consistency builds recognition.`,
  ];
  const specific: Record<ContentPlatform, string[]> = {
    instagram: [
      "Put the strongest audience-specific line on slide 1.",
      "Use a save-worthy tip list tuned to this audience.",
    ],
    linkedin: [
      "Open with the audience’s pain, not the brand name.",
      "Native document/carousel often beats link posts.",
    ],
    tiktok: [
      "Say the audience out loud in the first 2 seconds.",
      "Duet/stitch bait: leave an opinion this audience will argue with.",
    ],
    x: [
      "Tweet 1 = audience pain, Tweet 2 = proof, Tweet 3 = CTA.",
      "End the thread with a poll this audience can answer fast.",
    ],
    youtube: [
      "Title must name who it’s for — not just the topic.",
      "Front-load the payoff this audience cares about.",
    ],
  };
  return [shared[0]!, ...specific[platform].slice(0, 1), shared[1]!];
}

function fillHook(template: string, topic: string, brand: string): string {
  return template.replaceAll("{topic}", topic).replaceAll("{brand}", brand);
}

function pickHook(
  voice: VoicePreset,
  script: ReturnType<typeof scriptForAudience>,
  listening: ListeningBrief,
  report: BrandReport,
  audience: string,
  topic: string,
  seed: number,
): string {
  const fromListening = listening.hookIdeas.filter(Boolean);
  if (fromListening.length) {
    return fillAudienceLine(pick(fromListening, seed), report, audience, topic);
  }
  const audienceHooks = script.hooks.map((h) =>
    fillAudienceLine(h, report, audience, topic),
  );
  if (voice.hooks.length > 0 && seed % 3 === 0) {
    return fillHook(pick(voice.hooks, seed), topic, report.name);
  }
  return pick(audienceHooks, seed);
}

function pickCta(
  voice: VoicePreset,
  script: ReturnType<typeof scriptForAudience>,
  report: BrandReport,
  audience: string,
  topic: string,
  seed: number,
): string {
  const audienceClosers = script.closers.map((c) =>
    fillAudienceLine(c, report, audience, topic),
  );
  if (voice.closers.length > 0 && seed % 2 === 0) {
    return fillHook(pick(voice.closers, seed), topic, report.name);
  }
  return pick(audienceClosers, seed);
}

function buildBodies(
  platform: ContentPlatform,
  voice: VoicePreset,
  report: BrandReport,
  topic: string,
  seed: number,
  targetAudience: string,
  listening: ListeningBrief,
): { body: string; cta: string; hook: string } {
  const brand = report.name;
  const trait = report.personality[0]?.label ?? "focused";
  const offer = classifyBrand(report).primaryOffer;
  const keyword = report.keywords[0] ?? offer;
  const accent = brandAccent(report);
  const services = servicesLine(report);
  const script = scriptForAudience(report, targetAudience);
  const vars = {
    brand,
    audience: targetAudience,
    topic,
    offer,
  };
  const beats = platformBeats(platform, script, vars);
  const hook = pickHook(
    voice,
    script,
    listening,
    report,
    targetAudience,
    topic,
    seed,
  );
  const cta = pickCta(voice, script, report, targetAudience, topic, seed + 5);
  const listenLine = listening.source
    ? `Social listening: “${listening.trendTitle}” (${listening.source})`
    : `Social listening playbook: “${listening.trendTitle}”`;

  if (platform === "linkedin") {
    const body = [
      hook,
      "",
      `For ${targetAudience} — not a generic feed post.`,
      `Pain we’re solving: ${script.pain}.`,
      "",
      `Angle (from listening): ${listening.angle}`,
      "",
      `How ${brand} shows up on ${topic}:`,
      ...beats.map((b) => `→ ${b}`),
      "",
      `Proof style: ${script.proof}.`,
      `Services in frame: ${services}.`,
      `${listenLine}.`,
      `Voice: ${trait.toLowerCase()} / ${voice.blurb}`,
      "",
      cta,
    ].join("\n");
    return { hook, body, cta };
  }

  if (platform === "instagram") {
    const body = [
      hook,
      "",
      `${script.formatName} for ${targetAudience}.`,
      `Topic: ${topic}`,
      "",
      `Carousel / Reel beats:`,
      ...beats.map((b, i) => `${i + 1}. ${b}`),
      "",
      `Listening angle: ${listening.angle}`,
      `On-image color cue: ${accent}`,
      `Caption energy: speak to ${script.speakAs}.`,
      `${listenLine}.`,
      "",
      cta,
    ].join("\n");
    return { hook, body, cta };
  }

  if (platform === "tiktok") {
    const body = [
      `[0–1s VISUAL] Text: “${hook}”`,
      `[1–8s] Talk to ${targetAudience}: “${topic}. Here’s the ${offer} take from ${brand}.”`,
      `[8–18s] ${beats[1] ?? script.proof}`,
      `[18–25s] ${beats[2] ?? `Show one concrete ${keyword} moment.`}`,
      `[25–30s] CTA: “${cta}”`,
      "",
      `Format: ${script.formatName}. Listening: ${listening.trendTitle}.`,
      `Voice blend: ${listening.voiceBlend}`,
      `On-screen text color cue: ${accent}`,
      `Do not just rename the audience — every line must sound like it’s for ${targetAudience}.`,
    ].join("\n");
    return { hook, body, cta };
  }

  if (platform === "x") {
    const t1 = hook.length > 220 ? `${hook.slice(0, 217)}…` : hook;
    const t2 =
      `${targetAudience}: ${script.pain}. ${brand} angle on ${topic} → ${listening.angle}`.slice(
        0,
        240,
      );
    const t3 = `${cta} · ${script.formatName}`.slice(0, 240);
    const body = [`1/ ${t1}`, "", `2/ ${t2}`, "", `3/ ${t3}`].join("\n");
    return { hook: t1, body, cta };
  }

  const body = [
    `Title: ${hook.replace(/:$/, "")} | for ${targetAudience} | ${brand}`,
    "",
    `Script (${script.formatName}):`,
    `HOOK: “${hook}”`,
    `SETUP: “If you’re ${targetAudience}, this is for you — ${topic}.”`,
    `VALUE: ${beats[1] ?? `Walk through one ${brand} move on ${offer}.`}`,
    `PROOF: ${script.proof}`,
    `LISTENING: ${listening.trendTitle} — ${listening.angle}`,
    `PAYOFF: “That’s how ${brand} talks to ${targetAudience} — not everyone.”`,
    `CTA: “${cta}”`,
  ].join("\n");
  return { hook, body, cta };
}

/** Generate 3 engagement-oriented variants for the brief. */
export function generateSocialContent(
  report: BrandReport,
  brief: ContentBrief,
): GeneratedPost[] {
  if (!brief.topic.trim()) {
    throw new Error("Describe the content you want to create.");
  }

  const topic = cleanTopic(brief.topic);
  const voice = resolveVoice(brief.voiceId, report);
  const platform = brief.platform;
  const audience = resolveTargetAudience(report, brief.targetAudience);
  const listening = resolveListening(report, audience, brief);
  const script = scriptForAudience(report, audience);
  const meta = PLATFORM_META[platform];
  const baseSeed = hashSeed(
    `${report.domain}|${voice.id}|${platform}|${topic}|${audience}|${listening.trendTitle}`,
  );

  return [0, 1, 2].map((variant) => {
    const seed = baseSeed + variant * 17;
    const { hook, body: baseBody, cta } = buildBodies(
      platform,
      voice,
      report,
      topic,
      seed + variant,
      audience,
      {
        ...listening,
        hookIdeas: [
          ...listening.hookIdeas.slice(variant),
          ...listening.hookIdeas.slice(0, variant),
          ...script.hooks.map((h) =>
            fillAudienceLine(h, report, audience, topic),
          ),
        ],
      },
    );
    const hashtags = hashtagPack(report, topic, seed + variant, audience);
    const tips = engagementTips(platform, voice, script.tip, listening);
    if (brief.referenceId) {
      tips.unshift(
        `Reference ${brief.referenceId}${brief.referenceUrl ? ` → ${brief.referenceUrl}` : ""} when briefing design or recycling creative.`,
      );
    }

    let body = baseBody;
    if (brief.referenceId) {
      const refBlock = [
        "",
        `Reference: ${brief.referenceId}`,
        brief.referenceCaption
          ? `Inspired by: “${brief.referenceCaption.slice(0, 140)}${brief.referenceCaption.length > 140 ? "…" : ""}”`
          : null,
        brief.referenceUrl ? `Link: ${brief.referenceUrl}` : null,
      ]
        .filter(Boolean)
        .join("\n");
      body = `${body}\n${refBlock}`;
    }

    const fullText =
      platform === "instagram" || platform === "linkedin"
        ? `${body}\n\n${hashtags.join(" ")}`
        : body;

    return {
      id: `${platform}-${variant}-${seed}`,
      platform,
      format: `${meta.format} · ${script.formatName} · v${variant + 1}`,
      hook,
      body,
      cta,
      hashtags,
      engagementTips: tips,
      fullText,
      referenceId: brief.referenceId,
      referenceUrl: brief.referenceUrl,
      referenceCaption: brief.referenceCaption,
      mascotId: brief.mascotId,
    };
  });
}

export function platformLabel(platform: ContentPlatform): string {
  return PLATFORM_META[platform].label;
}

export function platformTip(platform: ContentPlatform): string {
  return PLATFORM_META[platform].tip;
}

export const CONTENT_PROMPTS = [
  "Product launch teaser",
  "Behind the scenes",
  "Customer win story",
  "Myth-busting tip",
  "Founder POV hot take",
  "Feature explainer",
];
