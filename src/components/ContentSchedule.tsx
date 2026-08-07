import { useEffect, useMemo, useState } from "react";
import type { BrandReport } from "../types";
import {
  buildMonthSchedule,
  scheduleSummary,
  type ScheduleSlot,
} from "../lib/contentSchedule";
import {
  fetchLiveCultureTrends,
  mergeLiveTrendsIntoSchedule,
  type LiveCultureTrend,
} from "../lib/liveCulture";

interface Props {
  report: BrandReport;
  onUseSlot: (topicPrompt: string, slot: ScheduleSlot) => void;
  onCopy: (text: string) => void;
}

function kindLabel(kind: ScheduleSlot["kind"]): string {
  switch (kind) {
    case "spotlight":
      return "Spotlight";
    case "observance":
      return "Moment";
    case "reel":
      return "Reel";
    case "trend":
      return "Live";
    default:
      return "Carousel";
  }
}

export function ContentSchedule({ report, onUseSlot, onCopy }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState<LiveCultureTrend[] | null>(null);
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);
  const from = useMemo(() => new Date(), []);

  const baseSlots = useMemo(() => buildMonthSchedule(report, from), [report, from]);

  const slots = useMemo(
    () => (live?.length ? mergeLiveTrendsIntoSchedule(baseSlots, live, report) : baseSlots),
    [baseSlots, live, report],
  );

  const monthLabel = from.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  async function refreshLive() {
    setBusy(true);
    setError(null);
    try {
      const next = await fetchLiveCultureTrends(report);
      setLive(next);
      setRefreshedAt(new Date().toISOString());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not refresh live SG trends. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  // Auto-load live SG trends once so GST / Spider-Man appear without an extra click
  useEffect(() => {
    void refreshLive();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only refresh for this brand
  }, [report.domain]);

  function copyAll() {
    const lines = [
      `${report.name} · ${monthLabel} content schedule (SGT)`,
      scheduleSummary(slots),
      refreshedAt
        ? `Live trends refreshed ${new Date(refreshedAt).toLocaleString()} · ${live?.length ?? 0} items`
        : "Live trends not refreshed yet — click Refresh live SG trends",
      "",
      ...slots.map(
        (s) =>
          `${s.date} ${s.postAt} SGT · ${s.platform.toUpperCase()} · ${s.title}\n` +
          `  Hook: ${s.hook}\n` +
          `  Format: ${s.format}${s.talent ? ` · Talent: ${s.talent}` : ""}\n` +
          `  When: ${s.engagementTip}\n` +
          `  Beats: ${s.slidesOrBeats.join(" · ")}`,
      ),
    ];
    onCopy(lines.join("\n\n"));
  }

  return (
    <fieldset className="studio-field">
      <legend>August schedule · live trends + carousels</legend>
      <p className="platform-tip">
        Refresh <strong>live Singapore trends</strong> (GST Vouchers, Spider-Man: Brand New
        Day, NDP, search spikes) into this calendar. Posts are angled for{" "}
        <strong>{report.name}</strong>. Times in SGT for peak engagement.
      </p>

      <div className="studio-actions schedule-actions">
        <p className="voice-hint">
          {scheduleSummary(slots)}
          {refreshedAt
            ? ` · live ${live?.length ?? 0} @ ${new Date(refreshedAt).toLocaleTimeString()}`
            : " · live trends not loaded"}
        </p>
        <button
          type="button"
          className="generate-btn secondary-btn"
          disabled={busy}
          onClick={() => void refreshLive()}
        >
          {busy ? "Refreshing live trends…" : "Refresh live SG trends"}
        </button>
        <button type="button" className="copy-post" onClick={copyAll}>
          Copy full schedule
        </button>
      </div>

      {error && (
        <div className="error" style={{ marginTop: 8 }}>
          {error}
        </div>
      )}

      {live && live.length > 0 && (
        <div className="live-trend-strip">
          <span className="live-pill">LIVE</span>
          {live.slice(0, 6).map((t) => (
            <button
              key={t.id}
              type="button"
              className="chip-btn"
              title={t.summary}
              onClick={() =>
                onUseSlot(
                  t.topicPrompt,
                  mergeLiveTrendsIntoSchedule(baseSlots, [t], report).find(
                    (s) => s.kind === "trend",
                  ) ?? slots[0]!,
                )
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div className="schedule-list">
        {slots.map((s) => (
          <article
            key={s.id}
            className={`schedule-card${s.kind === "spotlight" ? " spotlight" : ""}${s.kind === "trend" ? " live-trend" : ""}`}
          >
            <div className="schedule-card-top">
              <div>
                <strong>
                  {s.dayLabel} · {s.weekday}
                </strong>
                <span className="schedule-time">
                  {s.postAt} {s.timezone} · {s.platform}
                </span>
              </div>
              <span className={`schedule-kind kind-${s.kind}`}>{kindLabel(s.kind)}</span>
            </div>
            <h4>{s.title}</h4>
            <p className="schedule-hook">{s.hook}</p>
            <p className="trend-fit">
              {s.format}
              {s.serviceTag ? ` · ${s.serviceTag}` : ""}
              {s.talent ? ` · ${s.talent}` : ""}
            </p>
            <ul className="engage-tips">
              {s.slidesOrBeats.slice(0, 4).map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <p className="trend-fit">{s.whyNow}</p>
            <p className="source-line">{s.engagementTip}</p>
            <div className="image-btns">
              <button
                type="button"
                className="copy-post accent-outline"
                onClick={() => onUseSlot(s.topicPrompt, s)}
              >
                Use in studio
              </button>
              <button
                type="button"
                className="copy-post"
                onClick={() =>
                  onCopy(
                    [
                      `${s.date} @ ${s.postAt} ${s.timezone}`,
                      s.title,
                      s.hook,
                      s.format,
                      s.engagementTip,
                      ...s.slidesOrBeats.map((b) => `• ${b}`),
                      `Prompt: ${s.topicPrompt}`,
                    ].join("\n"),
                  )
                }
              >
                Copy post
              </button>
            </div>
          </article>
        ))}
      </div>
    </fieldset>
  );
}
