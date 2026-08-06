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
import {
  PLATFORM_IMAGE_SPECS,
  downloadBlob,
  renderPostImage,
  type RenderedPostImage,
} from "../lib/postImage";

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
  const [images, setImages] = useState<Record<string, RenderedPostImage>>({});
  const [imageBusy, setImageBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const selectedVoice = useMemo(
    () => VOICE_PRESETS.find((v) => v.id === voiceId) ?? VOICE_PRESETS[0]!,
    [voiceId],
  );

  const imageSpec = PLATFORM_IMAGE_SPECS[platform];

  function runGenerate(e?: FormEvent) {
    e?.preventDefault();
    setError(null);
    setGenerating(true);
    setImages({});
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
      window.setTimeout(() => setGenerating(false), 180);
    }
  }

  async function generateImage(post: GeneratedPost, index: number) {
    setError(null);
    setImageBusy(post.id);
    try {
      const rendered = await renderPostImage(report, post, { variantIndex: index });
      setImages((prev) => ({ ...prev, [post.id]: rendered }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not render post image.");
    } finally {
      setImageBusy(null);
    }
  }

  async function generateAllImages() {
    if (!posts?.length) return;
    setError(null);
    setImageBusy("all");
    try {
      const entries: Record<string, RenderedPostImage> = {};
      for (let i = 0; i < posts.length; i++) {
        const post = posts[i]!;
        entries[post.id] = await renderPostImage(report, post, { variantIndex: i });
      }
      setImages(entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not render post images.");
    } finally {
      setImageBusy(null);
    }
  }

  return (
    <section className="panel span-2 studio">
      <h3>Content studio</h3>
      <p className="sub">
        Pick a brand voice, describe the content you want, generate engagement drafts, then
        export platform-sized post images from your brand palette.
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
          <p className="platform-tip">
            {platformTip(platform)} Export size: <strong>{imageSpec.ratio}</strong> (
            {imageSpec.label}).
          </p>
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
        <>
          <div className="studio-actions image-actions">
            <p className="voice-hint">
              Post images use {report.name}’s palette at <em>{imageSpec.ratio}</em>
            </p>
            <button
              type="button"
              className="generate-btn secondary-btn"
              disabled={imageBusy !== null}
              onClick={() => void generateAllImages()}
            >
              {imageBusy === "all" ? "Rendering images…" : "Generate all post images"}
            </button>
          </div>

          <div className="post-grid">
            {posts.map((post, i) => {
              const image = images[post.id];
              const busy = imageBusy === post.id || imageBusy === "all";
              return (
                <article
                  className="post-card"
                  key={post.id}
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <div className="post-head">
                    <span className="post-format">{post.format}</span>
                    <button
                      type="button"
                      className="copy-post"
                      onClick={() => onCopy(post.fullText)}
                    >
                      Copy text
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

                  <div className="image-block">
                    <div className="image-block-head">
                      <span className="post-format">{imageSpec.ratio}</span>
                      <div className="image-btns">
                        <button
                          type="button"
                          className="copy-post"
                          disabled={busy}
                          onClick={() => void generateImage(post, i)}
                        >
                          {busy && !image ? "Rendering…" : image ? "Regenerate" : "Generate image"}
                        </button>
                        {image && (
                          <button
                            type="button"
                            className="copy-post accent-outline"
                            onClick={() => downloadBlob(image.blob, image.filename)}
                          >
                            Download PNG
                          </button>
                        )}
                      </div>
                    </div>
                    {image && (
                      <figure className="post-image-preview">
                        <img
                          src={image.dataUrl}
                          alt={`${report.name} ${post.platform} post preview`}
                          width={image.width}
                          height={image.height}
                        />
                        <figcaption>
                          {image.width}×{image.height}px · {image.spec.label}
                        </figcaption>
                      </figure>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
