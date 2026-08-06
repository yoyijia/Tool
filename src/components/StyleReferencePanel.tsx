import { rgbToHex } from '../lib/palette'
import type { RGB, StyleReference } from '../types'
import { UploadZone } from './UploadZone'

interface StyleReferencePanelProps {
  references: StyleReference[]
  activePalette: RGB[]
  onAdd: (files: File[]) => void
  onRemove: (id: string) => void
}

export function StyleReferencePanel({
  references,
  activePalette,
  onAdd,
  onRemove,
}: StyleReferencePanelProps) {
  return (
    <section className="panel">
      <header className="panel-header">
        <h2>Style References</h2>
        <p>
          Upload pixel RPG character or scene sheets (like FairPrice grocery art).
          We lock the outlined palette and shading for generation.
        </p>
      </header>

      <UploadZone
        label="Drop character / style art"
        hint="PNG, JPG, or WebP — pixel RPG / chibi sheets work best"
        multiple
        onFiles={onAdd}
      />

      {references.length > 0 && (
        <div className="ref-grid">
          {references.map((ref) => (
            <figure key={ref.id} className="ref-card">
              <img src={ref.dataUrl} alt={ref.name} />
              <figcaption>
                <span>{ref.name}</span>
                <button type="button" className="ghost-btn" onClick={() => onRemove(ref.id)}>
                  Remove
                </button>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <div className="palette-row">
        <span className="palette-label">Active palette</span>
        <div className="palette-swatches">
          {activePalette.map((c, i) => (
            <span
              key={`${c.r}-${c.g}-${c.b}-${i}`}
              className="swatch"
              style={{ background: rgbToHex(c) }}
              title={rgbToHex(c)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
