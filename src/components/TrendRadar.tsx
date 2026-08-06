import { useState } from "react";
import type { BrandReport, TrendSignal, TrendSuggestion } from "../types";
import { runSocialListening } from "../lib/socialListening";

interface Props {
  report: BrandReport;
  onUseSuggestion: (topicPrompt: string, suggestion: TrendSuggestion) => void;
  onCopy: (text: string) => void;
}

const CAT_LABEL: Record<TrendSignal["category"], string> = {
  tiktok: "TikTok",
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
  const [listenedAt, setListenedAt] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | TrendSignal["category"]>("all");

  async function listen() {
    setBusy(true);
    setError(null);
    try {
      const result = await runSocialListening(report);
      setSuggestions(result.suggestions);
      setSignals(result.signals);
      setListenedAt(result.listenedAt);
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

  const visible =
    suggestions?.filter((s) => (filter === "all" ? true : s.category === filter)) ?? [];

  const signalPreview = (signals ?? []).slice(0, 10);

  return (
    <fieldset className="studio-field">
      <legend>Social listening · trend radar</legend>
      <p className="platform-tip">
        Pull what’s moving now — TikTok formats, Google search spikes, entertainment headlines,
        sports chatter, and seasonal festivals — then get brand-fit content suggestions for{" "}
        {report.name}.
      </p>

      <div className="studio-actions">
        <p className="voice-hint">
          {listenedAt
            ? `Last listen ${new Date(listenedAt).toLocaleTimeString()} · ${signals?.length ?? 0} signals`
            : "No listen yet"}
        </p>
        <button
          type="button"
          className="generate-btn secondary-btn"
          disabled={busy}
          onClick={() => void listen()}
        >
          {busy ? "Listening…" : "Listen to trends"}
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
            <button
              type="button"
              className={`chip-btn${filter === "all" ? " active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            {(
              ["tiktok", "festival", "movie", "sports", "search", "news", "culture"] as const
            ).map((c) => (
              <button
                key={c}
                type="button"
                className={`chip-btn${filter === c ? " active" : ""}`}
                onClick={() => setFilter(c)}
              >
                {CAT_LABEL[c]}
              </button>
            ))}
          </div>

          {signalPreview.length > 0 && (
            <div className="trend-signal-strip" aria-label="Live signals">
              {signalPreview.map((s) => (
                <span key={s.id} className="trend-signal-chip" title={s.summary}>
                  <em>{CAT_LABEL[s.category]}</em> {s.title}
                </span>
              ))}
            </div>
          )}

          <div className="trend-sug-grid">
            {visible.map((s) => (
              <article key={s.id} className="trend-sug-card">
                <div className="trend-sug-top">
                  <span className="trend-cat">{CAT_LABEL[s.category]}</span>
                  <span className={`badge ${s.fitScore >= 70 ? "high" : "medium"}`}>
                    fit {s.fitScore}
                  </span>
                </div>
                <h4>{s.headline}</h4>
                <p className="trend-angle">{s.angle}</p>
                <p className="trend-fit">{s.fitReason}</p>
                <div className="keywords post-tags">
                  {s.platforms.map((p) => (
                    <span key={p}>{p}</span>
                  ))}
                  <span>{s.timing.replace("_", " ")}</span>
                </div>
                <ul className="engage-tips">
                  {s.hookIdeas.slice(0, 2).map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
                <div className="image-btns">
                  <button
                    type="button"
                    className="copy-post accent-outline"
                    onClick={() => onUseSuggestion(s.topicPrompt, s)}
                  >
                    Use in studio
                  </button>
                  <button
                    type="button"
                    className="copy-post"
                    onClick={() =>
                      onCopy(
                        [
                          s.headline,
                          s.angle,
                          ...s.hookIdeas.map((h) => `• ${h}`),
                          `Prompt: ${s.topicPrompt}`,
                        ].join("\n"),
                      )
                    }
                  >
                    Copy brief
                  </button>
                </div>
              </article>
            ))}
            {visible.length === 0 && (
              <p className="empty-social">No suggestions in this filter — try All.</p>
            )}
          </div>
        </>
      )}
    </fieldset>
  );
}
