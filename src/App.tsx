import { useEffect, useRef, useState, type FormEvent } from "react";
import { analyzeBrand } from "./lib/analyze";
import type { BrandReport } from "./types";
import { ReportView } from "./components/ReportView";

const SUGGESTIONS = [
  "activamedia.com.sg",
  "stripe.com",
  "notion.so",
  "figma.com",
  "nike.com",
];

const LOADING_STEPS = [
  "Reading the homepage…",
  "Detecting country & market…",
  "Scoring personality & voice…",
  "Finding audiences & services…",
  "Extracting the color palette…",
  "Almost there — building your report…",
];

const NAV_SECTIONS: { id: string; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "intel", label: "Intelligence" },
  { id: "create", label: "Create posts" },
  { id: "schedule", label: "Schedule" },
  { id: "trends", label: "Trends" },
  { id: "brand-kit", label: "Brand kit" },
];

export default function App() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<BrandReport | null>(null);
  const [copied, setCopied] = useState(false);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<HTMLDivElement | null>(null);

  function scrollToTop() {
    // The app scrolls inside .app (overflow-y: auto), not the window
    appRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Rotate loading messages so the wait feels alive
  useEffect(() => {
    if (!loading) {
      setLoadStep(0);
      return;
    }
    const timer = window.setInterval(
      () => setLoadStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)),
      1100,
    );
    return () => window.clearInterval(timer);
  }, [loading]);

  // Bring the report into view once ready
  useEffect(() => {
    if (report && !loading) {
      window.setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
  }, [report, loading]);

  async function runAnalyze(value: string) {
    const target = value.trim();
    if (!target) {
      setError("Enter a website name or URL.");
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const result = await analyzeBrand(target);
      setReport(result);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Analysis failed. Try another site or open as a Chrome extension for full access.";
      const blocked =
        /could not reach|fetch failed|502|blocked|jina/i.test(message);
      setError(
        blocked
          ? "That website blocked our fetch. Try another URL, or a simpler marketing homepage."
          : message,
      );
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void runAnalyze(input);
  }

  function onCopy(text: string) {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    });
  }

  function resetAnalysis() {
    setReport(null);
    setError(null);
    setInput("");
    scrollToTop();
  }

  function jumpTo(id: string) {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="app" ref={appRef}>
      <header className="brand-mark">
        <div className="orb" aria-hidden />
        <div>
          <h1>BrandVibe</h1>
          <span>Marketing intelligence extension</span>
        </div>
      </header>

      {!report && (
        <section className="hero">
          <h2>
            Decode any brand’s <em>vibe</em>
          </h2>
          <p>
            Paste a website. We detect the brand’s voice, audience, country, and live
            trends — then help you create posts that fit.
          </p>

          <form className="search" onSubmit={onSubmit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Website name or URL — e.g. activamedia.com.sg"
              aria-label="Website name or URL"
              autoFocus
            />
            <button type="submit" disabled={loading}>
              {loading ? "Reading…" : "Analyze"}
            </button>
          </form>

          <div className="hints">
            <span className="hints-label">Try:</span>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                disabled={loading}
                onClick={() => {
                  setInput(s);
                  void runAnalyze(s);
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <ol className="how-it-works" aria-label="How it works">
            <li>
              <strong>1 · Analyze</strong>
              <span>Paste any company website</span>
            </li>
            <li>
              <strong>2 · Review</strong>
              <span>Voice, audience, market & trends</span>
            </li>
            <li>
              <strong>3 · Create</strong>
              <span>Drafts, images & a posting schedule</span>
            </li>
          </ol>
        </section>
      )}

      {error && (
        <div className="error error-block" role="alert">
          <p>{error}</p>
          <button type="button" className="copy-post" onClick={() => void runAnalyze(input)}>
            Try again
          </button>
        </div>
      )}

      {loading && (
        <div className="loading">
          <div className="bars" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <p aria-live="polite">{LOADING_STEPS[loadStep]}</p>
          <div className="load-progress" aria-hidden>
            <div
              className="load-progress-fill"
              style={{
                width: `${Math.round(((loadStep + 1) / LOADING_STEPS.length) * 92)}%`,
              }}
            />
          </div>
        </div>
      )}

      {report && !loading && (
        <>
          <nav className="section-nav" aria-label="Report sections">
            <div className="section-nav-inner">
              <span className="section-nav-brand" title={report.name}>
                {report.name.length > 22
                  ? `${report.name.slice(0, 20)}…`
                  : report.name}
              </span>
              {NAV_SECTIONS.map((s) => (
                <button key={s.id} type="button" onClick={() => jumpTo(s.id)}>
                  {s.label}
                </button>
              ))}
              <button
                type="button"
                className="section-nav-reset"
                onClick={resetAnalysis}
              >
                ↺ New site
              </button>
            </div>
          </nav>
          <div ref={resultsRef}>
            <ReportView report={report} onCopy={onCopy} />
          </div>
          <button
            type="button"
            className="back-to-top"
            onClick={scrollToTop}
            aria-label="Back to top"
          >
            ↑ Top
          </button>
        </>
      )}

      <p className="footer-note">
        BrandVibe reads public HTML, meta tags, CSS color tokens, and linked social profiles.
        Load as a Chrome extension for CORS-free analysis of any site.
      </p>

      {copied && <div className="copied">Copied</div>}
    </div>
  );
}
