import type { ChangeEvent } from "react";
import type { MascotId } from "../types";
import { MASCOT_OPTIONS } from "../lib/mascots";

interface Props {
  mascotId: MascotId;
  customName: string | null;
  onSelect: (id: MascotId) => void;
  onCustomFile: (file: File) => void;
}

export function MascotPicker({
  mascotId,
  customName,
  onSelect,
  onCustomFile,
}: Props) {
  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onSelect("custom");
    onCustomFile(file);
  }

  return (
    <fieldset className="studio-field">
      <legend>Mascot</legend>
      <p className="platform-tip">
        Choose a preset or upload a PNG/WebP — it’s baked into exported post images.
      </p>
      <div className="voice-grid mascot-grid">
        {MASCOT_OPTIONS.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`voice-card${mascotId === m.id ? " active" : ""}`}
            onClick={() => onSelect(m.id)}
            aria-pressed={mascotId === m.id}
          >
            <strong>{m.label}</strong>
            <span>
              {m.id === "custom" && customName
                ? `Using ${customName}`
                : m.blurb}
            </span>
          </button>
        ))}
      </div>
      {mascotId === "custom" && (
        <label className="upload-mascot">
          <input type="file" accept="image/png,image/webp,image/jpeg" onChange={onFile} />
          {customName ? `Replace · ${customName}` : "Upload mascot image"}
        </label>
      )}
    </fieldset>
  );
}
