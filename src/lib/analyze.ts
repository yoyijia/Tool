import type { BrandReport } from "../types";
import { detectAudiences } from "./audience";
import { capturePage } from "./fetchPage";
import { buildPalette } from "./palette";
import { analyzePersonality, analyzeVoice } from "./personality";
import { extractSocialProfiles, identifyTrends } from "./social";
import { brandNameFromDomain, domainFromUrl } from "./url";

export async function analyzeBrand(input: string): Promise<BrandReport> {
  const snapshot = await capturePage(input);
  const domain = domainFromUrl(snapshot.url);

  const nameFromTitle = snapshot.title.split(/[|\-–—:]/)[0]?.trim() ?? "";
  const name =
    nameFromTitle && nameFromTitle.length < 48
      ? nameFromTitle
      : brandNameFromDomain(domain);

  const tagline =
    snapshot.headings.find((h) => h.length > 8 && h.length < 100) ||
    snapshot.ogDescription.slice(0, 120) ||
    snapshot.metaDescription.slice(0, 120) ||
    "Brand presence detected from public web signals.";

  const description =
    snapshot.metaDescription ||
    snapshot.ogDescription ||
    snapshot.textContent.slice(0, 280) ||
    "No meta description found — personality inferred from on-page copy.";

  const corpus = [
    snapshot.title,
    snapshot.metaDescription,
    snapshot.ogDescription,
    ...snapshot.headings,
    snapshot.textContent.slice(0, 6000),
  ].join("\n");

  const { traits, archetype } = analyzePersonality(corpus);
  const { dimensions, summary, keywords } = analyzeVoice(corpus);
  const audiences = detectAudiences(corpus);
  const palette = buildPalette(snapshot.styleColors, snapshot.themeColor);
  const socialProfiles = extractSocialProfiles(snapshot);
  const trends = identifyTrends(
    snapshot,
    socialProfiles,
    traits.map((t) => t.label),
    keywords,
  );

  return {
    url: snapshot.url,
    domain,
    name,
    tagline,
    description,
    personality: traits,
    archetype,
    voiceSummary: summary,
    voiceDimensions: dimensions,
    keywords,
    audiences,
    palette,
    socialProfiles,
    trends,
    analyzedAt: new Date().toISOString(),
    sourceSnippet: snapshot.textContent.slice(0, 220),
  };
}
