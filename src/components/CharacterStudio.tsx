import { useEffect, useMemo, useState } from 'react'
import {
  generateAllAnimations,
  packMultiAnimationSheet,
} from '../lib/characterAnimator'
import { downloadCanvas, downloadJson, loadImage } from '../lib/pixelate'
import type {
  AnimationType,
  CharacterAsset,
  FrameSize,
  GeneratedAnimation,
  RGB,
} from '../types'
import { ANIMATION_LABELS, FRAME_SIZES } from '../types'
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
  sheetPreviewUrl?: string | null
  autoGenerate?: boolean
  onAdd: (files: File[]) => void
  onRemove: (id: string) => void
}

export function CharacterStudio({
  characters,
  palette,
  sheetPreviewUrl,
  autoGenerate = false,
  onAdd,
  onRemove,
}: CharacterStudioProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [frameSize, setFrameSize] = useState<FrameSize>(128)
  const [selectedAnims, setSelectedAnims] = useState<AnimationType[]>([
    'idle',
    'walk',
    'run',
    'jump',
  ])
  const [generated, setGenerated] = useState<GeneratedAnimation[]>([])
  const [previewType, setPreviewType] = useState<AnimationType>('idle')
  const [busy, setBusy] = useState(false)
  const [autoDone, setAutoDone] = useState(false)

  const selected = useMemo(
    () => characters.find((c) => c.id === (selectedId ?? characters[0]?.id)),
    [characters, selectedId],
  )

  const preview = generated.find((g) => g.type === previewType) ?? generated[0] ?? null

  const previewScale = frameSize === 512 ? 1 : frameSize === 128 ? 2.5 : 3.5
  const thumbScale = frameSize === 512 ? 0.35 : frameSize === 128 ? 0.7 : 1.2

  const resolvePoses = async (
    character: CharacterAsset,
  ): Promise<Partial<Record<string, HTMLImageElement>>> => {
    if (!character.poses) return {}
    const out: Partial<Record<string, HTMLImageElement>> = {}
    await Promise.all(
      Object.entries(character.poses).map(async ([key, url]) => {
        if (!url) return
        out[key] = await loadImage(url)
      }),
    )
    return out
  }

  const runGenerate = async (character: CharacterAsset) => {
    const poses = await resolvePoses(character)
    return generateAllAnimations(
      character.image,
      selectedAnims,
      frameSize,
      palette,
      poses,
    )
  }

  const handleGenerate = () => {
    if (!selected || !selectedAnims.length) return
    setBusy(true)
    requestAnimationFrame(() => {
      setTimeout(() => {
        void runGenerate(selected).then((results) => {
          setGenerated(results)
          setPreviewType(results[0]?.type ?? 'idle')
          setBusy(false)
        })
      }, 30)
    })
  }

  // Auto-generate sprite sheet for the first embedded character
  useEffect(() => {
    if (!autoGenerate || autoDone || !characters.length || busy) return
    const first = characters[0]
    setSelectedId(first.id)
    setBusy(true)
    const timer = setTimeout(() => {
      void runGenerate(first).then((results) => {
        setGenerated(results)
        setPreviewType(results[0]?.type ?? 'idle')
        setBusy(false)
        setAutoDone(true)
      })
    }, 80)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGenerate, characters, autoDone])

  const handleExportSheet = () => {
    if (!generated.length || !selected) return
    const { canvas, meta } = packMultiAnimationSheet(generated)
    downloadCanvas(canvas, `${slug(selected.name)}-spritesheet-${frameSize}.png`)
    downloadJson(
      {
        character: selected.name,
        style: 'nintendo-clean-vector',
        frameSize,
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
      `${slug(selected.name)}-spritesheet-${frameSize}.json`,
    )
  }

  const handleExportSingle = (anim: GeneratedAnimation) => {
    if (!selected) return
    downloadCanvas(
      anim.sheetCanvas,
      `${slug(selected.name)}-${anim.type}-${frameSize}.png`,
    )
  }

  const handleGenerateAll = () => {
    if (!characters.length || !selectedAnims.length) return
    setBusy(true)
    requestAnimationFrame(() => {
      setTimeout(async () => {
        for (const character of characters) {
          const results = await runGenerate(character)
          const { canvas, meta } = packMultiAnimationSheet(results)
          downloadCanvas(
            canvas,
            `${slug(character.name)}-spritesheet-${frameSize}.png`,
          )
          downloadJson(
            {
              character: character.name,
              style: 'nintendo-clean-vector',
              frameSize,
              ...meta,
            },
            `${slug(character.name)}-spritesheet-${frameSize}.json`,
          )
          if (character.id === (selected?.id ?? characters[0].id)) {
            setGenerated(results)
            setPreviewType(results[0]?.type ?? 'idle')
          }
        }
        setBusy(false)
      }, 30)
    })
  }

  const toggleAnim = (type: AnimationType) => {
    setSelectedAnims((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    )
  }

  return (
    <section className="panel">
      <header className="panel-header">
        <h2>Character Animations</h2>
        <p>
          Your clean vector character sheet is loaded below. Pick a character and
          generate walk / idle sprite sheets — or generate all at once.
        </p>
      </header>

      {sheetPreviewUrl && (
        <div className="sheet-banner">
          <div className="sheet-banner-copy">
            <strong>Embedded character sheet</strong>
            <span>
              Curly Hero · Red Cap · Backwards Cap — directional poses included
              for better walk cycles.
            </span>
          </div>
          <img
            src={sheetPreviewUrl}
            alt="Character sprite sheet"
            className="sheet-preview-img"
          />
        </div>
      )}

      <UploadZone
        label="Or upload more character sprites"
        hint="Single pose or sheet — clean vector / chibi works best"
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
              onClick={() => {
                setSelectedId(c.id)
                setGenerated([])
                setAutoDone(true)
              }}
            >
              <img src={c.dataUrl} alt={c.name} />
              <span>{c.name}</span>
              {!c.id.startsWith('sheet-') && (
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
              )}
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
            {FRAME_SIZES.map((s) => (
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
          {busy ? 'Generating…' : 'Generate sprite sheet'}
        </button>
        <button
          type="button"
          className="secondary-btn"
          disabled={!characters.length || busy}
          onClick={handleGenerateAll}
        >
          Generate all characters
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
            <AnimationPreview animation={preview} scale={previewScale} />
          </div>

          <div className="sheet-column">
            <h3>
              {selected?.name} · {frameSize}px sprite sheet
            </h3>
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
                        ctx.imageSmoothingEnabled = true
                        ctx.clearRect(0, 0, g.frameSize, g.frameSize)
                        ctx.drawImage(f.canvas, 0, 0)
                      }}
                      style={{
                        width: Math.max(48, g.frameSize * thumbScale),
                        height: Math.max(48, g.frameSize * thumbScale),
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
