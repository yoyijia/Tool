import { useMemo, useState, type FormEvent } from "react";
import type {
  BrandReport,
  ContentPlatform,
  GeneratedPost,
  VoicePresetId,
} from "../types";
import {
  CONTENT_PROMPTS,
  VOICE_PRESETS,
  generateSocialContent,
  platformLabel,
  platformTip,
} from "../lib/contentGen";

const PLATFORMS: ContentPlatform[] = [
  "instagram",
  "linkedin",
  "tiktok",
  "x",
  "youtube",
];

interface Props {
  report: BrandReport;
  onCopy: (text: string) => void;
}

export function ContentStudio({ report, onCopy }: Props) {
  const [voiceId, setVoiceId] = useState<VoicePresetId>("detected");
  const [platform, setPlatform] = useState<ContentPlatform>("instagram");
  const [topic, setTopic] = useState("");
  const [posts, setPosts] = useState<GeneratedPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const selectedVoice = useMemo(
    () => VOICE_PRESETS.find((v) => v.id === voiceId) ?? VOICE_PRESETS[0]!,
    [voiceId],
  );

  function runGenerate(e?: FormEvent) {
    e?.preventDefault();
    setError(null);
    setGenerating(true);
    try {
      const next = generateSocialContent(report, {
        voiceId,
        platform,
        topic,
      });
      setPosts(next);
    } catch (err) {
      setPosts(null);
      setError(err instanceof Error ? err.message : "Could not generate content.");
    } finally {
      // Tiny delay so the button state feels intentional
      window.setTimeout(() => setGenerating(false), 180);
    }
  }

  return (
    <section className="panel span-2 studio">
      <h3>Content studio</h3>
      <p className="sub">
        Pick a brand voice, describe the content you want, and generate engagement-focused
        social drafts grounded in {report.name}’s brief.
      </p>

      <form className="studio-form" onSubmit={runGenerate}>
        <fieldset className="studio-field">
          <legend>Brand voice</legend>
          <div className="voice-grid">
            {VOICE_PRESETS.map((v) => (
              <button
                key={v.id}
                type="button"
                className={`voice-card${voiceId === v.id ? " active" : ""}`}
                onClick={() => setVoiceId(v.id)}
                aria-pressed={voiceId === v.id}
              >
                <strong>{v.id === "detected" ? `Detected · ${report.archetype}` : v.label}</strong>
                <span>
                  {v.id === "detected"
                    ? report.voiceSummary.length > 110
                      ? `${report.voiceSummary.slice(0, 110)}…`
                      : report.voiceSummary
                    : v.blurb}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="studio-field">
          <legend>Platform</legend>
          <div className="platform-row">
            {PLATFORMS.map((p) => (
              <button
                key={p}
                type="button"
                className={`chip-btn${platform === p ? " active" : ""}`}
                onClick={() => setPlatform(p)}
                aria-pressed={platform === p}
              >
                {platformLabel(p)}
              </button>
            ))}
          </div>
          <p className="platform-tip">{platformTip(platform)}</p>
        </fieldset>

        <fieldset className="studio-field">
          <legend>What do you want to create?</legend>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={`e.g. A launch post for our new checkout feature, or a myth-busting carousel about ${report.keywords[0] ?? "our product"}…`}
            rows={3}
            aria-label="Content brief"
          />
          <div className="hints topic-hints">
            {CONTENT_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() =>
                  setTopic((prev) => (prev.trim() ? `${prev.trim()} — ${prompt}` : prompt))
                }
              >
                {prompt}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="studio-actions">
          <p className="voice-hint">
            Writing as <em>{selectedVoice.label}</em> for {platformLabel(platform)}
          </p>
          <button type="submit" className="generate-btn" disabled={generating}>
            {generating ? "Crafting…" : "Generate engagement drafts"}
          </button>
        </div>
      </form>

      {error && <div className="error">{error}</div>}

      {posts && (
        <div className="post-grid">
          {posts.map((post, i) => (
            <article className="post-card" key={post.id} style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="post-head">
                <span className="post-format">{post.format}</span>
                <button type="button" className="copy-post" onClick={() => onCopy(post.fullText)}>
                  Copy
                </button>
              </div>
              <p className="post-hook">{post.hook}</p>
              <pre className="post-body">{post.body}</pre>
              {post.hashtags.length > 0 && (
                <div className="keywords post-tags">
                  {post.hashtags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              )}
              <ul className="engage-tips">
                {post.engagementTips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
