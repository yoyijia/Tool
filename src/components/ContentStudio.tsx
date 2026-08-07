import { useEffect, useMemo, useState, type FormEvent } from "react";
import type {
  BrandReport,
  ContentPlatform,
  GeneratedPost,
  InstagramPostRef,
  MascotId,
  MascotPose,
  MascotPosition,
  VoicePresetId,
} from "../types";
import {
  audienceLine,
  audienceQuickPicks,
  primaryAudienceLabel,
  resolveTargetAudience,
} from "../lib/audience";
import {
  VOICE_PRESETS,
  generateSocialContent,
  platformLabel,
  platformTip,
} from "../lib/contentGen";
import { exampleIdeas, scoreIdea, type IdeaFitResult } from "../lib/ideaFit";
import {
  DEFAULT_MASCOT_POS,
  PLATFORM_IMAGE_SPECS,
  downloadBlob,
  renderPostImage,
  type RenderedPostImage,
} from "../lib/postImage";
import { loadImageFromFile, suggestMascotPose } from "../lib/mascots";
import { servicesLine } from "../lib/services";
import { ContentCalendar } from "./ContentCalendar";
import { ContentSchedule } from "./ContentSchedule";
import { InstagramLibrary } from "./InstagramLibrary";
import { MascotPicker } from "./MascotPicker";
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
  const [targetAudience, setTargetAudience] = useState(() =>
    primaryAudienceLabel(report),
  );
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
  const mascotPos: MascotPosition = DEFAULT_MASCOT_POS;
  const [mascotPose, setMascotPose] = useState<MascotPose>("idle");
  const [activeTrend, setActiveTrend] = useState<TrendSuggestion | null>(null);
  const [ideaResult, setIdeaResult] = useState<IdeaFitResult | null>(null);
  const [ideaBusy, setIdeaBusy] = useState(false);
  const [showAllExamples, setShowAllExamples] = useState(false);

  function applyTopic(next: string, alsoPose = true) {
    setTopic(next);
    if (alsoPose) {
      setMascotPose(suggestMascotPose(next, platform, report.services ?? []));
    }
  }

  const selectedVoice = useMemo(
    () => VOICE_PRESETS.find((v) => v.id === voiceId) ?? VOICE_PRESETS[0]!,
    [voiceId],
  );

  const audiencePicks = useMemo(() => audienceQuickPicks(report), [report]);
  const activeAudience = resolveTargetAudience(report, targetAudience);

  const topicHints = useMemo(
    () => exampleIdeas(report, 18, activeAudience),
    [report, activeAudience],
  );
  const visibleHints = showAllExamples ? topicHints : topicHints.slice(0, 8);

  // When analyzing a new company, seed audience from detection (user can still override)
  useEffect(() => {
    setTargetAudience(primaryAudienceLabel(report));
    setIdeaResult(null);
    setTopic("");
  }, [report.domain, report.name]);

  function setAudience(next: string) {
    setTargetAudience(next);
  }

  function runIdeaCheck(raw: string) {
    setIdeaBusy(true);
    setError(null);
    try {
      setIdeaResult(scoreIdea(report, raw, platform, activeAudience));
    } catch (err) {
      setIdeaResult(null);
      setError(err instanceof Error ? err.message : "Could not score that idea.");
    } finally {
      setIdeaBusy(false);
    }
  }

  function checkIdea() {
    if (!topic.trim()) {
      setIdeaResult(null);
      return;
    }
    runIdeaCheck(topic);
  }

  // Auto-evaluate as the user types (and when audience/platform changes)
  useEffect(() => {
    const trimmed = topic.trim();
    if (!trimmed) {
      setIdeaResult(null);
      setIdeaBusy(false);
      return;
    }

    setIdeaBusy(true);
    const timer = window.setTimeout(() => {
      try {
        setIdeaResult(scoreIdea(report, topic, platform, activeAudience));
        setError(null);
      } catch (err) {
        setIdeaResult(null);
        setError(err instanceof Error ? err.message : "Could not score that idea.");
      } finally {
        setIdeaBusy(false);
      }
    }, 550);

    return () => window.clearTimeout(timer);
  }, [topic, activeAudience, platform, report]);

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
        targetAudience: activeAudience,
        listening: activeTrend
          ? {
              trendTitle: activeTrend.trendTitle,
              angle: activeTrend.angle,
              hookIdeas: activeTrend.hookIdeas,
              voiceBlend: activeTrend.voiceBlend,
              fitReason: activeTrend.fitReason,
              source: `Social listening · ${activeTrend.category}`,
            }
          : undefined,
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
        mascotPose,
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
          mascotPose,
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
        Plan around services like {servicesLine(report)}, then export editorial images
        {report.audiences?.length
          ? ` — tuned for ${report.audiences.join(" · ")}`
          : ""}
        .
      </p>

      <form className="studio-form" onSubmit={runGenerate}>
        <fieldset className="studio-field audience-field">
          <legend>Type your audience</legend>
          <p className="platform-tip">
            Who should this post speak to? Type freely — change it for every draft. Drafts
            use an audience playbook (hooks, proof, CTA) plus social listening — not just a
            renamed label. Detected for <strong>{report.name}</strong>:{" "}
            {audienceLine(report)}.
          </p>
          <label className="audience-label" htmlFor="target-audience-input">
            Target audience
          </label>
          <input
            id="target-audience-input"
            className="audience-input"
            value={targetAudience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="Type anyone… clinic owners, SME founders, Gen Z shoppers, developers…"
            aria-label="Type your target audience"
            autoComplete="off"
          />
          <div className="hints topic-hints audience-picks">
            {audiencePicks.map((a) => (
              <button
                key={a}
                type="button"
                className={
                  activeAudience.toLowerCase() === a.toLowerCase() ? "active-pick" : undefined
                }
                onClick={() => {
                  setActiveTrend(null);
                  setAudience(a);
                }}
              >
                {a}
              </button>
            ))}
          </div>
          <p className="voice-hint audience-live">
            This post targets: <em>{activeAudience || "— type an audience above —"}</em>
            {activeTrend
              ? ` · listening “${activeTrend.trendTitle}”`
              : " · audience playbook + listening seed"}
          </p>
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
            {selectedRef ? (
              <>
                {" "}
                Citing <strong>{selectedRef.refId}</strong>.
              </>
            ) : null}
          </p>
        </fieldset>

        <fieldset className="studio-field">
          <legend>Your idea — type anything</legend>
          <p className="platform-tip">
            Write a rough concept aimed at <strong>{activeAudience}</strong>. We check as
            you type whether it works, then suggest a stronger rewrite. Tap examples below
            anytime.
          </p>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onBlur={() => {
              if (topic.trim()) {
                runIdeaCheck(topic);
                setMascotPose(
                  suggestMascotPose(topic, platform, report.services ?? []),
                );
              }
            }}
            placeholder={`Type your idea for ${activeAudience}…`}
            rows={4}
            aria-label="Your content idea"
          />
          <div className="studio-actions idea-check-actions">
            <button
              type="button"
              className="generate-btn secondary-btn"
              disabled={ideaBusy || !topic.trim()}
              onClick={() => checkIdea()}
            >
              {ideaBusy ? "Checking…" : "Check if it works"}
            </button>
            <button type="submit" className="generate-btn" disabled={generating}>
              {generating ? "Crafting…" : "Generate drafts from this idea"}
            </button>
          </div>

          {ideaBusy && !ideaResult && topic.trim() ? (
            <p className="idea-fit-pending" aria-live="polite">
              Checking if this works for {activeAudience}…
            </p>
          ) : null}

          {ideaResult && topic.trim() ? (
            <article
              className={`idea-fit-card verdict-${ideaResult.verdict}`}
              aria-live="polite"
            >
              <div className="trend-sug-top">
                <span className="trend-cat">
                  {ideaResult.verdict === "works"
                    ? "WORKS"
                    : ideaResult.verdict === "maybe"
                      ? "MAYBE"
                      : "WON’T WORK"}{" "}
                  · {ideaResult.targetAudience}
                </span>
                <span
                  className={`badge ${
                    ideaResult.verdict === "works"
                      ? "high"
                      : ideaResult.verdict === "maybe"
                        ? "medium"
                        : "low"
                  }`}
                >
                  fit {ideaResult.score}
                </span>
              </div>
              <p className="idea-fit-answer">{ideaResult.answer}</p>
              <p className="trend-angle">{ideaResult.summary}</p>
              {ideaResult.works.length > 0 && (
                <ul className="engage-tips idea-fit-list works">
                  {ideaResult.works.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              )}
              {ideaResult.risks.length > 0 && (
                <ul className="engage-tips idea-fit-list risks">
                  {ideaResult.risks.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              )}
              <p className="voice-blend-line">
                <strong>Stronger version:</strong> {ideaResult.rewrite}
              </p>
              <div className="image-btns">
                <button
                  type="button"
                  className="copy-post accent-outline"
                  onClick={() => applyTopic(ideaResult.rewrite)}
                >
                  Use stronger version
                </button>
                <button
                  type="button"
                  className="copy-post"
                  onClick={() =>
                    onCopy(
                      [
                        `Idea fit for ${report.name}`,
                        ideaResult.answer,
                        `Score: ${ideaResult.score} (${ideaResult.verdict})`,
                        `Audience: ${ideaResult.targetAudience}`,
                        ideaResult.summary,
                        ...ideaResult.works.map((w) => `✓ ${w}`),
                        ...ideaResult.risks.map((r) => `! ${r}`),
                        `Rewrite: ${ideaResult.rewrite}`,
                      ].join("\n"),
                    )
                  }
                >
                  Copy feedback
                </button>
              </div>
            </article>
          ) : null}

          <div className="examples-head">
            <h4 className="trend-feed-title">
              More examples for {activeAudience}
            </h4>
            <button
              type="button"
              className="copy-post"
              onClick={() => setShowAllExamples((v) => !v)}
            >
              {showAllExamples ? "Show fewer" : `Show more (${topicHints.length})`}
            </button>
          </div>
          <div className="hints topic-hints">
            {visibleHints.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => {
                  const base = selectedRef
                    ? `${prompt} referencing ${selectedRef.refId}`
                    : prompt;
                  setActiveTrend(null);
                  applyTopic(base);
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="studio-actions">
          <p className="voice-hint">
            Writing as <em>{selectedVoice.label}</em> · for{" "}
            <em>{activeAudience}</em>
            {mascotId !== "none" ? ` · mascot ${mascotId}/${mascotPose}` : ""}
            {selectedRef ? ` · ref ${selectedRef.refId}` : ""}
            {activeTrend ? ` · trend ${activeTrend.category}` : ""} ·{" "}
            {platformLabel(platform)}
          </p>
        </div>

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

        <ContentSchedule
          report={report}
          onCopy={onCopy}
          onUseSlot={(topicPrompt, slot) => {
            setPlatform(slot.platform);
            setActiveTrend(null);
            applyTopic(topicPrompt);
            setMascotPose(
              suggestMascotPose(topicPrompt, slot.platform, report.services ?? []),
            );
          }}
        />

        <ContentCalendar
          report={report}
          onCopy={onCopy}
          onUseIdea={(topicPrompt, idea) => {
            const plat =
              idea.platforms[0] === "LinkedIn"
                ? "linkedin"
                : idea.platforms[0] === "TikTok"
                  ? "tiktok"
                  : "instagram";
            setPlatform(plat);
            setActiveTrend(null);
            applyTopic(topicPrompt);
          }}
        />

        <TrendRadar
          report={report}
          onCopy={onCopy}
          onUseSuggestion={(topicPrompt, suggestion) => {
            let nextPlatform: ContentPlatform = platform;
            if (suggestion.platform === "tiktok" || suggestion.category === "tiktok") {
              nextPlatform = "tiktok";
            } else if (
              suggestion.platform === "instagram" ||
              suggestion.category === "instagram"
            ) {
              nextPlatform = "instagram";
            } else if (suggestion.platforms[0] === "LinkedIn") {
              nextPlatform = "linkedin";
            } else if (suggestion.category === "movie" || suggestion.category === "festival") {
              nextPlatform = "instagram";
            }
            setPlatform(nextPlatform);
            setActiveTrend(suggestion);
            if (suggestion.targetAudience) {
              setAudience(suggestion.targetAudience);
            }
            // Short creative brief — structured listening fields drive generation
            const shortTopic =
              suggestion.headline?.trim() ||
              suggestion.angle?.trim() ||
              suggestion.hookIdeas[0] ||
              topicPrompt;
            applyTopic(shortTopic);
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
      </form>

      {error && <div className="error">{error}</div>}

      {posts && (
        <>
          <div className="studio-actions image-actions">
            <p className="voice-hint">
              Post images use {report.name}’s palette in editorial layouts (cover / split /
              bands)
              {mascotId !== "none" ? ` · mascot ${mascotPose}` : ""}
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
                          {image.layout ? ` · ${image.layout} layout` : ""}
                          {post.referenceId ? ` · ${post.referenceId}` : ""}
                          {mascotId !== "none" ? ` · mascot ${mascotPose}` : ""}
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
