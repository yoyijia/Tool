import type {
  BrandReport,
  ContentBrief,
  ContentPlatform,
  GeneratedPost,
  VoicePreset,
  VoicePresetId,
} from "../types";
import { audienceLine } from "./audience";

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
  return t.length > 80 ? `${t.slice(0, 77)}…` : t;
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

function hashtagPack(report: BrandReport, topic: string, seed: number): string[] {
  const brand = report.name.replace(/\s+/g, "");
  const topicTag = topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");

  const audienceTag = /health|medical/i.test(audienceLine(report))
    ? "HealthcareMarketing"
    : /market/i.test(audienceLine(report))
      ? "MarketingStrategy"
      : "BrandStory";

  const pool = [
    brand,
    topicTag || audienceTag,
    report.keywords[0] ? report.keywords[0].replace(/[^a-z0-9]/gi, "") : "Marketing",
    pick(["SocialStrategy", "ContentThatConverts", "BrandVoice", "Engagement"], seed),
    pick(
      /health|medical/i.test(audienceLine(report))
        ? ["MedicalMarketing", "ClinicGrowth", "PatientTrust", "HealthcareSEO"]
        : ["BuildInPublic", "CreatorEconomy", "GrowthTips", "Storytelling"],
      seed + 3,
    ),
  ]
    .filter(Boolean)
    .map((t) => `#${t.charAt(0).toUpperCase()}${t.slice(1)}`);

  return [...new Set(pool)].slice(0, 5);
}

function engagementTips(
  platform: ContentPlatform,
  voice: VoicePreset,
): string[] {
  const shared = [
    "Ask a binary or ranking question to spark replies.",
    "Pin a comment with the CTA + link.",
    `Lean into ${voice.styleNotes[0] ?? "clear voice"} — consistency builds recognition.`,
  ];
  const specific: Record<ContentPlatform, string[]> = {
    instagram: [
      "Put the strongest line on slide 1 of a carousel.",
      "Use a save-worthy tip list to boost saves.",
    ],
    linkedin: [
      "Post midweek mornings; reply to every comment in the first hour.",
      "Native document/carousel often beats link posts.",
    ],
    tiktok: [
      "Start mid-action; add on-screen text for silent viewers.",
      "Duet/stitch bait: leave a clear opinion to react to.",
    ],
    x: [
      "Quote-tweet yourself later with a new angle.",
      "End the thread with a poll for easy engagement.",
    ],
    youtube: [
      "Front-load the payoff; pattern interrupt at 0:08.",
      "End screen / pinned comment with the next Short.",
    ],
  };
  return [...specific[platform].slice(0, 2), shared[0]!];
}

function articleFor(word: string): string {
  return /^[aeiou]/i.test(word.trim()) ? "an" : "a";
}

function fillHook(template: string, topic: string, brand: string): string {
  return template
    .replaceAll("{topic}", topic)
    .replaceAll("{brand}", brand);
}

function buildBodies(
  platform: ContentPlatform,
  voice: VoicePreset,
  report: BrandReport,
  topic: string,
  _seed: number,
): { body: string; cta: string; hook: string } {
  const brand = report.name;
  const trait = report.personality[0]?.label ?? "focused";
  const trend = report.trends[0]?.title ?? "owned-channel storytelling";
  const keyword = report.keywords[0] ?? "brand";
  const accent = brandAccent(report);
  const audiences = audienceLine(report);

  const hooks =
    voice.hooks.length > 0
      ? voice.hooks
      : [
          `${brand} on ${topic}:`,
          `A ${trait.toLowerCase()} take on ${topic}.`,
          `What ${brand} believes about ${topic}:`,
        ];
  const closers =
    voice.closers.length > 0
      ? voice.closers
      : [
          "What’s your take?",
          "Follow for more.",
          "Link in bio — start today.",
        ];

  const hook = fillHook(hooks[0] ?? `${brand} on ${topic}:`, topic, brand);
  const cta = fillHook(closers[0] ?? "What’s your take?", topic, brand);

  if (platform === "linkedin") {
    const body = [
      hook,
      "",
      `At ${brand}, we keep coming back to one idea: ${topic}.`,
      "",
      `Written for ${audiences}.`,
      `Here’s the angle that travels:`,
      `→ Lead with ${articleFor(trait)} ${trait.toLowerCase()} promise people can feel in 3 seconds.`,
      `→ Proof it with a real moment (demo, client line, or behind-the-scenes).`,
      `→ Close on a question — not a brochure.`,
      "",
      `We’re seeing ${trend.toLowerCase()} win attention right now. ${topic} is a natural fit.`,
      "",
      cta,
    ].join("\n");
    return { hook, body, cta };
  }

  if (platform === "instagram") {
    const body = [
      hook,
      "",
      `${topic} — told the ${brand} way for ${audiences}.`,
      "",
      `Slide / Reel beat ideas:`,
      `1. Hook line on-brand (${accent})`,
      `2. The tension / myth your audience believes`,
      `3. How ${brand} approaches it`,
      `4. One actionable tip`,
      `5. CTA card (save / DM / book)`,
      "",
      `Caption energy: ${voice.blurb}`,
      "",
      cta,
    ].join("\n");
    return { hook, body, cta };
  }

  if (platform === "tiktok") {
    const body = [
      `[0–1s VISUAL] Text on screen: “${hook}”`,
      `[1–8s] Talk to camera: “Okay — ${topic}. Here’s what ${brand} actually does differently for ${audiences}.”`,
      `[8–18s] Demo or B-roll: show one concrete moment tied to ${keyword}.`,
      `[18–25s] Punchline: “That’s the whole play. ${trait}, not complicated.”`,
      `[25–30s] CTA to camera: “${cta}”`,
      "",
      `On-screen text color cue: ${accent}`,
      `Mascot tip: place it opposite the talking head so Reels stay readable.`,
    ].join("\n");
    return { hook, body, cta };
  }

  if (platform === "x") {
    const t1 = hook.length > 220 ? `${hook.slice(0, 217)}…` : hook;
    const t2 = `${brand} take: ${topic} works when you sound ${trait.toLowerCase()} and show proof — not when you sound like every other feed. Signal we’re watching: ${trend.toLowerCase()}.`;
    const t3 = `${cta} / ${brand}`;
    const body = [
      `1/ ${t1}`,
      "",
      `2/ ${t2.slice(0, 240)}`,
      "",
      `3/ ${t3.slice(0, 240)}`,
    ].join("\n");
    return { hook: t1, body, cta };
  }

  // youtube
  const body = [
    `Title: ${hook.replace(/:$/, "")} | ${brand}`,
    "",
    `Script:`,
    `HOOK: “${hook}”`,
    `SETUP: “If you care about ${topic}, watch this.”`,
    `VALUE: Walk through one ${brand} move — tied to ${keyword} — in under 20 seconds.`,
    `PAYOFF: “That’s how ${trait.toLowerCase()} brands earn the scroll.”`,
    `CTA: “${cta} Subscribe for the next drop.”`,
  ].join("\n");
  return { hook, body, cta };
}

/** Generate 3 engagement-oriented variants for the brief. */
export function generateSocialContent(
  report: BrandReport,
  brief: ContentBrief,
): GeneratedPost[] {
  const topic = titleCaseTopic(brief.topic);
  if (!brief.topic.trim()) {
    throw new Error("Describe the content you want to create.");
  }

  const voice = resolveVoice(brief.voiceId, report);
  const platform = brief.platform;
  const meta = PLATFORM_META[platform];
  const baseSeed = hashSeed(`${report.domain}|${voice.id}|${platform}|${topic}`);

  return [0, 1, 2].map((variant) => {
    const seed = baseSeed + variant * 17;
    const hookPool =
      voice.hooks.length > 0
        ? voice.hooks
        : [
            `${report.name} on {topic}:`,
            `A fresh take on {topic}.`,
            `What ${report.name} believes about {topic}:`,
          ];
    const closerPool =
      voice.closers.length > 0
        ? voice.closers
        : ["What’s your take?", "Follow for more.", "Start today."];

    const variantVoice = {
      ...voice,
      hooks: [hookPool[variant % hookPool.length]!, ...hookPool],
      closers: [closerPool[variant % closerPool.length]!, ...closerPool],
    };

    const { hook, body: baseBody, cta } = buildBodies(
      platform,
      variantVoice,
      report,
      topic,
      seed,
    );
    const hashtags = hashtagPack(report, topic, seed + variant);
    const tips = [...engagementTips(platform, voice)];
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
      format: `${meta.format} · variant ${variant + 1}`,
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
