import { useMemo, useState } from "react";
import type { BrandReport } from "../types";
import {
  buildObservanceIdea,
  daysWithObservances,
  type FitLevel,
  type Observance,
  type ObservanceIdea,
} from "../lib/observances";

interface Props {
  report: BrandReport;
  onUseIdea: (topicPrompt: string, idea: ObservanceIdea) => void;
  onCopy: (text: string) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function fitClass(fit: FitLevel): string {
  if (fit === "high") return "high";
  if (fit === "medium") return "medium";
  return "low";
}

export function ContentCalendar({ report, onUseIdea, onCopy }: Props) {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth() + 1; // 1-12

  const byDay = useMemo(() => daysWithObservances(month), [month]);

  /** Best fit level per calendar day in the visible month */
  const bestFitByDay = useMemo(() => {
    const map = new Map<number, FitLevel>();
    for (const [day, items] of byDay) {
      let best: FitLevel = "low";
      for (const o of items) {
        const fit = buildObservanceIdea(report, o, year).fit;
        if (fit === "high") {
          best = "high";
          break;
        }
        if (fit === "medium") best = "medium";
      }
      map.set(day, best);
    }
    return map;
  }, [byDay, report, year]);

  const monthLabel = cursor.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const grid = useMemo(() => {
    const firstDow = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  const dayObservances = byDay.get(selectedDay) ?? [];

  const ideas = useMemo(
    () => dayObservances.map((o) => buildObservanceIdea(report, o, year)),
    [dayObservances, report, year],
  );

  const selectedIdea =
    ideas.find((i) => i.observance.id === selectedId) ?? ideas[0] ?? null;

  function selectDay(day: number) {
    setSelectedDay(day);
    const first = byDay.get(day)?.[0];
    setSelectedId(first?.id ?? null);
  }

  function shiftMonth(delta: number) {
    const next = new Date(year, month - 1 + delta, 1);
    setCursor(next);
    const nextMonth = next.getMonth() + 1;
    const map = daysWithObservances(nextMonth);
    const preferred =
      next.getFullYear() === today.getFullYear() &&
      nextMonth === today.getMonth() + 1
        ? today.getDate()
        : [...map.keys()].sort((a, b) => a - b)[0] ?? 1;
    setSelectedDay(preferred);
    setSelectedId(map.get(preferred)?.[0]?.id ?? null);
  }

  function jumpToday() {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(today.getDate());
    const items = daysWithObservances(today.getMonth() + 1).get(today.getDate());
    setSelectedId(items?.[0]?.id ?? null);
  }

  const isToday = (day: number) =>
    day === today.getDate() &&
    month === today.getMonth() + 1 &&
    year === today.getFullYear();

  return (
    <fieldset className="studio-field">
      <legend>Content calendar · national & international days</legend>
      <p className="platform-tip">
        Browse observances like <strong>National Tell a Joke Day</strong>, click a date,
        then see how <strong>{report.name}</strong> can use it — low-fit days are tagged so
        you can skip them.
      </p>

      <div className="cal-layout">
        <div className="cal-month">
          <div className="cal-nav">
            <button type="button" className="copy-post" onClick={() => shiftMonth(-1)}>
              ←
            </button>
            <div className="cal-nav-label">
              <strong>{monthLabel}</strong>
              <button type="button" className="chip-btn" onClick={jumpToday}>
                Today
              </button>
            </div>
            <button type="button" className="copy-post" onClick={() => shiftMonth(1)}>
              →
            </button>
          </div>

          <div className="cal-weekdays">
            {WEEKDAYS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>

          <div className="cal-grid" role="grid" aria-label={monthLabel}>
            {grid.map((day, idx) => {
              if (day == null) {
                return <div key={`e-${idx}`} className="cal-cell empty" />;
              }
              const items = byDay.get(day) ?? [];
              const active = day === selectedDay;
              const best = bestFitByDay.get(day) ?? null;

              return (
                <button
                  key={day}
                  type="button"
                  className={`cal-cell${active ? " active" : ""}${isToday(day) ? " today" : ""}${items.length ? " has-events" : ""}`}
                  onClick={() => selectDay(day)}
                  aria-pressed={active}
                  aria-label={`${month}/${day}${items.length ? `, ${items.length} observances` : ""}`}
                >
                  <span className="cal-day-num">{day}</span>
                  {items.length > 0 && (
                    <span className={`cal-dots fit-${best}`}>
                      {items.slice(0, 3).map((o: Observance) => (
                        <i key={o.id} title={o.title} />
                      ))}
                      {items.length > 3 && <em>+{items.length - 3}</em>}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <p className="cal-legend">
            <span className="fit-pip high" /> high fit
            <span className="fit-pip medium" /> medium
            <span className="fit-pip low" /> low — usually skip
          </p>
        </div>

        <div className="cal-detail">
          <h4 className="trend-feed-title">
            {new Date(year, month - 1, selectedDay).toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h4>

          {ideas.length === 0 ? (
            <p className="empty-social">
              No listed national/international days on this date. Pick a dotted day on
              the calendar.
            </p>
          ) : (
            <>
              <div className="cal-day-list">
                {ideas.map((idea) => (
                  <button
                    key={idea.observance.id}
                    type="button"
                    className={`trend-feed-item${selectedIdea?.observance.id === idea.observance.id ? " active" : ""}`}
                    onClick={() => setSelectedId(idea.observance.id)}
                  >
                    <span className={`badge ${fitClass(idea.fit)}`}>{idea.fit}</span>
                    <span className="trend-feed-body">
                      <strong>{idea.observance.title}</strong>
                      <em>
                        {idea.observance.kind} · fit {idea.fitScore}
                      </em>
                    </span>
                  </button>
                ))}
              </div>

              {selectedIdea && (
                <article className="trend-sug-card blend-card cal-idea-card">
                  <div className="trend-sug-top">
                    <span className="trend-cat">{selectedIdea.observance.kind}</span>
                    <span className={`badge ${fitClass(selectedIdea.fit)}`}>
                      {selectedIdea.fit} · {selectedIdea.fitScore}
                    </span>
                  </div>
                  <h4>{selectedIdea.observance.title}</h4>
                  <p className="source-line">{selectedIdea.dateLabel}</p>
                  <p className="trend-angle">{selectedIdea.angle}</p>
                  <p className="trend-fit">{selectedIdea.fitReason}</p>
                  <div className="keywords post-tags">
                    {selectedIdea.platforms.map((p) => (
                      <span key={p}>{p}</span>
                    ))}
                    {selectedIdea.observance.themes.slice(0, 4).map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                  <ul className="engage-tips">
                    {selectedIdea.hooks.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                  <div className="image-btns">
                    <button
                      type="button"
                      className="copy-post accent-outline"
                      onClick={() =>
                        onUseIdea(selectedIdea.topicPrompt, selectedIdea)
                      }
                    >
                      {selectedIdea.fit === "low"
                        ? "Use anyway (low fit)"
                        : "Use for content"}
                    </button>
                    <button
                      type="button"
                      className="copy-post"
                      onClick={() =>
                        onCopy(
                          [
                            `${selectedIdea.observance.title} · ${selectedIdea.dateLabel}`,
                            `Fit: ${selectedIdea.fit} (${selectedIdea.fitScore})`,
                            selectedIdea.fitReason,
                            selectedIdea.angle,
                            ...selectedIdea.hooks.map((h) => `• ${h}`),
                            `Prompt: ${selectedIdea.topicPrompt}`,
                          ].join("\n"),
                        )
                      }
                    >
                      Copy brief
                    </button>
                  </div>
                </article>
              )}
            </>
          )}
        </div>
      </div>
    </fieldset>
  );
}
