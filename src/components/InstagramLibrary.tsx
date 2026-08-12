import { useMemo, useState } from "react";
import type { BrandReport, InstagramPostRef } from "../types";
import { pullInstagramPosts, searchRefs } from "../lib/instagram";

interface Props {
  report: BrandReport;
  refs: InstagramPostRef[];
  selectedId: string | null;
  onChange: (refs: InstagramPostRef[]) => void;
  onSelect: (ref: InstagramPostRef | null) => void;
  onCopy: (text: string) => void;
}

export function InstagramLibrary({
  report,
  refs,
  selectedId,
  onChange,
  onSelect,
  onCopy,
}: Props) {
  const igProfile =
    report.socialProfiles.find((s) => s.platform === "Instagram")?.url ||
    report.socialProfiles.find((s) => s.platform === "Instagram")?.handle ||
    "";

  const [profile, setProfile] = useState(igProfile);
  const [postUrls, setPostUrls] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => searchRefs(refs, query), [refs, query]);

  async function pull() {
    setBusy(true);
    setError(null);
    try {
      const next = await pullInstagramPosts({
        profileOrHandle: profile.trim() || undefined,
        postUrls: postUrls
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
      });
      onChange(next);
      if (next[0]) onSelect(next[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not pull Instagram data.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <fieldset className="studio-field">
      <legend>Instagram references</legend>
      <p className="platform-tip">
        Pull public Instagram posts, then select one by its <strong>IG-XX</strong> code so drafts
        and images clearly cite what to reference.
      </p>

      <div className="ig-inputs">
        <label className="field-label">
          Profile or handle
          <input
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            placeholder="@stripe or https://instagram.com/stripe"
            aria-label="Instagram profile or handle"
          />
        </label>
        <label className="field-label">
          Post / reel URLs (one per line)
          <textarea
            value={postUrls}
            onChange={(e) => setPostUrls(e.target.value)}
            placeholder={"https://www.instagram.com/p/XXXX/\nhttps://www.instagram.com/reel/YYYY/"}
            rows={3}
            aria-label="Instagram post URLs"
          />
        </label>
      </div>

      <div className="studio-actions" style={{ marginTop: 8 }}>
        <p className="voice-hint">
          {refs.length
            ? `${refs.length} reference${refs.length === 1 ? "" : "s"} loaded`
            : "No references yet"}
        </p>
        <button
          type="button"
          className="generate-btn secondary-btn"
          disabled={busy}
          onClick={() => void pull()}
        >
          {busy ? "Pulling Instagram…" : "Pull Instagram posts"}
        </button>
      </div>

      {error && <div className="error" style={{ marginTop: 10 }}>{error}</div>}

      {refs.length > 0 && (
        <>
          <div className="ref-toolbar">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find by IG-02, caption, or shortcode…"
              aria-label="Search Instagram references"
            />
            <button
              type="button"
              className="copy-post"
              onClick={() => onSelect(null)}
              disabled={!selectedId}
            >
              Clear selection
            </button>
          </div>

          <div className="ref-grid">
            {filtered.map((ref) => {
              const active = selectedId === ref.refId;
              return (
                <button
                  key={ref.refId}
                  type="button"
                  className={`ref-card${active ? " active" : ""}`}
                  onClick={() => onSelect(active ? null : ref)}
                  aria-pressed={active}
                >
                  <div className="ref-card-top">
                    <span className="ref-id">{ref.refId}</span>
                    <span className="ref-author">{ref.author ?? "post"}</span>
                  </div>
                  {ref.thumbnailUrl ? (
                    <img
                      className="ref-thumb"
                      src={
                        `/api/fetch-image?url=${encodeURIComponent(ref.thumbnailUrl)}`
                      }
                      alt=""
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="ref-thumb placeholder">No preview</div>
                  )}
                  <p className="ref-caption">{ref.caption}</p>
                  <div className="ref-card-actions">
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Open
                    </a>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopy(ref.refId);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.stopPropagation();
                          onCopy(ref.refId);
                        }
                      }}
                    >
                      Copy {ref.refId}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </fieldset>
  );
}
