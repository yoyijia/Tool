import { useEffect, useMemo, useState } from 'react'
import {
  COLOR_PRESETS,
  composeCharacter,
  DEFAULT_LOADOUT,
  PART_OPTIONS,
  type CharacterLoadout,
  type PartSlot,
} from '../lib/characterParts'
import { canvasToDataUrl } from '../lib/pixelate'
import type { CharacterAsset } from '../types'

const SLOTS: { id: PartSlot; label: string }[] = [
  { id: 'hair', label: 'Hair' },
  { id: 'eyes', label: 'Eyes' },
  { id: 'hands', label: 'Hands' },
  { id: 'legs', label: 'Legs' },
  { id: 'shirt', label: 'Clothes · Top' },
  { id: 'pants', label: 'Clothes · Bottom' },
  { id: 'accessory', label: 'Accessory' },
]

interface CharacterBuilderProps {
  onAddToCharacters: (character: CharacterAsset) => void
}

export function CharacterBuilder({ onAddToCharacters }: CharacterBuilderProps) {
  const [loadout, setLoadout] = useState<CharacterLoadout>(DEFAULT_LOADOUT)
  const [activeSlot, setActiveSlot] = useState<PartSlot>('hair')
  const [name, setName] = useState('Custom Hero')

  const previewUrl = useMemo(() => {
    const canvas = composeCharacter(loadout, 256)
    return canvasToDataUrl(canvas)
  }, [loadout])

  // Previews for part chips
  const [chipUrls, setChipUrls] = useState<Record<string, string>>({})
  useEffect(() => {
    const next: Record<string, string> = {}
    for (const opt of PART_OPTIONS[activeSlot]) {
      const canvas = composeCharacter({ ...loadout, [activeSlot]: opt.id }, 96)
      next[opt.id] = canvasToDataUrl(canvas)
    }
    setChipUrls(next)
  }, [activeSlot, loadout])

  const setPart = (slot: PartSlot, id: string) => {
    setLoadout((prev) => ({ ...prev, [slot]: id }))
  }

  const handleAdd = async () => {
    const canvas = composeCharacter(loadout, 256)
    const dataUrl = canvasToDataUrl(canvas)
    const image = new Image()
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject()
      image.src = dataUrl
    })
    onAddToCharacters({
      id: `custom-${Date.now()}`,
      name: name.trim() || 'Custom Hero',
      dataUrl,
      image,
    })
  }

  return (
    <section className="panel">
      <header className="panel-header">
        <div className="ludo-badge">Character Builder · modular parts</div>
        <h2>Customize parts</h2>
        <p>
          Mix hair, eyes, hands, legs, and clothes — then add the character to
          Animate for centered spritesheets.
        </p>
      </header>

      <div className="builder-layout">
        <div className="builder-preview">
          <div className="preview-stage">
            <img src={previewUrl} alt="Character preview" className="builder-hero" />
            <div className="preview-meta">Centered · clean vector</div>
          </div>
          <label className="field">
            <span>Character name</span>
            <input
              className="text-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Custom Hero"
            />
          </label>
          <button type="button" className="primary-btn" onClick={() => void handleAdd()}>
            Add to Animate
          </button>
        </div>

        <div className="builder-controls">
          <div className="chip-row">
            {SLOTS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`chip ${activeSlot === s.id ? 'on' : ''}`}
                onClick={() => setActiveSlot(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="part-grid">
            {PART_OPTIONS[activeSlot].map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`part-card ${loadout[activeSlot] === opt.id ? 'active' : ''}`}
                onClick={() => setPart(activeSlot, opt.id)}
              >
                {chipUrls[opt.id] ? (
                  <img src={chipUrls[opt.id]} alt={opt.label} />
                ) : (
                  <span className="part-placeholder" />
                )}
                <strong>{opt.label}</strong>
              </button>
            ))}
          </div>

          <div className="color-sections">
            <ColorRow
              label="Skin"
              colors={COLOR_PRESETS.skin}
              value={loadout.skin}
              onChange={(c) => setLoadout((p) => ({ ...p, skin: c }))}
            />
            <ColorRow
              label="Hair"
              colors={COLOR_PRESETS.hair}
              value={loadout.hairColor}
              onChange={(c) => setLoadout((p) => ({ ...p, hairColor: c }))}
            />
            <ColorRow
              label="Top"
              colors={COLOR_PRESETS.shirt}
              value={loadout.shirtColor}
              onChange={(c) => setLoadout((p) => ({ ...p, shirtColor: c }))}
            />
            <ColorRow
              label="Bottom"
              colors={COLOR_PRESETS.pants}
              value={loadout.pantsColor}
              onChange={(c) => setLoadout((p) => ({ ...p, pantsColor: c }))}
            />
            <ColorRow
              label="Accessory"
              colors={COLOR_PRESETS.accessory}
              value={loadout.accessoryColor}
              onChange={(c) => setLoadout((p) => ({ ...p, accessoryColor: c }))}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function ColorRow({
  label,
  colors,
  value,
  onChange,
}: {
  label: string
  colors: string[]
  value: string
  onChange: (c: string) => void
}) {
  return (
    <div className="color-row">
      <span>{label}</span>
      <div className="palette-swatches">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            className={`swatch-btn ${value === c ? 'active' : ''}`}
            style={{ background: c }}
            aria-label={`${label} ${c}`}
            onClick={() => onChange(c)}
          />
        ))}
      </div>
    </div>
  )
}
