import { useMemo, useState } from "react";
import type { BrandReport, TrendSignal, TrendSuggestion } from "../types";
import { audienceLine } from "../lib/audience";
import { futureTrendsNote, suggestFutureTrends } from "../lib/futureTrends";
import { runSocialListening } from "../lib/socialListening";

interface Props {
  report: BrandReport;
  onUseSuggestion: (topicPrompt: string, suggestion: TrendSuggestion) => void;
  onCopy: (text: string) => void;
}

type Tab = "live" | "future" | "tiktok" | "instagram" | "other";

export function TrendRadar({ report, onUseSuggestion, onCopy }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<TrendSuggestion[] | null>(null);
  const [signals, setSignals] = useState<TrendSignal[] | null>(null);
  const [tiktokFeed, setTiktokFeed] = useState<TrendSignal[]>([]);
  const [instagramFeed, setInstagramFeed] = useState<TrendSignal[]>([]);
  const [liveFeed, setLiveFeed] = useState<TrendSignal[]>([]);
  const [fitById, setFitById] = useState<Record<string, number>>({});
  const [dataNote, setDataNote] = useState<string | null>(null);
  const [listenedAt, setListenedAt] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("live");
  const [selectedTrendId, setSelectedTrendId] = useState<string | null>(null);
  const [selectedFutureId, setSelectedFutureId] = useState<string | null>(null);

  const futureIdeas = useMemo(() => suggestFutureTrends(report), [report]);

  async function listen() {
    setBusy(true);
    setError(null);
    try {
      const result = await runSocialListening(report);
      setSuggestions(result.suggestions);
      setSignals(result.signals);
      setTiktokFeed(result.tiktokFeed);
      setInstagramFeed(result.instagramFeed);
      setLiveFeed(result.liveFeed);
      setFitById(result.fitById);
      setDataNote(result.dataNote);
      setListenedAt(result.listenedAt);
      // Open on best brand-matched TikTok/IG, not a random live spike
      const best =
        result.suggestions[0]?.trendId ||
        result.tiktokFeed[0]?.id ||
        result.instagramFeed[0]?.id ||
        result.liveFeed[0]?.id ||
        null;
      setSelectedTrendId(best);
      const bestSug = result.suggestions[0];
      setTab(
        bestSug?.platform === "instagram"
          ? "instagram"
          : bestSug?.platform === "tiktok"
            ? "tiktok"
            : result.tiktokFeed.length
              ? "tiktok"
              : "live",
      );
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
    () =>
      (signals ?? []).filter(
        (s) =>
          s.platform === "other" &&
          s.tag !== "live-sg" &&
          !/News SG|Trends SG/i.test(s.source),
      ),
    [signals],
  );

  const feed = useMemo(() => {
    if (tab === "live") return liveFeed;
    if (tab === "tiktok") return tiktokFeed;
    if (tab === "instagram") return instagramFeed;
    if (tab === "other") return otherFeed;
    return [];
  }, [tab, liveFeed, tiktokFeed, instagramFeed, otherFeed]);

  const selectedSignal = feed.find((s) => s.id === selectedTrendId) ?? feed[0] ?? null;

  const blendedLive = useMemo(() => {
    if (!suggestions || !selectedSignal) return null;
    return (
      suggestions.find((s) => s.trendId === selectedSignal.id) ||
      suggestions.find((s) => s.trendTitle === selectedSignal.title) ||
      null
    );
  }, [suggestions, selectedSignal]);

  const selectedFuture =
    futureIdeas.find((f) => f.id === selectedFutureId) ?? futureIdeas[0] ?? null;

  const activeBlend = tab === "future" ? selectedFuture : blendedLive;

  return (
    <fieldset className="studio-field">
      <legend>Trends · TikTok, Instagram & future bets</legend>
      <p className="platform-tip">
        For <strong>{report.name}</strong> ({audienceLine(report)}): refresh ranks
        TikTok/Reels by <strong>company fit</strong> first, then freshness — not a
        generic viral list.
      </p>

      <div className="studio-actions">
        <p className="voice-hint">
          {listenedAt
            ? `Updated ${new Date(listenedAt).toLocaleTimeString()} · Live ${liveFeed.length} · TT ${tiktokFeed.length} · IG ${instagramFeed.length}`
            : `${futureIdeas.length} future bets ready · load live SG + TikTok/IG anytime`}
        </p>
        <button
          type="button"
          className="generate-btn secondary-btn"
          disabled={busy}
          onClick={() => void listen()}
        >
          {busy ? "Refreshing…" : "Refresh live SG + TikTok/IG"}
        </button>
      </div>

      <p className="data-note" role="note">
        {tab === "future" ? futureTrendsNote() : dataNote || futureTrendsNote()}
      </p>

      {error && (
        <div className="error" style={{ marginTop: 10 }}>
          {error}
        </div>
      )}

      <div className="platform-row" style={{ marginTop: 12 }}>
        {(
          [
            ["live", `Live SG (${liveFeed.length})`],
            ["future", `Future bets (${futureIdeas.length})`],
            ["tiktok", `TikTok now (${tiktokFeed.length})`],
            ["instagram", `Reels now (${instagramFeed.length})`],
            ["other", `Search / calendar (${otherFeed.length})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`chip-btn${tab === id ? " active" : ""}`}
            onClick={() => {
              setTab(id);
              if (id === "future") {
                setSelectedFutureId(futureIdeas[0]?.id ?? null);
              } else {
                const next =
                  id === "live"
                    ? liveFeed[0]
                    : id === "tiktok"
                      ? tiktokFeed[0]
                      : id === "instagram"
                        ? instagramFeed[0]
                        : otherFeed[0];
                setSelectedTrendId(next?.id ?? null);
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="trend-split">
        <div className="trend-feed">
          <h4 className="trend-feed-title">
            {tab === "live"
              ? "Live Singapore · news & search (GST, Spider-Man, …)"
              : tab === "future"
                ? "Upcoming TikTok / Instagram format bets"
                : tab === "tiktok"
                  ? `TikTok ranked for ${report.name}`
                  : tab === "instagram"
                    ? `Reels ranked for ${report.name}`
                    : "Not TikTok/IG — search & calendar only"}
          </h4>
          <div className="trend-feed-list">
            {tab === "future"
              ? futureIdeas.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`trend-feed-item${selectedFuture?.id === s.id ? " active" : ""}`}
                    onClick={() => setSelectedFutureId(s.id)}
                  >
                    <span className="trend-rank">{i + 1}</span>
                    <span className="trend-feed-body">
                      <strong>{s.trendTitle}</strong>
                      <em>
                        {s.platform} · {s.timing === "this_week" ? "near-term" : "next wave"} ·
                        fit {s.fitScore}
                      </em>
                    </span>
                  </button>
                ))
              : feed.slice(0, 20).map((s, i) => (
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
                        fit {fitById[s.id] ?? "—"} · {s.source}
                      </em>
                    </span>
                  </button>
                ))}
            {tab !== "future" && feed.length === 0 && (
              <p className="empty-social">
                {tab === "live"
                  ? "Hit Refresh to pull GST vouchers, Spider-Man: Brand New Day, and other SG spikes."
                  : "Load roundups, or open Live SG / Future bets."}
              </p>
            )}
          </div>
        </div>

        <div className="trend-blend">
          <h4 className="trend-feed-title">Combine with {report.name}’s voice</h4>
          {activeBlend ? (
            <article className="trend-sug-card blend-card">
              <div className="trend-sug-top">
                <span className="trend-cat">
                  {tab === "future" ? "FUTURE BET" : activeBlend.platform.toUpperCase()} ·{" "}
                  {audienceLine(report)}
                </span>
                <span
                  className={`badge ${activeBlend.fitScore >= 70 ? "high" : activeBlend.fitScore >= 48 ? "medium" : "low"}`}
                >
                  fit {activeBlend.fitScore}
                </span>
              </div>
              <h4>{activeBlend.headline}</h4>
              {tab !== "future" && selectedSignal && (
                <p className="source-line">{selectedSignal.source}</p>
              )}
              <p className="voice-blend-line">{activeBlend.voiceBlend}</p>
              <p className="trend-angle">{activeBlend.angle}</p>
              {tab !== "future" && selectedSignal?.summary && (
                <p className="source-line">Trend context: {selectedSignal.summary}</p>
              )}
              <p className="trend-fit">{activeBlend.fitReason}</p>
              <div className="keywords post-tags">
                {activeBlend.platforms.map((p) => (
                  <span key={p}>{p}</span>
                ))}
                {(report.audiences ?? []).slice(0, 2).map((a) => (
                  <span key={a}>{a}</span>
                ))}
              </div>
              <ul className="engage-tips">
                {activeBlend.hookIdeas.slice(0, 3).map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
              <div className="image-btns">
                <button
                  type="button"
                  className="copy-post accent-outline"
                  onClick={() => onUseSuggestion(activeBlend.topicPrompt, activeBlend)}
                >
                  Use with brand voice
                </button>
                <button
                  type="button"
                  className="copy-post"
                  onClick={() =>
                    onCopy(
                      [
                        `${tab === "future" ? "Future trend" : "Trend"}: ${activeBlend.trendTitle}`,
                        `Brand: ${report.name} · ${report.archetype}`,
                        `Audiences: ${audienceLine(report)}`,
                        activeBlend.voiceBlend,
                        activeBlend.angle,
                        ...activeBlend.hookIdeas.map((h) => `• ${h}`),
                        `Prompt: ${activeBlend.topicPrompt}`,
                      ].join("\n"),
                    )
                  }
                >
                  Copy brief
                </button>
              </div>
            </article>
          ) : (
            <p className="empty-social">Select a trend on the left.</p>
          )}
        </div>
      </div>
    </fieldset>
  );
}
