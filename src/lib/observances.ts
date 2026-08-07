import type { BrandReport } from "../types";

export type ObservanceKind =
  | "national"
  | "international"
  | "awareness"
  | "cultural"
  | "commerce";

export type FitLevel = "high" | "medium" | "low";

export interface Observance {
  id: string;
  title: string;
  month: number; // 1-12
  day: number;
  kind: ObservanceKind;
  summary: string;
  /** Themes used to score brand relevance */
  themes: string[];
}

export interface ObservanceIdea {
  observance: Observance;
  dateLabel: string;
  fit: FitLevel;
  fitScore: number;
  fitReason: string;
  angle: string;
  hooks: string[];
  platforms: string[];
  topicPrompt: string;
}

const OBSERVANCES: Observance[] = [
  // January
  { id: "nye", title: "New Year’s Day", month: 1, day: 1, kind: "international", summary: "Resolutions, resets, and year-ahead energy.", themes: ["reset", "goals", "fresh start", "planning", "motivation"] },
  { id: "world-braille", title: "World Braille Day", month: 1, day: 4, kind: "international", summary: "Accessibility and inclusive design.", themes: ["accessibility", "inclusion", "design", "community"] },
  { id: "national-trivia", title: "National Trivia Day", month: 1, day: 4, kind: "national", summary: "Quiz formats and fun facts perform well.", themes: ["trivia", "fun", "education", "engagement", "humor"] },
  { id: "national-hobby", title: "National Hobby Month kickoff", month: 1, day: 7, kind: "national", summary: "Celebrate side projects and craft.", themes: ["hobbies", "creativity", "makers", "learning"] },
  { id: "mlk", title: "Martin Luther King Jr. Day", month: 1, day: 20, kind: "cultural", summary: "Purpose, community, and values storytelling — handle with care.", themes: ["purpose", "community", "justice", "values", "leadership"] },
  { id: "national-hug", title: "National Hugging Day", month: 1, day: 21, kind: "national", summary: "Warmth, connection, and soft brand moments.", themes: ["care", "community", "wellness", "kindness"] },
  { id: "data-privacy", title: "Data Privacy Day", month: 1, day: 28, kind: "international", summary: "Trust, security, and responsible data use.", themes: ["privacy", "security", "trust", "tech", "compliance", "saas"] },

  // February
  { id: "world-cancer", title: "World Cancer Day", month: 2, day: 4, kind: "awareness", summary: "Supportive awareness — only if authentic to the brand.", themes: ["health", "care", "community", "wellness"] },
  { id: "safer-internet", title: "Safer Internet Day", month: 2, day: 10, kind: "international", summary: "Online safety tips and trust messaging.", themes: ["security", "tech", "education", "trust", "privacy"] },
  { id: "valentine", title: "Valentine’s Day", month: 2, day: 14, kind: "cultural", summary: "Love, gifts, duo content, soft CTAs.", themes: ["love", "gifts", "romance", "retail", "food", "celebration"] },
  { id: "random-acts", title: "Random Acts of Kindness Day", month: 2, day: 17, kind: "national", summary: "Giveaways, shoutouts, and kindness campaigns.", themes: ["kindness", "community", "giving", "care"] },
  { id: "national-toast", title: "National Toast Day", month: 2, day: 19, kind: "national", summary: "Foodie formats and comfort-brand energy.", themes: ["food", "breakfast", "humor", "comfort"] },
  { id: "pink-shirt", title: "Pink Shirt Day", month: 2, day: 25, kind: "awareness", summary: "Anti-bullying and workplace culture.", themes: ["inclusion", "workplace", "community", "culture"] },

  // March
  { id: "zero-discrimination", title: "Zero Discrimination Day", month: 3, day: 1, kind: "international", summary: "Equity and belonging stories.", themes: ["inclusion", "equity", "community", "values"] },
  { id: "world-wildlife", title: "World Wildlife Day", month: 3, day: 3, kind: "international", summary: "Nature, stewardship, outdoor brands.", themes: ["nature", "environment", "animals", "sustainability"] },
  { id: "womens-day", title: "International Women’s Day", month: 3, day: 8, kind: "international", summary: "Founder POV and representation — keep it substantive.", themes: ["leadership", "women", "equity", "workplace", "community"] },
  { id: "pi-day", title: "Pi Day", month: 3, day: 14, kind: "national", summary: "Math jokes, pie puns, STEM nods.", themes: ["math", "stem", "humor", "education", "tech", "food"] },
  { id: "consumer-rights", title: "World Consumer Rights Day", month: 3, day: 15, kind: "international", summary: "Transparency, fairness, customer trust.", themes: ["trust", "customers", "retail", "transparency", "saas"] },
  { id: "stpatrick", title: "St. Patrick’s Day", month: 3, day: 17, kind: "cultural", summary: "Festive green, community meetups.", themes: ["celebration", "festive", "food", "community", "humor"] },
  { id: "world-poetry", title: "World Poetry Day", month: 3, day: 21, kind: "international", summary: "Lyric captions and creative writing.", themes: ["creativity", "writing", "art", "culture"] },
  { id: "world-water", title: "World Water Day", month: 3, day: 22, kind: "international", summary: "Sustainability and resource stewardship.", themes: ["environment", "sustainability", "water", "climate"] },
  { id: "national-pencil", title: "National Pencil Day", month: 3, day: 30, kind: "national", summary: "Sketch-to-ship and creative process content.", themes: ["creativity", "design", "makers", "education", "stationery"] },

  // April
  { id: "april-fools", title: "April Fools’ Day", month: 4, day: 1, kind: "cultural", summary: "Playful pranks — stay brand-safe.", themes: ["humor", "fun", "playful", "creative", "jokes"] },
  { id: "world-health", title: "World Health Day", month: 4, day: 7, kind: "international", summary: "Wellbeing tips and health-adjacent proof.", themes: ["health", "wellness", "care", "fitness"] },
  { id: "national-siblings", title: "National Siblings Day", month: 4, day: 10, kind: "national", summary: "Duo stories and “partners in crime” angles.", themes: ["family", "community", "fun", "relationships"] },
  { id: "earth-day", title: "Earth Day", month: 4, day: 22, kind: "international", summary: "Sustainability proof and behind-the-scenes green work.", themes: ["environment", "sustainability", "climate", "nature", "green"] },
  { id: "world-book", title: "World Book Day", month: 4, day: 23, kind: "international", summary: "Reading lists and knowledge-sharing.", themes: ["books", "education", "learning", "writing", "culture"] },
  { id: "national-pretzels", title: "National Pretzel Day", month: 4, day: 26, kind: "national", summary: "Snackable content and twisty metaphors.", themes: ["food", "snacks", "humor", "retail"] },
  { id: "international-dance", title: "International Dance Day", month: 4, day: 29, kind: "international", summary: "Movement, Reels, and rhythm formats.", themes: ["dance", "music", "creativity", "fun", "fitness"] },

  // May
  { id: "may-day", title: "International Workers’ Day", month: 5, day: 1, kind: "international", summary: "Team appreciation and workplace culture.", themes: ["work", "team", "workplace", "labor", "culture"] },
  { id: "star-wars", title: "Star Wars Day", month: 5, day: 4, kind: "cultural", summary: "May the 4th puns and fandom energy.", themes: ["pop culture", "movies", "humor", "fandom", "tech"] },
  { id: "world-password", title: "World Password Day", month: 5, day: 7, kind: "international", summary: "Security hygiene tips for product brands.", themes: ["security", "tech", "saas", "privacy", "trust"] },
  { id: "mothers", title: "Mother’s Day", month: 5, day: 11, kind: "cultural", summary: "Gift guides, gratitude, family UGC.", themes: ["family", "gifts", "care", "retail", "celebration"] },
  { id: "international-nurses", title: "International Nurses Day", month: 5, day: 12, kind: "international", summary: "Care worker appreciation.", themes: ["health", "care", "community", "wellness"] },
  { id: "international-day-of-families", title: "International Day of Families", month: 5, day: 15, kind: "international", summary: "Family-friendly product moments.", themes: ["family", "community", "home", "care"] },
  { id: "world-bee", title: "World Bee Day", month: 5, day: 20, kind: "international", summary: "Pollinators, nature, and small-but-mighty metaphors.", themes: ["nature", "environment", "sustainability", "food"] },
  { id: "national-wine", title: "National Wine Day", month: 5, day: 25, kind: "national", summary: "Sip-worthy lifestyle content.", themes: ["food", "drink", "lifestyle", "celebration"] },
  { id: "hamburger-day", title: "National Hamburger Day", month: 5, day: 28, kind: "national", summary: "Classic foodie flex.", themes: ["food", "restaurants", "humor", "retail"] },

  // June
  { id: "global-day-of-parents", title: "Global Day of Parents", month: 6, day: 1, kind: "international", summary: "Parent appreciation and family products.", themes: ["family", "parents", "care", "community"] },
  { id: "world-environment", title: "World Environment Day", month: 6, day: 5, kind: "international", summary: "Climate action and green product proof.", themes: ["environment", "sustainability", "climate", "green"] },
  { id: "national-best-friends", title: "National Best Friends Day", month: 6, day: 8, kind: "national", summary: "Duo UGC and referral angles.", themes: ["friendship", "community", "fun", "relationships"] },
  { id: "world-oceans", title: "World Oceans Day", month: 6, day: 8, kind: "international", summary: "Blue planet stewardship.", themes: ["environment", "ocean", "sustainability", "nature"] },
  { id: "fathers", title: "Father’s Day", month: 6, day: 15, kind: "cultural", summary: "Gift + mentor story content.", themes: ["family", "gifts", "mentors", "celebration", "retail"] },
  { id: "juneteenth", title: "Juneteenth", month: 6, day: 19, kind: "cultural", summary: "Education and community support — only with real substance.", themes: ["history", "community", "justice", "culture", "equity"] },
  { id: "world-refugee", title: "World Refugee Day", month: 6, day: 20, kind: "international", summary: "Human stories and solidarity.", themes: ["community", "human rights", "care", "inclusion"] },
  { id: "national-selfie", title: "National Selfie Day", month: 6, day: 21, kind: "national", summary: "UGC prompts and face-to-camera hooks.", themes: ["social", "ugc", "fun", "creativity", "selfie"] },
  { id: "social-media-day", title: "National Social Media Day", month: 6, day: 30, kind: "national", summary: "Meta content about creating content.", themes: ["social", "marketing", "creators", "digital", "saas"] },

  // July
  { id: "canada-day", title: "Canada Day", month: 7, day: 1, kind: "cultural", summary: "North-star celebrations for Canadian audiences.", themes: ["canada", "celebration", "community", "national"] },
  { id: "international-joke", title: "International Joke Day", month: 7, day: 1, kind: "international", summary: "Puns, skits, and light brand humor.", themes: ["humor", "jokes", "fun", "playful", "comedy", "creative"] },
  { id: "july4", title: "Independence Day (US)", month: 7, day: 4, kind: "cultural", summary: "BBQ, travel, long-weekend campaigns.", themes: ["celebration", "usa", "summer", "food", "travel", "retail"] },
  { id: "world-chocolate", title: "World Chocolate Day", month: 7, day: 7, kind: "international", summary: "Indulgence and sweet metaphors.", themes: ["food", "chocolate", "gifts", "retail", "fun"] },
  { id: "world-population", title: "World Population Day", month: 7, day: 11, kind: "international", summary: "Scale, systems, and human impact.", themes: ["global", "data", "community", "research"] },
  { id: "national-ice-cream", title: "National Ice Cream Day", month: 7, day: 19, kind: "national", summary: "Summer treat content.", themes: ["food", "summer", "fun", "retail"] },
  { id: "national-hot-dog", title: "National Hot Dog Day", month: 7, day: 23, kind: "national", summary: "Casual summer snack moments.", themes: ["food", "summer", "humor", "bbq"] },
  { id: "system-admin", title: "System Administrator Appreciation Day", month: 7, day: 25, kind: "national", summary: "IT heroes and ops culture.", themes: ["tech", "it", "saas", "workplace", "developers"] },

  // August
  { id: "international-beer", title: "International Beer Day", month: 8, day: 1, kind: "international", summary: "Cheers content for F&B brands.", themes: ["drink", "food", "celebration", "social"] },
  { id: "international-cat", title: "International Cat Day", month: 8, day: 8, kind: "international", summary: "Pet content that earns saves.", themes: ["pets", "cats", "animals", "fun", "cute"] },
  { id: "international-youth", title: "International Youth Day", month: 8, day: 12, kind: "international", summary: "Next-gen talent and student creatives.", themes: ["youth", "education", "students", "career", "creativity"] },
  { id: "national-tell-a-joke", title: "National Tell a Joke Day", month: 8, day: 16, kind: "national", summary: "One-liners, meme formats, playful brand voice.", themes: ["humor", "jokes", "fun", "playful", "comedy", "creative"] },
  { id: "world-humanitarian", title: "World Humanitarian Day", month: 8, day: 19, kind: "international", summary: "Impact and giving stories.", themes: ["care", "community", "giving", "nonprofit"] },
  { id: "international-dog", title: "International Dog Day", month: 8, day: 26, kind: "international", summary: "Pet-parent UGC gold.", themes: ["pets", "dogs", "animals", "fun", "cute"] },
  { id: "national-beach", title: "National Beach Day", month: 8, day: 30, kind: "national", summary: "Summer wrap and travel vibes.", themes: ["summer", "travel", "outdoors", "lifestyle"] },

  // September
  { id: "labor-day-us", title: "Labor Day (US)", month: 9, day: 1, kind: "cultural", summary: "End-of-summer sales and worker appreciation.", themes: ["work", "team", "sales", "summer", "retail"] },
  { id: "international-literacy", title: "International Literacy Day", month: 9, day: 8, kind: "international", summary: "Learning resources and reading lists.", themes: ["education", "learning", "books", "writing"] },
  { id: "national-video-games", title: "National Video Games Day", month: 9, day: 12, kind: "national", summary: "Gaming culture and interactive formats.", themes: ["gaming", "tech", "fun", "entertainment", "esports"] },
  { id: "international-democracy", title: "International Day of Democracy", month: 9, day: 15, kind: "international", summary: "Civic voice and participation.", themes: ["civic", "community", "values", "leadership"] },
  { id: "international-peace", title: "International Day of Peace", month: 9, day: 21, kind: "international", summary: "Calm, unity, and reflective posts.", themes: ["peace", "community", "values", "wellness"] },
  { id: "national-coffee", title: "National Coffee Day", month: 9, day: 29, kind: "national", summary: "Morning routines and café culture.", themes: ["coffee", "food", "drink", "morning", "retail", "workplace"] },
  { id: "international-podcast", title: "International Podcast Day", month: 9, day: 30, kind: "international", summary: "Audio series and thought-leadership clips.", themes: ["podcast", "audio", "marketing", "education", "creators"] },

  // October
  { id: "international-coffee", title: "International Coffee Day", month: 10, day: 1, kind: "international", summary: "Global coffee culture moments.", themes: ["coffee", "food", "drink", "retail", "morning"] },
  { id: "world-teachers", title: "World Teachers’ Day", month: 10, day: 5, kind: "international", summary: "Educator appreciation and learning tools.", themes: ["education", "teachers", "learning", "workplace"] },
  { id: "world-mental-health", title: "World Mental Health Day", month: 10, day: 10, kind: "awareness", summary: "Wellbeing — sincere, not opportunistic.", themes: ["mental health", "wellness", "care", "workplace", "health"] },
  { id: "world-sight", title: "World Sight Day", month: 10, day: 9, kind: "awareness", summary: "Vision, design clarity, accessibility.", themes: ["health", "accessibility", "design", "care"] },
  { id: "national-dessert", title: "National Dessert Day", month: 10, day: 14, kind: "national", summary: "Sweet treats and “reward yourself” CTAs.", themes: ["food", "dessert", "fun", "retail"] },
  { id: "international-chef", title: "International Chefs Day", month: 10, day: 20, kind: "international", summary: "Kitchen craft and recipe Reels.", themes: ["food", "chefs", "cooking", "creativity"] },
  { id: "diwali-window", title: "Diwali season (approx.)", month: 10, day: 20, kind: "cultural", summary: "Light, celebration, gift culture — localize carefully.", themes: ["celebration", "gifts", "culture", "light", "family"] },
  { id: "international-internet", title: "International Internet Day", month: 10, day: 29, kind: "international", summary: "Connectivity and digital product stories.", themes: ["tech", "internet", "digital", "saas", "innovation"] },
  { id: "halloween", title: "Halloween", month: 10, day: 31, kind: "cultural", summary: "Costumes, spooky POV, limited drops.", themes: ["halloween", "fun", "costumes", "retail", "humor", "celebration"] },

  // November
  { id: "world-vegan", title: "World Vegan Day", month: 11, day: 1, kind: "international", summary: "Plant-based product and lifestyle angles.", themes: ["food", "vegan", "sustainability", "health"] },
  { id: "world-kindness", title: "World Kindness Day", month: 11, day: 13, kind: "international", summary: "Customer love and community shoutouts.", themes: ["kindness", "community", "care", "giving"] },
  { id: "international-students", title: "International Students Day", month: 11, day: 17, kind: "international", summary: "Campus and early-career content.", themes: ["students", "education", "youth", "career"] },
  { id: "world-toilet", title: "World Toilet Day", month: 11, day: 19, kind: "international", summary: "Sanitation / public-health brands only — otherwise skip.", themes: ["health", "sanitation", "infrastructure", "environment"] },
  { id: "thanksgiving-us", title: "Thanksgiving (US)", month: 11, day: 27, kind: "cultural", summary: "Gratitude, gatherings, recipes.", themes: ["gratitude", "family", "food", "celebration", "retail"] },
  { id: "cyber-monday", title: "Cyber Monday", month: 11, day: 30, kind: "commerce", summary: "Deals, urgency, and offer explainers.", themes: ["sales", "ecommerce", "retail", "deals", "shopping", "saas"] },
  { id: "computer-security", title: "Computer Security Day", month: 11, day: 30, kind: "national", summary: "Security tips and product trust.", themes: ["security", "tech", "privacy", "saas", "trust"] },

  // December
  { id: "world-aids", title: "World AIDS Day", month: 12, day: 1, kind: "awareness", summary: "Awareness and solidarity — only if authentic.", themes: ["health", "awareness", "community", "care"] },
  { id: "international-disabled-persons", title: "International Day of Persons with Disabilities", month: 12, day: 3, kind: "international", summary: "Accessibility and inclusive product design.", themes: ["accessibility", "inclusion", "design", "tech", "community"] },
  { id: "national-cookie", title: "National Cookie Day", month: 12, day: 4, kind: "national", summary: "Sweet seasonal content.", themes: ["food", "dessert", "holidays", "fun", "retail"] },
  { id: "international-mountain", title: "International Mountain Day", month: 12, day: 11, kind: "international", summary: "Outdoors and resilience metaphors.", themes: ["outdoors", "nature", "adventure", "fitness"] },
  { id: "international-tea", title: "International Tea Day", month: 12, day: 15, kind: "international", summary: "Ritual, calm, and beverage brands.", themes: ["tea", "drink", "food", "wellness", "retail"] },
  { id: "national-ugly-sweater", title: "National Ugly Sweater Day", month: 12, day: 18, kind: "national", summary: "Playful holiday fashion content.", themes: ["fashion", "holidays", "humor", "fun", "retail"] },
  { id: "christmas", title: "Christmas", month: 12, day: 25, kind: "cultural", summary: "Gifting, gratitude, year-end warmth.", themes: ["holidays", "gifts", "family", "celebration", "retail"] },
  { id: "boxing-day", title: "Boxing Day", month: 12, day: 26, kind: "cultural", summary: "Post-holiday sales and restock moments.", themes: ["sales", "retail", "shopping", "deals"] },
  { id: "nye-eve", title: "New Year’s Eve", month: 12, day: 31, kind: "cultural", summary: "Countdowns, lookbacks, teaser drops.", themes: ["celebration", "goals", "lookback", "reset"] },
];

export function allObservances(): Observance[] {
  return OBSERVANCES;
}

export function observancesOnDate(month: number, day: number): Observance[] {
  return OBSERVANCES.filter((o) => o.month === month && o.day === day);
}

export function observancesInMonth(month: number): Observance[] {
  return OBSERVANCES.filter((o) => o.month === month).sort((a, b) => a.day - b.day);
}

export function daysWithObservances(month: number): Map<number, Observance[]> {
  const map = new Map<number, Observance[]>();
  for (const o of observancesInMonth(month)) {
    const list = map.get(o.day) ?? [];
    list.push(o);
    map.set(o.day, list);
  }
  return map;
}

function brandCorpus(report: BrandReport): string {
  return [
    report.name,
    report.domain,
    report.tagline,
    report.description,
    report.archetype,
    report.voiceSummary,
    ...report.keywords,
    ...report.personality.map((p) => `${p.label} ${p.description}`),
  ]
    .join(" ")
    .toLowerCase();
}

function industryHints(corpus: string): string[] {
  const hints: string[] = [];
  if (/ai|saas|software|cloud|api|dev|tech|fintech|stripe|pay|bank|crypto/.test(corpus)) {
    hints.push("tech", "saas", "security", "privacy", "innovation", "developers", "digital");
  }
  if (/food|restaurant|cafe|coffee|kitchen|recipe|drink|beverage|wine|beer/.test(corpus)) {
    hints.push("food", "drink", "coffee", "retail", "restaurants");
  }
  if (/fashion|apparel|clothing|beauty|cosmetic|style/.test(corpus)) {
    hints.push("fashion", "retail", "lifestyle", "gifts");
  }
  if (/health|fitness|wellness|medical|care|pharma/.test(corpus)) {
    hints.push("health", "wellness", "care", "fitness");
  }
  if (/eco|green|sustain|climate|solar|recycl/.test(corpus)) {
    hints.push("environment", "sustainability", "climate", "green", "nature");
  }
  if (/game|esport|entertainment|media|music|film/.test(corpus)) {
    hints.push("gaming", "entertainment", "fun", "creativity", "music");
  }
  if (/pet|dog|cat|animal/.test(corpus)) {
    hints.push("pets", "animals", "dogs", "cats");
  }
  if (/market|agency|advertis|brand|social|creator/.test(corpus)) {
    hints.push("marketing", "social", "creators", "creative", "digital");
  }
  if (/educat|school|learn|course|university/.test(corpus)) {
    hints.push("education", "learning", "students", "teachers");
  }
  return hints;
}

export function scoreObservanceFit(
  report: BrandReport,
  observance: Observance,
): { score: number; fit: FitLevel; reason: string } {
  const corpus = brandCorpus(report);
  const hints = industryHints(corpus);
  const topTrait = report.personality[0]?.label.toLowerCase() ?? "";
  const themes = observance.themes.map((t) => t.toLowerCase());

  let score = 32;
  let hits = 0;

  for (const theme of themes) {
    if (corpus.includes(theme)) {
      score += 14;
      hits += 1;
    } else if (hints.some((h) => h === theme || theme.includes(h) || h.includes(theme))) {
      score += 10;
      hits += 1;
    }
  }

  // Personality boosts
  if (/playful|bold|innovative|witty|fun/.test(topTrait) && themes.some((t) => /humor|joke|fun|playful|comedy/.test(t))) {
    score += 16;
    hits += 1;
  }
  if (/trust|professional|reliable|serious/.test(`${topTrait} ${report.archetype}`) && themes.some((t) => /security|privacy|trust|compliance/.test(t))) {
    score += 14;
    hits += 1;
  }
  if (/caring|warm|community|empathetic/.test(topTrait) && themes.some((t) => /care|community|kindness|family|wellness/.test(t))) {
    score += 12;
    hits += 1;
  }

  // Soft penalty: sensitive awareness days for unrelated consumer brands
  if (
    observance.kind === "awareness" &&
    !themes.some((t) => corpus.includes(t) || hints.includes(t))
  ) {
    score -= 12;
  }

  // Food/drink-heavy days are usually a stretch for hard B2B
  const isB2b = /saas|api|enterprise|b2b|cloud|developer|fintech|payments/.test(corpus);
  const foodHits = themes.filter((t) =>
    /food|dessert|chocolate|beer|wine|hot dog|hamburger|pretzel|ice cream|coffee|tea|snack|bbq|drink|restaurant/.test(
      t,
    ),
  ).length;
  if (
    isB2b &&
    foodHits >= 2 &&
    !themes.some((t) => /tech|saas|security|privacy|workplace|developer|digital/.test(t))
  ) {
    score -= 24;
  } else if (isB2b && themes.some((t) => /humor|joke|playful|fun/.test(t))) {
    score += 6; // light wit can still work for B2B
  }

  score = Math.max(8, Math.min(98, score));

  let fit: FitLevel = "low";
  if (score >= 68) fit = "high";
  else if (score >= 42) fit = "medium";

  let reason: string;
  if (fit === "high") {
    reason = `Strong overlap with ${report.name}'s themes (${hits || "voice"} match${hits === 1 ? "" : "es"}). Worth planning a post.`;
  } else if (fit === "medium") {
    reason = `Usable with a clever angle — connect “${observance.title}” to ${report.archetype.toLowerCase()} voice, don’t force it.`;
  } else {
    reason = `Low relevance for ${report.name}. Skip, or use only as a light joke if your voice is playful.`;
  }

  return { score, fit, reason };
}

function platformsFor(observance: Observance, fit: FitLevel): string[] {
  if (fit === "low") return ["Skip or Stories-only"];
  if (observance.themes.some((t) => /humor|joke|fun|selfie|dance|pet/.test(t))) {
    return ["TikTok", "Instagram Reels", "X"];
  }
  if (observance.themes.some((t) => /security|saas|privacy|workplace|leadership/.test(t))) {
    return ["LinkedIn", "X", "Newsletter"];
  }
  return ["Instagram", "LinkedIn", "TikTok"];
}

export function buildObservanceIdea(
  report: BrandReport,
  observance: Observance,
  year = new Date().getFullYear(),
): ObservanceIdea {
  const { score, fit, reason } = scoreObservanceFit(report, observance);
  const trait = report.personality[0]?.label ?? "Bold";
  const brand = report.name;
  const dateLabel = new Date(year, observance.month - 1, observance.day).toLocaleDateString(
    undefined,
    { weekday: "short", month: "short", day: "numeric" },
  );

  let angle = "";
  let hooks: string[] = [];

  if (fit === "low") {
    angle = `${observance.title} doesn’t map cleanly to ${brand}. If you must post, keep it a one-line witty nod in ${trait.toLowerCase()} voice — don’t build a campaign around it.`;
    hooks = [
      `Optional one-liner only: “Happy ${observance.title} — now back to ${brand}.”`,
      `Better: sit this one out and save the calendar slot for a higher-fit day.`,
    ];
  } else if (themesHumor(observance)) {
    angle = `Lean into ${observance.title} with ${brand}'s ${trait.toLowerCase()} humor. ${observance.summary} Make the punchline about your product benefit, not a random joke.`;
    hooks = [
      `${observance.title} joke → punchline is why teams pick ${brand}.`,
      `“A ${brand} joke walks into ${observance.title}…” (keep it short).`,
      `POV: explaining ${brand} using only ${observance.title} energy.`,
    ];
  } else if (fit === "high") {
    angle = `${observance.title} is a natural fit. ${observance.summary} Tell it in ${brand}'s ${report.archetype} voice: ${report.voiceSummary.slice(0, 120)}`;
    hooks = [
      `How ${brand} shows up for ${observance.title}.`,
      `${observance.title}: 3 things our customers already do (with ${brand}).`,
      `Behind the scenes at ${brand} on ${observance.title}.`,
    ];
  } else {
    angle = `Bridge ${observance.title} to a real ${brand} proof point. ${observance.summary} Stay ${trait.toLowerCase()} — avoid hollow “Happy [Day]!” posts.`;
    hooks = [
      `${observance.title} → one customer story from ${brand}.`,
      `What ${observance.title} taught us about ${report.keywords[0] ?? "our craft"}.`,
      `Quick tip for ${observance.title}, ${brand}-style.`,
    ];
  }

  const topicPrompt = [
    `Create a social post for ${observance.title} (${dateLabel}).`,
    `Brand: ${brand} (${report.archetype}). Voice: ${trait}.`,
    `Fit: ${fit} (${score}/100). ${reason}`,
    `Angle: ${angle}`,
    `Themes: ${observance.themes.slice(0, 5).join(", ")}.`,
    fit === "low" ? "Keep it optional and very light, or skip." : "Make it specific to the product, not generic holiday filler.",
  ].join(" ");

  return {
    observance,
    dateLabel,
    fit,
    fitScore: score,
    fitReason: reason,
    angle,
    hooks,
    platforms: platformsFor(observance, fit),
    topicPrompt,
  };
}

function themesHumor(o: Observance): boolean {
  return o.themes.some((t) => /humor|joke|fun|playful|comedy|april fools/.test(t));
}

/** Next dates (including today) that have observances, for quick jump. */
export function upcomingObservanceDates(
  from = new Date(),
  limit = 12,
): { month: number; day: number; year: number; items: Observance[] }[] {
  const out: { month: number; day: number; year: number; items: Observance[] }[] = [];
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  for (let i = 0; i < 366 && out.length < limit; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const items = observancesOnDate(d.getMonth() + 1, d.getDate());
    if (items.length) {
      out.push({
        month: d.getMonth() + 1,
        day: d.getDate(),
        year: d.getFullYear(),
        items,
      });
    }
  }
  return out;
}
