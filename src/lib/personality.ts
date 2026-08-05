import type { PersonalityTrait, VoiceDimension } from "../types";

interface Lexicon {
  trait: string;
  words: string[];
  description: string;
}

const PERSONALITY_LEXICON: Lexicon[] = [
  {
    trait: "Bold",
    words: [
      "bold",
      "disrupt",
      "power",
      "unapologetic",
      "fierce",
      "revolutionary",
      "limitless",
      "fearless",
      "dominate",
      "breakthrough",
    ],
    description: "Confident, assertive, and unafraid to stand out.",
  },
  {
    trait: "Warm",
    words: [
      "care",
      "together",
      "community",
      "welcome",
      "love",
      "kind",
      "home",
      "family",
      "support",
      "heart",
      "friendly",
    ],
    description: "Human, inviting, and relationship-first.",
  },
  {
    trait: "Playful",
    words: [
      "fun",
      "play",
      "joy",
      "delight",
      "curious",
      "surprise",
      "magic",
      "spark",
      "wow",
      "adventure",
      "laugh",
    ],
    description: "Light, energetic, and entertainment-forward.",
  },
  {
    trait: "Premium",
    words: [
      "luxury",
      "crafted",
      "exclusive",
      "refined",
      "bespoke",
      "elegant",
      "precision",
      "heritage",
      "curated",
      "exceptional",
      "atelier",
    ],
    description: "Elevated, selective, and detail-obsessed.",
  },
  {
    trait: "Trustworthy",
    words: [
      "trusted",
      "secure",
      "reliable",
      "proven",
      "transparent",
      "safe",
      "guarantee",
      "certified",
      "honest",
      "protect",
      "privacy",
    ],
    description: "Credible, steady, and risk-reducing.",
  },
  {
    trait: "Innovative",
    words: [
      "innovate",
      "future",
      "ai",
      "smart",
      "next",
      "technology",
      "reimagine",
      "pioneer",
      "digital",
      "platform",
      "intelligent",
    ],
    description: "Forward-looking and product-led.",
  },
  {
    trait: "Minimal",
    words: [
      "simple",
      "clean",
      "essential",
      "focus",
      "clarity",
      "less",
      "effortless",
      "streamlined",
      "pure",
      "quiet",
    ],
    description: "Reduced, clear, and design-conscious.",
  },
  {
    trait: "Expert",
    words: [
      "research",
      "science",
      "insights",
      "data",
      "analysis",
      "strategy",
      "guide",
      "learn",
      "knowledge",
      "professional",
      "industry",
    ],
    description: "Authoritative and educational.",
  },
];

const ARCHETYPES: { name: string; traits: string[] }[] = [
  { name: "The Rebel", traits: ["Bold", "Playful"] },
  { name: "The Sage", traits: ["Expert", "Trustworthy"] },
  { name: "The Creator", traits: ["Innovative", "Playful"] },
  { name: "The Caregiver", traits: ["Warm", "Trustworthy"] },
  { name: "The Ruler", traits: ["Premium", "Bold"] },
  { name: "The Magician", traits: ["Innovative", "Premium"] },
  { name: "The Everyperson", traits: ["Warm", "Minimal"] },
  { name: "The Explorer", traits: ["Bold", "Innovative"] },
  { name: "The Innocent", traits: ["Warm", "Playful"] },
  { name: "The Minimalist", traits: ["Minimal", "Premium"] },
];

function scoreText(text: string): Map<string, number> {
  const lower = text.toLowerCase();
  const scores = new Map<string, number>();
  for (const entry of PERSONALITY_LEXICON) {
    let score = 0;
    for (const word of entry.words) {
      const re = new RegExp(`\\b${word}\\w*\\b`, "gi");
      const matches = lower.match(re);
      if (matches) score += matches.length;
    }
    scores.set(entry.trait, score);
  }
  return scores;
}

export function analyzePersonality(corpus: string): {
  traits: PersonalityTrait[];
  archetype: string;
} {
  const raw = scoreText(corpus);
  const maxRaw = Math.max(0, ...raw.values());
  const sparse = maxRaw === 0;

  const traits: PersonalityTrait[] = PERSONALITY_LEXICON.map((entry) => {
    const hits = raw.get(entry.trait) ?? 0;
    if (sparse) {
      return {
        label: entry.trait,
        score: entry.trait === "Minimal" || entry.trait === "Trustworthy" ? 42 : 18,
        description: entry.description,
      };
    }
    const score = Math.round((hits / maxRaw) * 100);
    return {
      label: entry.trait,
      score: Math.max(12, score),
      description: entry.description,
    };
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const top = sparse
    ? traits
    : traits.map((t, i) => ({
        ...t,
        score: Math.min(100, Math.round(t.score * (1 - i * 0.05) + (5 - i) * 4)),
      }));

  if (sparse) {
    return { traits: top, archetype: "The Everyperson" };
  }

  let bestArchetype = ARCHETYPES[0].name;
  let bestScore = -1;
  for (const arch of ARCHETYPES) {
    const s = arch.traits.reduce((sum, trait) => {
      const found = top.find((t) => t.label === trait);
      return sum + (found?.score ?? 0);
    }, 0);
    if (s > bestScore) {
      bestScore = s;
      bestArchetype = arch.name;
    }
  }

  return { traits: top, archetype: bestArchetype };
}

export function analyzeVoice(corpus: string): {
  dimensions: VoiceDimension[];
  summary: string;
  keywords: string[];
} {
  const lower = corpus.toLowerCase();

  const count = (words: string[]) =>
    words.reduce((n, w) => {
      const m = lower.match(new RegExp(`\\b${w}\\w*\\b`, "gi"));
      return n + (m?.length ?? 0);
    }, 0);

  const formal = count([
    "pursuant",
    "solutions",
    "enterprise",
    "leverage",
    "optimize",
    "stakeholders",
    "professional",
    "regarding",
  ]);
  const casual = count([
    "hey",
    "you",
    "we're",
    "you'll",
    "gonna",
    "awesome",
    "cool",
    "vibe",
    "let's",
  ]);
  const serious = count([
    "risk",
    "compliance",
    "critical",
    "important",
    "secure",
    "mission",
  ]);
  const playful = count([
    "fun",
    "play",
    "joy",
    "magic",
    "delight",
    "wow",
    "love",
  ]);
  const technical = count([
    "api",
    "data",
    "platform",
    "infrastructure",
    "algorithm",
    "sdk",
    "cloud",
  ]);
  const emotional = count([
    "feel",
    "dream",
    "heart",
    "inspire",
    "belong",
    "passion",
    "story",
  ]);
  const concise = count(["simple", "fast", "easy", "now", "instant", "quick"]);
  const elaborate =
    count(["comprehensive", "detailed", "complete", "extensive", "deep"]) +
    Math.round(corpus.split(/\s+/).length / 400);

  const dim = (
    axis: string,
    left: string,
    right: string,
    leftScore: number,
    rightScore: number,
  ): VoiceDimension => {
    const total = leftScore + rightScore || 1;
    const value = Math.round((rightScore / total) * 100);
    return { axis, left, right, value: Math.max(15, Math.min(85, value)) };
  };

  const dimensions: VoiceDimension[] = [
    dim("Register", "Casual", "Formal", casual + 2, formal + 1),
    dim("Mood", "Playful", "Serious", playful + 2, serious + 1),
    dim("Focus", "Emotional", "Technical", emotional + 1, technical + 1),
    dim("Pace", "Concise", "Elaborate", concise + 2, elaborate + 1),
  ];

  const formalLean = dimensions[0].value > 55;
  const seriousLean = dimensions[1].value > 55;
  const technicalLean = dimensions[2].value > 55;
  const elaborateLean = dimensions[3].value > 55;

  const parts = [
    formalLean ? "polished and professional" : "approachable and conversational",
    seriousLean ? "grounded in credibility" : "energized and expressive",
    technicalLean ? "product- and proof-led" : "story- and emotion-led",
    elaborateLean ? "comfortable with depth" : "favoring sharp, short punches",
  ];

  const summary = `The brand voice feels ${parts[0]}, ${parts[1]}, ${parts[2]}, and ${parts[3]}.`;

  const keywords = extractKeywords(corpus);

  return { dimensions, summary, keywords };
}

function extractKeywords(corpus: string): string[] {
  const stop = new Set([
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "from",
    "your",
    "you",
    "our",
    "are",
    "was",
    "were",
    "have",
    "has",
    "will",
    "can",
    "all",
    "not",
    "but",
    "they",
    "their",
    "about",
    "into",
    "more",
    "than",
    "when",
    "what",
    "which",
    "who",
    "how",
    "why",
    "its",
    "it's",
    "a",
    "an",
    "of",
    "to",
    "in",
    "on",
    "as",
    "by",
    "or",
    "is",
    "be",
    "we",
    "at",
    "if",
    "so",
    "do",
    "get",
    "new",
    "use",
    "using",
    "used",
    "also",
    "just",
    "like",
    "out",
    "up",
    "one",
    "two",
    "free",
    "home",
    "page",
    "site",
    "click",
    "here",
    "learn",
    "type",
    "name",
    "item",
    "true",
    "false",
    "null",
    "http",
    "https",
    "www",
    "com",
    "org",
    "html",
    "span",
    "div",
    "class",
    "schema",
    "postaladdress",
    "streetaddress",
    "addresslocality",
    "addressregion",
    "addresscountry",
    "postalcode",
    "place",
    "address",
  ]);

  const freq = new Map<string, number>();
  for (const raw of corpus.toLowerCase().match(/[a-z][a-z0-9-]{2,}/g) ?? []) {
    if (stop.has(raw)) continue;
    if (raw.includes("address") || raw.endsWith("type")) continue;
    freq.set(raw, (freq.get(raw) ?? 0) + 1);
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([w]) => w);
}
