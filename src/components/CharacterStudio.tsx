import { useEffect, useMemo, useState } from 'react'
import {
  generateAllAnimations,
  packMultiAnimationSheet,
} from '../lib/characterAnimator'
import {
  buildEngineMeta,
  buildTexturePackerAtlas,
  downloadText,
  exportAnimationGif,
} from '../lib/exportPack'
import { MOTION_PRESETS, parseMotionPrompt } from '../lib/motionPrompt'
import { downloadCanvas, loadImage } from '../lib/pixelate'
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
  const [motionPrompt, setMotionPrompt] = useState(
    'idle, walk, run, jump — full character pack',
  )
  const [generated, setGenerated] = useState<GeneratedAnimation[]>([])
  const [previewType, setPreviewType] = useState<AnimationType>('idle')
  const [busy, setBusy] = useState(false)
  const [autoDone, setAutoDone] = useState(false)

  const selectedAnims = useMemo(
    () => parseMotionPrompt(motionPrompt),
    [motionPrompt],
  )

  const selected = useMemo(
    () => characters.find((c) => c.id === (selectedId ?? characters[0]?.id)),
    [characters, selectedId],
  )

  const preview = generated.find((g) => g.type === previewType) ?? generated[0] ?? null
  const previewScale = frameSize === 512 ? 1 : frameSize === 128 ? 2.5 : 3.5
  const thumbScale = frameSize === 512 ? 0.35 : frameSize === 128 ? 0.7 : 1.2

  const resolvePoses = async (character: CharacterAsset) => {
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

  const handleExportPack = async () => {
    if (!generated.length || !selected) return
    const base = slug(selected.name)
    const { canvas } = packMultiAnimationSheet(generated)
    const pngName = `${base}-spritesheet-${frameSize}.png`
    downloadCanvas(canvas, pngName)
    downloadText(
      JSON.stringify(buildTexturePackerAtlas(generated, pngName), null, 2),
      `${base}-atlas-${frameSize}.json`,
    )
    downloadText(
      JSON.stringify(buildEngineMeta(generated), null, 2),
      `${base}-meta-${frameSize}.json`,
    )
    if (preview) {
      await exportAnimationGif(preview, `${base}-${preview.type}-${frameSize}.gif`)
    }
  }

  const handleGenerateAll = () => {
    if (!characters.length) return
    setBusy(true)
    requestAnimationFrame(() => {
      setTimeout(async () => {
        for (const character of characters) {
          const results = await runGenerate(character)
          const { canvas } = packMultiAnimationSheet(results)
          const base = slug(character.name)
          const pngName = `${base}-spritesheet-${frameSize}.png`
          downloadCanvas(canvas, pngName)
          downloadText(
            JSON.stringify(buildTexturePackerAtlas(results, pngName), null, 2),
            `${base}-atlas-${frameSize}.json`,
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

  return (
    <section className="panel">
      <header className="panel-header">
        <div className="ludo-badge">Animate · Ludo.ai-style workflow</div>
        <h2>Animate Sprite</h2>
        <p>
          Upload or pick a starting frame, write a motion prompt, get an
          engine-ready spritesheet — same flow as{' '}
          <a href="https://ludo.ai/features/sprite-generator" target="_blank" rel="noreferrer">
            Ludo.ai
          </a>
          .
        </p>
      </header>

      <div className="steps-row">
        <div className="step on"><span>1</span> Starting frame</div>
        <div className="step on"><span>2</span> Motion prompt</div>
        <div className="step"><span>3</span> Export pack</div>
      </div>

      {sheetPreviewUrl && (
        <div className="sheet-banner">
          <div className="sheet-banner-copy">
            <strong>Starting frames ready</strong>
            <span>
              Embedded character sheet — Curly Hero · Red Cap · Backwards Cap
              (directional poses for walk cycles).
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
        label="Upload your own sprite"
        hint="Clean vector / chibi PNG works best — like Ludo’s Animate tab"
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

      <label className="field">
        <span>Motion prompt</span>
        <textarea
          className="prompt-box"
          rows={3}
          value={motionPrompt}
          onChange={(e) => setMotionPrompt(e.target.value)}
          placeholder='e.g. "walk cycle facing side" or "soft idle breathing"'
        />
      </label>

      <div className="field">
        <span>Presets</span>
        <div className="chip-row">
          {MOTION_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`chip ${motionPrompt === p.prompt ? 'on' : ''}`}
              onClick={() => setMotionPrompt(p.prompt)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="palette-note">
          Will generate:{' '}
          {selectedAnims.map((a) => ANIMATION_LABELS[a]).join(' · ')}
        </p>
      </div>

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
        <div className="field">
          <span>Export-ready for</span>
          <p className="palette-note">Unity · Godot · GameMaker · PNG + JSON atlas + GIF</p>
        </div>
      </div>

      <div className="action-row">
        <button
          type="button"
          className="primary-btn"
          disabled={!selected || !selectedAnims.length || busy}
          onClick={handleGenerate}
        >
          {busy ? 'Generating…' : 'Generate spritesheet'}
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
          onClick={() => void handleExportPack()}
        >
          Download export pack
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
              {selected?.name} · {frameSize}px spritesheet
            </h3>
            {generated.map((g) => (
              <div key={g.type} className="sheet-block">
                <div className="sheet-block-head">
                  <strong>{ANIMATION_LABELS[g.type]}</strong>
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() =>
                      downloadCanvas(
                        g.sheetCanvas,
                        `${slug(selected?.name ?? 'sprite')}-${g.type}-${frameSize}.png`,
                      )
                    }
                  >
                    PNG
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
