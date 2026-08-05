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

export type VoicePresetId =
  | "detected"
  | "bold"
  | "warm"
  | "premium"
  | "playful"
  | "expert"
  | "minimal"
  | "innovative";

export type ContentPlatform =
  | "instagram"
  | "linkedin"
  | "tiktok"
  | "x"
  | "youtube";

export interface VoicePreset {
  id: VoicePresetId;
  label: string;
  blurb: string;
  hooks: string[];
  closers: string[];
  styleNotes: string[];
}

export interface GeneratedPost {
  id: string;
  platform: ContentPlatform;
  format: string;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  engagementTips: string[];
  fullText: string;
}

export interface ContentBrief {
  voiceId: VoicePresetId;
  platform: ContentPlatform;
  topic: string;
}
