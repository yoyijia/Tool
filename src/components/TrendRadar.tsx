import { useMemo, useState } from "react";
import type { BrandReport, TrendSignal, TrendSuggestion } from "../types";
import { runSocialListening } from "../lib/socialListening";

interface Props {
  report: BrandReport;
  onUseSuggestion: (topicPrompt: string, suggestion: TrendSuggestion) => void;
  onCopy: (text: string) => void;
}

type Tab = "tiktok" | "instagram" | "other";

export function TrendRadar({ report, onUseSuggestion, onCopy }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<TrendSuggestion[] | null>(null);
  const [signals, setSignals] = useState<TrendSignal[] | null>(null);
  const [tiktokFeed, setTiktokFeed] = useState<TrendSignal[]>([]);
  const [instagramFeed, setInstagramFeed] = useState<TrendSignal[]>([]);
  const [dataNote, setDataNote] = useState<string | null>(null);
  const [listenedAt, setListenedAt] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("tiktok");
  const [selectedTrendId, setSelectedTrendId] = useState<string | null>(null);

  async function listen() {
    setBusy(true);
    setError(null);
    try {
      const result = await runSocialListening(report);
      setSuggestions(result.suggestions);
      setSignals(result.signals);
      setTiktokFeed(result.tiktokFeed);
      setInstagramFeed(result.instagramFeed);
      setDataNote(result.dataNote);
      setListenedAt(result.listenedAt);
      setSelectedTrendId(result.tiktokFeed[0]?.id ?? null);
      setTab("tiktok");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load trend roundups. Try again in a moment.",
      );
    } finally {
      setBusy(false);
    }
  }

  const otherFeed = useMemo(
    () => (signals ?? []).filter((s) => s.platform === "other"),
    [signals],
  );

  const feed = useMemo(() => {
    if (tab === "tiktok") return tiktokFeed;
    if (tab === "instagram") return instagramFeed;
    return otherFeed;
  }, [tab, tiktokFeed, instagramFeed, otherFeed]);

  const selectedSignal = feed.find((s) => s.id === selectedTrendId) ?? feed[0] ?? null;

  const blended = useMemo(() => {
    if (!suggestions || !selectedSignal) return null;
    return (
      suggestions.find((s) => s.trendId === selectedSignal.id) ||
      suggestions.find((s) => s.trendTitle === selectedSignal.title) ||
      null
    );
  }, [suggestions, selectedSignal]);

  return (
    <fieldset className="studio-field">
      <legend>What’s trending · TikTok & Instagram</legend>
      <p className="platform-tip">
        Load <strong>named trends from dated Later TikTok / Reels roundups</strong> (not live
        in-app charts), pick one, then adapt it in <strong>{report.name}</strong>’s voice (
        {report.archetype}).
      </p>

      <div className="studio-actions">
        <p className="voice-hint">
          {listenedAt
            ? `Loaded ${new Date(listenedAt).toLocaleTimeString()} · TT ${tiktokFeed.length} · IG ${instagramFeed.length}`
            : "Sources: Later Trends (dated) · Socialinsider backup"}
        </p>
        <button
          type="button"
          className="generate-btn secondary-btn"
          disabled={busy}
          onClick={() => void listen()}
        >
          {busy ? "Loading trend roundups…" : "Load TikTok & Instagram trends"}
        </button>
      </div>

      {dataNote && (
        <p className="data-note" role="note">
          {dataNote}
        </p>
      )}

      {error && (
        <div className="error" style={{ marginTop: 10 }}>
          {error}
        </div>
      )}

      {suggestions && (
        <>
          <div className="platform-row" style={{ marginTop: 12 }}>
            {(
              [
                ["tiktok", `TikTok (${tiktokFeed.length})`],
                ["instagram", `Instagram Reels (${instagramFeed.length})`],
                ["other", `Search / calendar (${otherFeed.length})`],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`chip-btn${tab === id ? " active" : ""}`}
                onClick={() => {
                  setTab(id);
                  const next =
                    id === "tiktok"
                      ? tiktokFeed[0]
                      : id === "instagram"
                        ? instagramFeed[0]
                        : otherFeed[0];
                  setSelectedTrendId(next?.id ?? null);
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="trend-split">
            <div className="trend-feed">
              <h4 className="trend-feed-title">
                {tab === "tiktok"
                  ? "TikTok trends (with source dates)"
                  : tab === "instagram"
                    ? "Instagram Reels trends (with source dates)"
                    : "Not TikTok/IG — search & calendar only"}
              </h4>
              <div className="trend-feed-list">
                {feed.slice(0, 20).map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`trend-feed-item${selectedSignal?.id === s.id ? " active" : ""}`}
                    onClick={() => setSelectedTrendId(s.id)}
                  >
                    <span className="trend-rank">{i + 1}</span>
                    <span className="trend-feed-body">
                      <strong>{s.title}</strong>
                      <em>
                        {s.source}
                        {s.url ? " · sourced roundup" : ""}
                      </em>
                    </span>
                  </button>
                ))}
                {feed.length === 0 && (
                  <p className="empty-social">Nothing in this tab from the latest pull.</p>
                )}
              </div>
            </div>

            <div className="trend-blend">
              <h4 className="trend-feed-title">Combine with {report.name}’s voice</h4>
              {selectedSignal && blended ? (
                <article className="trend-sug-card blend-card">
                  <div className="trend-sug-top">
                    <span className="trend-cat">
                      {selectedSignal.platform.toUpperCase()} · fit-checked
                    </span>
                    <span className={`badge ${blended.fitScore >= 70 ? "high" : "medium"}`}>
                      fit {blended.fitScore}
                    </span>
                  </div>
                  <h4>{blended.headline}</h4>
                  <p className="source-line">{selectedSignal.source}</p>
                  <p className="voice-blend-line">{blended.voiceBlend}</p>
                  <p className="trend-angle">{selectedSignal.summary}</p>
                  <p className="trend-fit">{blended.fitReason}</p>
                  <div className="keywords post-tags">
                    {blended.platforms.map((p) => (
                      <span key={p}>{p}</span>
                    ))}
                    {report.personality.slice(0, 2).map((p) => (
                      <span key={p.label}>{p.label}</span>
                    ))}
                  </div>
                  <ul className="engage-tips">
                    {blended.hookIdeas.slice(0, 3).map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                  <div className="image-btns">
                    <button
                      type="button"
                      className="copy-post accent-outline"
                      onClick={() => onUseSuggestion(blended.topicPrompt, blended)}
                    >
                      Use with brand voice
                    </button>
                    <button
                      type="button"
                      className="copy-post"
                      onClick={() =>
                        onCopy(
                          [
                            `Trend: ${selectedSignal.title}`,
                            `Source: ${selectedSignal.source}`,
                            selectedSignal.url ? `Link: ${selectedSignal.url}` : "",
                            `Brand: ${report.name} · ${report.archetype}`,
                            blended.voiceBlend,
                            selectedSignal.summary,
                            ...blended.hookIdeas.map((h) => `• ${h}`),
                            `Prompt: ${blended.topicPrompt}`,
                          ]
                            .filter(Boolean)
                            .join("\n"),
                        )
                      }
                    >
                      Copy brief
                    </button>
                    {selectedSignal.url && (
                      <a
                        className="copy-post"
                        href={selectedSignal.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open source
                      </a>
                    )}
                  </div>
                </article>
              ) : (
                <p className="empty-social">Select a dated trend on the left.</p>
              )}
            </div>
          </div>
        </>
      )}
    </fieldset>
  );
}
