import { useMemo, useState } from "react";
import type { BrandReport } from "../types";
import {
  buildMonthSchedule,
  scheduleSummary,
  type ScheduleSlot,
} from "../lib/contentSchedule";

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
      return "Trend";
    default:
      return "Carousel";
  }
}

export function ContentSchedule({ report, onUseSlot, onCopy }: Props) {
  const [officeDog, setOfficeDog] = useState("Gucci");
  const from = useMemo(() => new Date(), []);

  const slots = useMemo(
    () => buildMonthSchedule(report, from, { officeDogName: officeDog.trim() || "Gucci" }),
    [report, from, officeDog],
  );

  const monthLabel = from.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  function copyAll() {
    const lines = [
      `${report.name} · ${monthLabel} content schedule (SGT)`,
      scheduleSummary(slots),
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
      <legend>August schedule · trends + carousels</legend>
      <p className="platform-tip">
        From today through end of {monthLabel}: moment/trend days when they exist, otherwise
        service carousels. <strong>Dog Day (26 Aug)</strong> stars{" "}
        <strong>{officeDog || "Gucci"}</strong>, the office dog — timed for peak IG + TikTok
        engagement (SGT).
      </p>

      <div className="studio-actions">
        <label className="dog-name-field">
          Office dog
          <input
            value={officeDog}
            onChange={(e) => setOfficeDog(e.target.value)}
            placeholder="Gucci"
            aria-label="Office dog name"
          />
        </label>
        <p className="voice-hint">{scheduleSummary(slots)}</p>
        <button type="button" className="generate-btn secondary-btn" onClick={copyAll}>
          Copy full schedule
        </button>
      </div>

      <div className="schedule-list">
        {slots.map((s) => (
          <article
            key={s.id}
            className={`schedule-card${s.kind === "spotlight" ? " spotlight" : ""}`}
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
