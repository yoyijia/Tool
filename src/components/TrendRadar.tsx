import { useMemo, useState } from "react";
import type { BrandReport, TrendSignal, TrendSuggestion } from "../types";
import { runSocialListening } from "../lib/socialListening";

interface Props {
  report: BrandReport;
  onUseSuggestion: (topicPrompt: string, suggestion: TrendSuggestion) => void;
  onCopy: (text: string) => void;
}

type Tab = "tiktok" | "instagram" | "all";

const CAT_LABEL: Record<TrendSignal["category"], string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  festival: "Festival",
  movie: "Movies / TV",
  sports: "Sports",
  news: "News",
  culture: "Culture",
  search: "Search spike",
};

export function TrendRadar({ report, onUseSuggestion, onCopy }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<TrendSuggestion[] | null>(null);
  const [signals, setSignals] = useState<TrendSignal[] | null>(null);
  const [tiktokFeed, setTiktokFeed] = useState<TrendSignal[]>([]);
  const [instagramFeed, setInstagramFeed] = useState<TrendSignal[]>([]);
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
      setListenedAt(result.listenedAt);
      setSelectedTrendId(result.tiktokFeed[0]?.id ?? result.suggestions[0]?.trendId ?? null);
      setTab("tiktok");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Social listening failed. Check connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  const feed = useMemo(() => {
    if (tab === "tiktok") return tiktokFeed;
    if (tab === "instagram") return instagramFeed;
    return signals ?? [];
  }, [tab, tiktokFeed, instagramFeed, signals]);

  const selectedSignal = feed.find((s) => s.id === selectedTrendId) ?? feed[0] ?? null;

  const blended = useMemo(() => {
    if (!suggestions || !selectedSignal) return null;
    return (
      suggestions.find((s) => s.trendId === selectedSignal.id) ||
      suggestions.find(
        (s) =>
          s.trendTitle.toLowerCase() === selectedSignal.title.toLowerCase() ||
          (tab === "tiktok" && s.platform === "tiktok") ||
          (tab === "instagram" && s.platform === "instagram"),
      ) ||
      suggestions[0] ||
      null
    );
  }, [suggestions, selectedSignal, tab]);

  const visibleSuggestions = useMemo(() => {
    if (!suggestions) return [];
    if (tab === "all") return suggestions;
    return suggestions.filter(
      (s) =>
        s.platform === tab ||
        s.category === tab ||
        (tab === "tiktok" && s.platforms.some((p) => /tiktok/i.test(p))) ||
        (tab === "instagram" && s.platforms.some((p) => /instagram/i.test(p))),
    );
  }, [suggestions, tab]);

  return (
    <fieldset className="studio-field">
      <legend>What’s trending · TikTok & Instagram</legend>
      <p className="platform-tip">
        Pull live TikTok and Instagram chatter, scan what’s hot, then combine it with{" "}
        <strong>{report.name}</strong>’s voice ({report.archetype}).
      </p>

      <div className="studio-actions">
        <p className="voice-hint">
          {listenedAt
            ? `Last listen ${new Date(listenedAt).toLocaleTimeString()} · TT ${tiktokFeed.length} · IG ${instagramFeed.length}`
            : "No listen yet — pull live platform data"}
        </p>
        <button
          type="button"
          className="generate-btn secondary-btn"
          disabled={busy}
          onClick={() => void listen()}
        >
          {busy ? "Pulling TikTok & IG…" : "Pull TikTok & Instagram trends"}
        </button>
      </div>

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
                ["instagram", `Instagram (${instagramFeed.length})`],
                ["all", `All signals (${signals?.length ?? 0})`],
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
                        : signals?.[0];
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
                Live on {tab === "all" ? "social" : tab === "tiktok" ? "TikTok" : "Instagram"}
              </h4>
              <div className="trend-feed-list">
                {feed.slice(0, 16).map((s, i) => (
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
                        {s.tag ? ` · ${s.tag}` : ""} · heat {s.heat}
                      </em>
                    </span>
                  </button>
                ))}
                {feed.length === 0 && (
                  <p className="empty-social">No live items in this tab — try All signals.</p>
                )}
              </div>
            </div>

            <div className="trend-blend">
              <h4 className="trend-feed-title">Combine with {report.name}’s voice</h4>
              {selectedSignal && blended ? (
                <article className="trend-sug-card blend-card">
                  <div className="trend-sug-top">
                    <span className="trend-cat">
                      {selectedSignal.platform === "cross"
                        ? "Cross-platform"
                        : selectedSignal.platform.toUpperCase()}{" "}
                      · {CAT_LABEL[selectedSignal.category]}
                    </span>
                    <span className={`badge ${blended.fitScore >= 70 ? "high" : "medium"}`}>
                      fit {blended.fitScore}
                    </span>
                  </div>
                  <h4>{blended.headline}</h4>
                  <p className="voice-blend-line">{blended.voiceBlend}</p>
                  <p className="trend-angle">{blended.angle}</p>
                  <p className="trend-fit">{blended.fitReason}</p>
                  <div className="keywords post-tags">
                    {blended.platforms.map((p) => (
                      <span key={p}>{p}</span>
                    ))}
                    <span>{blended.timing.replace("_", " ")}</span>
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
                            `Platform: ${selectedSignal.platform}`,
                            `Brand voice: ${report.archetype}`,
                            blended.voiceBlend,
                            blended.angle,
                            ...blended.hookIdeas.map((h) => `• ${h}`),
                            `Prompt: ${blended.topicPrompt}`,
                          ].join("\n"),
                        )
                      }
                    >
                      Copy brief
                    </button>
                  </div>
                </article>
              ) : (
                <p className="empty-social">Select a trend on the left to blend with brand voice.</p>
              )}
            </div>
          </div>

          {visibleSuggestions.length > 0 && (
            <>
              <h4 className="trend-feed-title" style={{ marginTop: 14 }}>
                More brand-fit angles
              </h4>
              <div className="trend-sug-grid">
                {visibleSuggestions.slice(0, 6).map((s) => (
                  <article key={s.id} className="trend-sug-card">
                    <div className="trend-sug-top">
                      <span className="trend-cat">
                        {s.platform} · {CAT_LABEL[s.category]}
                      </span>
                      <span className={`badge ${s.fitScore >= 70 ? "high" : "medium"}`}>
                        fit {s.fitScore}
                      </span>
                    </div>
                    <h4>{s.headline}</h4>
                    <p className="voice-blend-line">{s.voiceBlend}</p>
                    <div className="image-btns">
                      <button
                        type="button"
                        className="copy-post accent-outline"
                        onClick={() => onUseSuggestion(s.topicPrompt, s)}
                      >
                        Use with brand voice
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </fieldset>
  );
}
