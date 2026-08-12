import { useEffect, useState } from "react";
import type { BrandReport } from "../types";
import {
  gatherBrandIntel,
  type BrandIntel,
  type BrandMention,
} from "../lib/brandIntel";

interface Props {
  report: BrandReport;
  onCopy: (text: string) => void;
}

function MentionRow({ mention }: { mention: BrandMention }) {
  const body = (
    <>
      <span className="mention-title">
        {mention.safety !== "safe" && (
          <span
            className={`mention-flag ${mention.safety}`}
            title={
              mention.safety === "negative"
                ? "Bad news — don’t build content on this"
                : "Risky topic — avoid newsjacking"
            }
          >
            {mention.safety === "negative" ? "⚠ avoid" : "⚠ risky"}
          </span>
        )}
        {mention.title}
      </span>
      <span className="mention-meta">
        {mention.source}
        {mention.publishedAt
          ? ` · ${new Date(mention.publishedAt).toLocaleDateString()}`
          : ""}
      </span>
    </>
  );
  return mention.url ? (
    <a className="mention-row" href={mention.url} target="_blank" rel="noreferrer">
      {body}
    </a>
  ) : (
    <div className="mention-row">{body}</div>
  );
}

export function SocialIntel({ report, onCopy }: Props) {
  const [intel, setIntel] = useState<BrandIntel | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setBusy(true);
    setError(null);
    try {
      setIntel(await gatherBrandIntel(report));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load brand intelligence.",
      );
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    setIntel(null);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch per analyzed brand
  }, [report.domain, report.name]);

  function copyAll() {
    if (!intel) return;
    onCopy(
      [
        `Social intelligence · ${report.name} (${intel.query})`,
        intel.coverageNote,
        intel.facts ? `Facts (${intel.facts.source}): ${intel.facts.summary}` : null,
        "",
        "News mentions:",
        ...intel.newsMentions.map(
          (m) => `- ${m.title} (${m.source}${m.url ? ` · ${m.url}` : ""})`,
        ),
        "",
        "Social chatter:",
        ...intel.socialChatter.map(
          (m) => `- ${m.title} (${m.source}${m.url ? ` · ${m.url}` : ""})`,
        ),
        "",
        "Evidence for this analysis:",
        ...intel.evidence.map((e) => `- ${e}`),
      ]
        .filter((l): l is string => l !== null)
        .join("\n"),
    );
  }

  return (
    <section className="panel span-2" id="intel">
      <h3>Social intelligence</h3>
      <p className="sub">
        Live, linked data behind this profile — news mentions, social chatter, and
        public facts for <strong>{intel?.query ?? report.name}</strong>. Nothing here is
        invented; every line links to its source.
      </p>

      <div className="studio-actions">
        <p className="voice-hint" aria-live="polite">
          {busy
            ? "Pulling live mentions…"
            : intel
              ? intel.coverageNote
              : error ?? "Not loaded yet."}
        </p>
        <button
          type="button"
          className="generate-btn secondary-btn"
          disabled={busy}
          onClick={() => void load()}
        >
          {busy ? "Refreshing…" : "Refresh intel"}
        </button>
        {intel && (
          <button type="button" className="copy-post" onClick={copyAll}>
            Copy sourced summary
          </button>
        )}
      </div>

      {error && !busy && <div className="error">{error}</div>}

      {intel && (
        <div className="intel-grid">
          {intel.facts && (
            <article className="intel-block facts-block">
              <h4 className="trend-feed-title">Verified facts</h4>
              <p className="intel-facts">{intel.facts.summary}</p>
              <a
                className="source-line"
                href={intel.facts.url}
                target="_blank"
                rel="noreferrer"
              >
                Source: {intel.facts.source} ↗
              </a>
            </article>
          )}

          <article className="intel-block">
            <h4 className="trend-feed-title">
              News mentions ({intel.newsMentions.length})
            </h4>
            {intel.newsMentions.length ? (
              <div className="mention-list">
                {intel.newsMentions.map((m) => (
                  <MentionRow key={`${m.title}-${m.url}`} mention={m} />
                ))}
              </div>
            ) : (
              <p className="empty-social">
                No recent news mentions found for “{intel.query}”. That’s a real
                signal — earned media is an opportunity.
              </p>
            )}
          </article>

          <article className="intel-block">
            <h4 className="trend-feed-title">
              Social chatter ({intel.socialChatter.length})
            </h4>
            {intel.socialChatter.length ? (
              <div className="mention-list">
                {intel.socialChatter.map((m) => (
                  <MentionRow key={`${m.title}-${m.url}`} mention={m} />
                ))}
              </div>
            ) : (
              <p className="empty-social">
                No recent public threads found. Community content could own this
                space.
              </p>
            )}
          </article>

          <article className="intel-block evidence-block">
            <h4 className="trend-feed-title">What this analysis is based on</h4>
            <ul className="engage-tips evidence-list">
              {intel.evidence.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </article>
        </div>
      )}
    </section>
  );
}
