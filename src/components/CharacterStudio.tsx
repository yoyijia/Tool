import { useMemo, useState } from 'react'
import {
  generateAllAnimations,
  packMultiAnimationSheet,
} from '../lib/characterAnimator'
import { downloadCanvas, downloadJson } from '../lib/pixelate'
import type {
  AnimationType,
  CharacterAsset,
  FrameSize,
  GeneratedAnimation,
  RGB,
} from '../types'
import { ANIMATION_LABELS } from '../types'
import { AnimationPreview } from './AnimationPreview'
import { UploadZone } from './UploadZone'

const ALL_ANIMS: AnimationType[] = [
  'idle',
  'walk',
  'run',
  'jump',
  'attack',
  'hurt',
  'celebrate',
]

interface CharacterStudioProps {
  characters: CharacterAsset[]
  palette: RGB[]
  onAdd: (files: File[]) => void
  onRemove: (id: string) => void
}

export function CharacterStudio({
  characters,
  palette,
  onAdd,
  onRemove,
}: CharacterStudioProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [frameSize, setFrameSize] = useState<FrameSize>(32)
  const [selectedAnims, setSelectedAnims] = useState<AnimationType[]>([
    'idle',
    'walk',
    'run',
    'jump',
  ])
  const [generated, setGenerated] = useState<GeneratedAnimation[]>([])
  const [previewType, setPreviewType] = useState<AnimationType>('idle')
  const [busy, setBusy] = useState(false)

  const selected = useMemo(
    () => characters.find((c) => c.id === (selectedId ?? characters[0]?.id)),
    [characters, selectedId],
  )

  const preview = generated.find((g) => g.type === previewType) ?? generated[0] ?? null

  const toggleAnim = (type: AnimationType) => {
    setSelectedAnims((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    )
  }

  const handleGenerate = () => {
    if (!selected || !selectedAnims.length) return
    setBusy(true)
    // Yield so UI can paint busy state
    requestAnimationFrame(() => {
      const results = generateAllAnimations(
        selected.image,
        selectedAnims,
        frameSize,
        palette,
      )
      setGenerated(results)
      setPreviewType(results[0]?.type ?? 'idle')
      setBusy(false)
    })
  }

  const handleExportSheet = () => {
    if (!generated.length || !selected) return
    const { canvas, meta } = packMultiAnimationSheet(generated)
    downloadCanvas(canvas, `${slug(selected.name)}-spritesheet.png`)
    downloadJson(
      {
        character: selected.name,
        style: 'nintendo-inspired-pixel',
        ...meta,
        animations: Object.fromEntries(
          generated.map((g, row) => [
            g.type,
            {
              row,
              frames: g.frames.length,
              fps: g.fps,
              frameWidth: g.frameSize,
              frameHeight: g.frameSize,
            },
          ]),
        ),
      },
      `${slug(selected.name)}-spritesheet.json`,
    )
  }

  const handleExportSingle = (anim: GeneratedAnimation) => {
    if (!selected) return
    downloadCanvas(
      anim.sheetCanvas,
      `${slug(selected.name)}-${anim.type}.png`,
    )
  }

  return (
    <section className="panel">
      <header className="panel-header">
        <h2>Character Animations</h2>
        <p>Upload a character, then generate idle, walk, and more as sprite sheets.</p>
      </header>

      <UploadZone
        label="Upload character art"
        hint="Single pose works best — front or side facing"
        multiple
        onFiles={onAdd}
      />

      {characters.length > 0 && (
        <div className="char-picker">
          {characters.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`char-thumb ${selected?.id === c.id ? 'active' : ''}`}
              onClick={() => setSelectedId(c.id)}
            >
              <img src={c.dataUrl} alt={c.name} />
              <span>{c.name}</span>
              <button
                type="button"
                className="thumb-remove"
                aria-label={`Remove ${c.name}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(c.id)
                  if (selectedId === c.id) setSelectedId(null)
                }}
              >
                ×
              </button>
            </button>
          ))}
        </div>
      )}

      <div className="controls-grid">
        <label className="field">
          <span>Frame size</span>
          <select
            value={frameSize}
            onChange={(e) => setFrameSize(Number(e.target.value) as FrameSize)}
          >
            {[16, 24, 32, 48, 64].map((s) => (
              <option key={s} value={s}>
                {s}×{s}px
              </option>
            ))}
          </select>
        </label>

        <div className="field field-span">
          <span>Animations</span>
          <div className="chip-row">
            {ALL_ANIMS.map((type) => (
              <button
                key={type}
                type="button"
                className={`chip ${selectedAnims.includes(type) ? 'on' : ''}`}
                onClick={() => toggleAnim(type)}
              >
                {ANIMATION_LABELS[type]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="action-row">
        <button
          type="button"
          className="primary-btn"
          disabled={!selected || !selectedAnims.length || busy}
          onClick={handleGenerate}
        >
          {busy ? 'Generating…' : 'Generate animations'}
        </button>
        <button
          type="button"
          className="secondary-btn"
          disabled={!generated.length}
          onClick={handleExportSheet}
        >
          Download sprite sheet
        </button>
      </div>

      {generated.length > 0 && (
        <div className="gen-results">
          <div className="preview-column">
            <div className="chip-row">
              {generated.map((g) => (
                <button
                  key={g.type}
                  type="button"
                  className={`chip ${previewType === g.type ? 'on' : ''}`}
                  onClick={() => setPreviewType(g.type)}
                >
                  {ANIMATION_LABELS[g.type]}
                </button>
              ))}
            </div>
            <AnimationPreview animation={preview} scale={frameSize <= 32 ? 5 : 3} />
          </div>

          <div className="sheet-column">
            <h3>Frames</h3>
            {generated.map((g) => (
              <div key={g.type} className="sheet-block">
                <div className="sheet-block-head">
                  <strong>{ANIMATION_LABELS[g.type]}</strong>
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => handleExportSingle(g)}
                  >
                    Export
                  </button>
                </div>
                <div className="frame-strip">
                  {g.frames.map((f) => (
                    <canvas
                      key={f.index}
                      width={g.frameSize}
                      height={g.frameSize}
                      ref={(node) => {
                        if (!node) return
                        const ctx = node.getContext('2d')!
                        ctx.imageSmoothingEnabled = false
                        ctx.clearRect(0, 0, g.frameSize, g.frameSize)
                        ctx.drawImage(f.canvas, 0, 0)
                      }}
                      style={{
                        width: Math.max(40, g.frameSize * 2),
                        height: Math.max(40, g.frameSize * 2),
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function slug(name: string): string {
  return name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase()
}
