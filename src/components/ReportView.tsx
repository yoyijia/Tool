import type { BrandReport, ColorSwatch } from "../types";

interface Props {
  report: BrandReport;
  onCopy: (text: string) => void;
}

export function ReportView({ report, onCopy }: Props) {
  return (
    <div className="results-grid">
      <section className="panel span-2">
        <div className="report-head">
          <div className="domain">{report.domain}</div>
          <h2 className="name">{report.name}</h2>
          <p className="tagline">{report.tagline}</p>
          <div className="archetype">
            <i />
            Archetype · {report.archetype}
          </div>
        </div>
      </section>

      <section className="panel">
        <h3>Brand personality</h3>
        <p className="sub">Scored from on-page language patterns and messaging cues.</p>
        <div className="trait-list">
          {report.personality.map((t) => (
            <div className="trait" key={t.label} title={t.description}>
              <div className="label">{t.label}</div>
              <div className="track">
                <div className="fill" style={{ width: `${t.score}%` }} />
              </div>
              <div className="score">{t.score}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>Voice & tone</h3>
        <p className="sub">{report.voiceSummary}</p>
        <div className="dims">
          {report.voiceDimensions.map((d) => (
            <div className="dim" key={d.axis}>
              <div className="labels">
                <span>{d.left}</span>
                <span>{d.right}</span>
              </div>
              <div className="track">
                <div className="knob" style={{ left: `${d.value}%` }} />
              </div>
            </div>
          ))}
        </div>
        {report.keywords.length > 0 && (
          <div className="keywords">
            {report.keywords.map((k) => (
              <span key={k}>{k}</span>
            ))}
          </div>
        )}
      </section>

      <section className="panel span-2">
        <h3>Color palette</h3>
        <p className="sub">Extracted from theme-color, inline CSS, and stylesheet tokens. Click to copy.</p>
        <div className="palette">
          {report.palette.map((swatch) => (
            <SwatchButton key={swatch.hex + swatch.role} swatch={swatch} onCopy={onCopy} />
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>Social presence</h3>
        <p className="sub">Profiles linked from the reference site.</p>
        {report.socialProfiles.length === 0 ? (
          <p className="empty-social">No social links detected on the homepage crawl.</p>
        ) : (
          <div className="social-list">
            {report.socialProfiles.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
                <span>{s.platform}</span>
                <span className="handle">{s.handle ?? "Open"}</span>
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h3>Marketing trends</h3>
        <p className="sub">Inferred social strategy from platform mix, voice, and page signals.</p>
        <div className="trends">
          {report.trends.map((t) => (
            <article className="trend" key={t.title}>
              <div className="cat">{t.category}</div>
              <div className="top">
                <h4>{t.title}</h4>
                <span className={`badge ${t.confidence}`}>{t.confidence}</span>
              </div>
              <p>{t.insight}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function SwatchButton({
  swatch,
  onCopy,
}: {
  swatch: ColorSwatch;
  onCopy: (text: string) => void;
}) {
  return (
    <button
      type="button"
      className="swatch"
      onClick={() => onCopy(swatch.hex)}
      title={`Copy ${swatch.hex}`}
    >
      <div className="chip" style={{ background: swatch.hex }} />
      <div className="meta">
        <strong>{swatch.hex}</strong>
        <em>
          {swatch.name} · {swatch.role}
        </em>
      </div>
    </button>
  );
}
