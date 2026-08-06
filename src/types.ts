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
  /** Easy-to-cite Instagram reference id, e.g. IG-03 */
  referenceId?: string;
  referenceUrl?: string;
  referenceCaption?: string;
  mascotId?: string;
}

export interface ContentBrief {
  voiceId: VoicePresetId;
  platform: ContentPlatform;
  topic: string;
  referenceId?: string;
  referenceUrl?: string;
  referenceCaption?: string;
  mascotId?: string;
}

/** A pulled Instagram post labeled for easy citation. */
export interface InstagramPostRef {
  /** Stable citation code shown in UI, e.g. IG-01 */
  refId: string;
  shortcode: string;
  url: string;
  caption: string;
  author?: string;
  thumbnailUrl?: string;
  fetchedAt: string;
  source: "oembed" | "og" | "manual";
}

export type MascotId =
  | "none"
  | "orb"
  | "fox"
  | "sprout"
  | "bolt"
  | "custom";

export interface MascotOption {
  id: MascotId;
  label: string;
  blurb: string;
}
