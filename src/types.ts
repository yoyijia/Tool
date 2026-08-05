export interface ColorSwatch {
  hex: string;
  role: "primary" | "secondary" | "accent" | "neutral" | "background" | "text";
  frequency: number;
  name: string;
}

export interface PersonalityTrait {
  label: string;
  score: number;
  description: string;
}

export interface VoiceDimension {
  axis: string;
  left: string;
  right: string;
  value: number;
}

export interface SocialProfile {
  platform: string;
  url: string;
  handle?: string;
}

export interface MarketingTrend {
  title: string;
  insight: string;
  confidence: "high" | "medium" | "low";
  category: "content" | "platform" | "tone" | "visual" | "cadence";
}

export interface BrandReport {
  url: string;
  domain: string;
  name: string;
  tagline: string;
  description: string;
  personality: PersonalityTrait[];
  archetype: string;
  voiceSummary: string;
  voiceDimensions: VoiceDimension[];
  keywords: string[];
  palette: ColorSwatch[];
  socialProfiles: SocialProfile[];
  trends: MarketingTrend[];
  analyzedAt: string;
  sourceSnippet: string;
}

export interface AnalyzeRequest {
  input: string;
}
