import { useMemo, useState, type FormEvent } from "react";
import type {
  BrandReport,
  ContentPlatform,
  GeneratedPost,
  InstagramPostRef,
  MascotId,
  MascotPosition,
  VoicePresetId,
} from "../types";
import { audiencePrompts } from "../lib/audience";
import {
  CONTENT_PROMPTS,
  VOICE_PRESETS,
  generateSocialContent,
  platformLabel,
  platformTip,
} from "../lib/contentGen";
import {
  DEFAULT_MASCOT_POS,
  PLATFORM_IMAGE_SPECS,
  downloadBlob,
  renderPostImage,
  type RenderedPostImage,
} from "../lib/postImage";
import { loadImageFromFile } from "../lib/mascots";
import { ContentCalendar } from "./ContentCalendar";
import { InstagramLibrary } from "./InstagramLibrary";
import { MascotPicker } from "./MascotPicker";
import { MascotStage } from "./MascotStage";
import { TrendRadar } from "./TrendRadar";
import type { TrendSuggestion } from "../types";

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

  const [igRefs, setIgRefs] = useState<InstagramPostRef[]>([]);
  const [selectedRefId, setSelectedRefId] = useState<string | null>(null);
  const [mascotId, setMascotId] = useState<MascotId>("orb");
  const [customMascot, setCustomMascot] = useState<HTMLImageElement | null>(null);
  const [customMascotName, setCustomMascotName] = useState<string | null>(null);
  const [mascotPos, setMascotPos] = useState<MascotPosition>(DEFAULT_MASCOT_POS);
  const [activeTrend, setActiveTrend] = useState<TrendSuggestion | null>(null);

  const selectedVoice = useMemo(
    () => VOICE_PRESETS.find((v) => v.id === voiceId) ?? VOICE_PRESETS[0]!,
    [voiceId],
  );

  const topicHints = useMemo(() => {
    const audience = audiencePrompts(report);
    return [...audience, ...CONTENT_PROMPTS].slice(0, 8);
  }, [report]);

  const selectedRef = useMemo(
    () => igRefs.find((r) => r.refId === selectedRefId) ?? null,
    [igRefs, selectedRefId],
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
        referenceId: selectedRef?.refId,
        referenceUrl: selectedRef?.url,
        referenceCaption: selectedRef?.caption,
        mascotId,
      });
      setPosts(next);
    } catch (err) {
      setPosts(null);
      setError(err instanceof Error ? err.message : "Could not generate content.");
    } finally {
      window.setTimeout(() => setGenerating(false), 180);
    }
  }

  async function onCustomFile(file: File) {
    try {
      const img = await loadImageFromFile(file);
      setCustomMascot(img);
      setCustomMascotName(file.name);
      setMascotId("custom");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mascot upload failed.");
    }
  }

  async function generateImage(post: GeneratedPost, index: number) {
    setError(null);
    setImageBusy(post.id);
    try {
      const rendered = await renderPostImage(report, post, {
        variantIndex: index,
        mascotId,
        customMascot: mascotId === "custom" ? customMascot : null,
        mascotPos,
      });
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
        entries[post.id] = await renderPostImage(report, post, {
          variantIndex: i,
          mascotId,
          customMascot: mascotId === "custom" ? customMascot : null,
          mascotPos,
        });
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
        Pick a voice, drag your mascot onto feed/Reel frames, plan national days, load
        TikTok/IG + future trend bets, then export platform-sized images
        {report.audiences?.length
          ? ` — tuned for ${report.audiences.join(" · ")}`
          : ""}
        .
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

        <MascotPicker
          mascotId={mascotId}
          customName={customMascotName}
          onSelect={setMascotId}
          onCustomFile={(file) => void onCustomFile(file)}
        />

        <MascotStage
          report={report}
          platform={platform}
          mascotId={mascotId}
          customMascot={customMascot}
          position={mascotPos}
          onPositionChange={setMascotPos}
          onCustomFile={(file) => void onCustomFile(file)}
        />

        <ContentCalendar
          report={report}
          onCopy={onCopy}
          onUseIdea={(topicPrompt, idea) => {
            setTopic(topicPrompt);
            setActiveTrend(null);
            if (idea.platforms[0] === "LinkedIn") setPlatform("linkedin");
            else if (idea.platforms[0] === "TikTok") setPlatform("tiktok");
            else setPlatform("instagram");
          }}
        />

        <TrendRadar
          report={report}
          onCopy={onCopy}
          onUseSuggestion={(topicPrompt, suggestion) => {
            setTopic(topicPrompt);
            setActiveTrend(suggestion);
            if (suggestion.platform === "tiktok" || suggestion.category === "tiktok") {
              setPlatform("tiktok");
            } else if (
              suggestion.platform === "instagram" ||
              suggestion.category === "instagram"
            ) {
              setPlatform("instagram");
            } else if (suggestion.platforms[0] === "LinkedIn") {
              setPlatform("linkedin");
            } else if (suggestion.category === "movie" || suggestion.category === "festival") {
              setPlatform("instagram");
            }
          }}
        />

        <InstagramLibrary
          report={report}
          refs={igRefs}
          selectedId={selectedRefId}
          onChange={setIgRefs}
          onSelect={(ref) => setSelectedRefId(ref?.refId ?? null)}
          onCopy={onCopy}
        />

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
            {selectedRef ? (
              <>
                {" "}
                Citing <strong>{selectedRef.refId}</strong>.
              </>
            ) : null}
          </p>
        </fieldset>

        <fieldset className="studio-field">
          <legend>What do you want to create?</legend>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={`e.g. Remix ${selectedRef?.refId ?? "IG-01"} into a launch teaser for our new checkout…`}
            rows={3}
            aria-label="Content brief"
          />
          <div className="hints topic-hints">
            {topicHints.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() =>
                  setTopic((prev) => {
                    const base = selectedRef
                      ? `${prompt} referencing ${selectedRef.refId}`
                      : prompt;
                    return prev.trim() ? `${prev.trim()} — ${base}` : base;
                  })
                }
              >
                {prompt}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="studio-actions">
          <p className="voice-hint">
            Writing as <em>{selectedVoice.label}</em>
            {mascotId !== "none" ? ` · mascot ${mascotId}` : ""}
            {selectedRef ? ` · ref ${selectedRef.refId}` : ""}
            {activeTrend ? ` · trend ${activeTrend.category}` : ""} for{" "}
            {platformLabel(platform)}
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
              {mascotId !== "none" ? " · mascot position applied" : ""}
              {selectedRef ? (
                <>
                  {" "}
                  · badge <em>{selectedRef.refId}</em>
                </>
              ) : null}
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
                    <span className="post-format">
                      {post.format}
                      {post.referenceId ? ` · ${post.referenceId}` : ""}
                    </span>
                    <button
                      type="button"
                      className="copy-post"
                      onClick={() => onCopy(post.fullText)}
                    >
                      Copy text
                    </button>
                  </div>
                  {post.referenceId && (
                    <div className="ref-inline">
                      <span className="ref-id">{post.referenceId}</span>
                      <span className="ref-inline-cap">
                        {post.referenceCaption?.slice(0, 90) || "Instagram reference"}
                        {(post.referenceCaption?.length ?? 0) > 90 ? "…" : ""}
                      </span>
                    </div>
                  )}
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
                          {post.referenceId ? ` · ${post.referenceId}` : ""}
                          {mascotId !== "none" ? ` · mascot` : ""}
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
