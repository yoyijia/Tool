import type { MarketingTrend, SocialProfile } from "../types";
import { isSocialUrl } from "./fetchPage";
import type { PageSnapshot } from "./fetchPage";

const PLATFORM_META: Record<
  string,
  { name: string; pathHint?: RegExp }
> = {
  "twitter.com": { name: "X / Twitter", pathHint: /^\/@?[\w]+/ },
  "x.com": { name: "X / Twitter", pathHint: /^\/@?[\w]+/ },
  "instagram.com": { name: "Instagram" },
  "facebook.com": { name: "Facebook" },
  "linkedin.com": { name: "LinkedIn" },
  "tiktok.com": { name: "TikTok" },
  "youtube.com": { name: "YouTube" },
  "youtu.be": { name: "YouTube" },
  "pinterest.com": { name: "Pinterest" },
  "threads.net": { name: "Threads" },
  "discord.gg": { name: "Discord" },
  "discord.com": { name: "Discord" },
};

function hostKey(hostname: string): string {
  const h = hostname.replace(/^www\./, "");
  const match = Object.keys(PLATFORM_META).find(
    (k) => h === k || h.endsWith(`.${k}`),
  );
  return match ?? h;
}

export function extractSocialProfiles(
  snapshot: PageSnapshot,
): SocialProfile[] {
  const found = new Map<string, SocialProfile>();

  for (const href of snapshot.linkHrefs) {
    if (!isSocialUrl(href)) continue;
    try {
      const absolute = new URL(href, snapshot.url);
      const key = hostKey(absolute.hostname);
      const meta = PLATFORM_META[key];
      if (!meta) continue;
      if (found.has(meta.name)) continue;

      const path = absolute.pathname.replace(/\/$/, "");
      const handle =
        path && path !== ""
          ? path.split("/").filter(Boolean).slice(-1)[0]
          : undefined;

      found.set(meta.name, {
        platform: meta.name,
        url: absolute.href,
        handle: handle ? `@${handle.replace(/^@/, "")}` : undefined,
      });
    } catch {
      /* skip bad urls */
    }
  }

  return [...found.values()];
}

export function identifyTrends(
  snapshot: PageSnapshot,
  social: SocialProfile[],
  personalityLabels: string[],
  keywords: string[],
): MarketingTrend[] {
  const trends: MarketingTrend[] = [];
  const platforms = new Set(social.map((s) => s.platform));
  const text = `${snapshot.title} ${snapshot.metaDescription} ${snapshot.textContent} ${snapshot.headings.join(" ")}`.toLowerCase();

  // Platform mix
  if (platforms.has("TikTok") || platforms.has("Instagram")) {
    trends.push({
      title: "Short-form visual storytelling",
      insight:
        "Active presence on visual-first platforms suggests Reels/TikTok-style hooks, lifestyle clips, and creator collabs over long-form posts.",
      confidence: platforms.has("TikTok") && platforms.has("Instagram") ? "high" : "medium",
      category: "platform",
    });
  }

  if (platforms.has("LinkedIn")) {
    trends.push({
      title: "Thought-leadership on LinkedIn",
      insight:
        "LinkedIn linkage points to B2B or professional storytelling — carousels, founder POV, and case-study narratives.",
      confidence: "high",
      category: "platform",
    });
  }

  if (platforms.has("YouTube")) {
    trends.push({
      title: "Long-form video authority",
      insight:
        "YouTube presence signals deeper product demos, tutorials, or brand films that feed shorter social cuts.",
      confidence: "medium",
      category: "content",
    });
  }

  if (platforms.has("X / Twitter")) {
    trends.push({
      title: "Real-time conversation marketing",
      insight:
        "X/Twitter suggests rapid response culture — launches, memes, customer support as content, and trend-jacking.",
      confidence: "medium",
      category: "cadence",
    });
  }

  if (platforms.size === 0) {
    trends.push({
      title: "Owned-channel first",
      insight:
        "Few public social links detected. Marketing likely leans on the website, email, SEO, and paid acquisition more than organic social.",
      confidence: "medium",
      category: "platform",
    });
  }

  // Tone / content from personality
  if (personalityLabels.includes("Playful") || personalityLabels.includes("Bold")) {
    trends.push({
      title: "Personality-led hooks",
      insight:
        "Brand language skews expressive — expect punchy CTAs, meme-adjacent creative, and high-contrast campaign lines.",
      confidence: "high",
      category: "tone",
    });
  }

  if (personalityLabels.includes("Premium") || personalityLabels.includes("Minimal")) {
    trends.push({
      title: "Aesthetic restraint",
      insight:
        "Premium/minimal signals favor sparse layouts, product-as-hero photography, and fewer but higher-production posts.",
      confidence: "high",
      category: "visual",
    });
  }

  if (personalityLabels.includes("Expert") || personalityLabels.includes("Trustworthy")) {
    trends.push({
      title: "Proof over hype",
      insight:
        "Credibility-forward voice suggests testimonials, stats, certifications, and educational series outperform pure lifestyle ads.",
      confidence: "high",
      category: "content",
    });
  }

  if (personalityLabels.includes("Innovative")) {
    trends.push({
      title: "Product-innovation drops",
      insight:
        "Innovation language maps to feature teasers, waitlists, and build-in-public updates as recurring social formats.",
      confidence: "medium",
      category: "cadence",
    });
  }

  // Page signals
  if (/\b(blog|stories|journal|insights|news)\b/.test(text)) {
    trends.push({
      title: "Content hub → social amplification",
      insight:
        "A publishing surface was detected. Social likely recycles articles into carousels, quote graphics, and newsletter loops.",
      confidence: "medium",
      category: "content",
    });
  }

  if (/\b(shop|buy|cart|checkout|order)\b/.test(text)) {
    trends.push({
      title: "Commerce-native creative",
      insight:
        "Commerce signals suggest UGC, product demos, and social shopping units (Shops, product tags, affiliate creators).",
      confidence: "high",
      category: "content",
    });
  }

  if (/\b(community|discord|members|join us)\b/.test(text) || platforms.has("Discord")) {
    trends.push({
      title: "Community-as-channel",
      insight:
        "Community language indicates member-generated content, AMAs, and insider drops as a growth loop.",
      confidence: "medium",
      category: "platform",
    });
  }

  if (/\b(sustainab|climate|ethical|organic)\b/.test(text)) {
    trends.push({
      title: "Values-led campaigns",
      insight:
        "Purpose language on-site usually extends to social as impact stories, behind-the-scenes supply chain, and cause partnerships.",
      confidence: "medium",
      category: "tone",
    });
  }

  // Keyword-informed
  const techKw = keywords.some((k) =>
    ["ai", "api", "saas", "cloud", "data", "platform", "software"].includes(k),
  );
  if (techKw) {
    trends.push({
      title: "Developer / product marketing mix",
      insight:
        "Tech keywords imply changelog posts, launch weeks, and comparison content across LinkedIn, X, and YouTube.",
      confidence: "medium",
      category: "content",
    });
  }

  // Deduplicate by title and cap
  const seen = new Set<string>();
  return trends
    .filter((t) => {
      if (seen.has(t.title)) return false;
      seen.add(t.title);
      return true;
    })
    .slice(0, 6);
}
