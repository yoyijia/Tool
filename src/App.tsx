import { useState, type FormEvent } from "react";
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

export default function App() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<BrandReport | null>(null);
  const [copied, setCopied] = useState(false);

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
      setError(message);
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

  return (
    <div className="app">
      <header className="brand-mark">
        <div className="orb" aria-hidden />
        <div>
          <h1>BrandVibe</h1>
          <span>Marketing intelligence extension</span>
        </div>
      </header>

      <section className="hero">
        <h2>
          Decode any brand’s <em>vibe</em>
        </h2>
        <p>
          Drop a website name or URL. We extract personality, voice, color palette, and social
          marketing trends — then generate engagement drafts in the voice you choose.
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
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setInput(s);
                void runAnalyze(s);
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      {error && <div className="error">{error}</div>}

      {loading && (
        <div className="loading">
          <div className="bars" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <p>Pulling homepage signals, palette tokens, and social footprints…</p>
        </div>
      )}

      {report && !loading && <ReportView report={report} onCopy={onCopy} />}

      <p className="footer-note">
        BrandVibe reads public HTML, meta tags, CSS color tokens, and linked social profiles.
        Load as a Chrome extension for CORS-free analysis of any site.
      </p>

      {copied && <div className="copied">Copied</div>}
    </div>
  );
}
