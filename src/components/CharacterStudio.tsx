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
import {
  generateRpgWalkSheet,
  generateVariantWalkSheet,
  HAIR_VARIANT_COLORS,
  SKIN_VARIANT_COLORS,
  WALK_DIRS,
  type DirectionalWalkSheet,
  type WalkDir,
} from '../lib/rpgWalkSheet'
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
    'walk cycle facing side, looping footsteps',
  )
  const [frameCount, setFrameCount] = useState(6)
  const [rpgMode, setRpgMode] = useState(false)
  const [variants, setVariants] = useState(false)
  const [generated, setGenerated] = useState<GeneratedAnimation[]>([])
  const [rpgSheet, setRpgSheet] = useState<DirectionalWalkSheet | null>(null)
  const [rpgDir, setRpgDir] = useState<WalkDir>('down')
  const [variantCanvas, setVariantCanvas] = useState<HTMLCanvasElement | null>(null)
  const [previewType, setPreviewType] = useState<AnimationType>('walk')
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

  const rpgPreviewAnim: GeneratedAnimation | null = useMemo(() => {
    if (!rpgSheet) return null
    const dirIndex = WALK_DIRS.indexOf(rpgDir)
    const row = rpgSheet.frames[dirIndex] ?? rpgSheet.frames[0]
    return {
      type: 'walk',
      frames: row.map((canvas, index) => ({ canvas, index })),
      frameSize: rpgSheet.frameSize as FrameSize,
      sheetCanvas: rpgSheet.sheetCanvas,
      fps: rpgSheet.fps,
    }
  }, [rpgSheet, rpgDir])

  const preview =
    rpgMode && rpgPreviewAnim
      ? rpgPreviewAnim
      : generated.find((g) => g.type === previewType) ?? generated[0] ?? null

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

  const runRpgGenerate = (character: CharacterAsset) => {
    const sheet = generateRpgWalkSheet({
      frameSize,
      frameCount,
      loadout: character.loadout,
    })
    setRpgSheet(sheet)
    setRpgDir('down')
    setGenerated([])
    if (variants) {
      const { canvas } = generateVariantWalkSheet(
        { frameSize, frameCount, loadout: character.loadout },
        HAIR_VARIANT_COLORS.slice(0, 4),
        [character.loadout?.skin ?? SKIN_VARIANT_COLORS[0], SKIN_VARIANT_COLORS[2]],
      )
      setVariantCanvas(canvas)
    } else {
      setVariantCanvas(null)
    }
    return sheet
  }

  const runGenerate = async (character: CharacterAsset) => {
    if (rpgMode) {
      runRpgGenerate(character)
      return [] as GeneratedAnimation[]
    }
    setRpgSheet(null)
    setVariantCanvas(null)
    const poses = await resolvePoses(character)
    return generateAllAnimations(
      character.image,
      selectedAnims,
      frameSize,
      palette,
      poses,
      frameCount,
      character.loadout,
    )
  }

  const handleGenerate = () => {
    if (!selected) return
    setBusy(true)
    requestAnimationFrame(() => {
      setTimeout(() => {
        void runGenerate(selected).then((results) => {
          if (!rpgMode) {
            setGenerated(results)
            setPreviewType(results[0]?.type ?? 'walk')
          }
          setBusy(false)
        })
      }, 30)
    })
  }

  useEffect(() => {
    if (!autoGenerate || autoDone || !characters.length || busy) return
    const preferred =
      characters.find((c) => c.id === 'sheet-explorer') ?? characters[0]
    setSelectedId(preferred.id)
    setBusy(true)
    const timer = setTimeout(() => {
      void runGenerate(preferred).then((results) => {
        if (!rpgMode) {
          setGenerated(results)
          setPreviewType(
            results.find((r) => r.type === 'walk')?.type ?? results[0]?.type ?? 'idle',
          )
        }
        setBusy(false)
        setAutoDone(true)
      })
    }, 80)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGenerate, characters, autoDone])

  const handleExportPack = async () => {
    if (!selected) return
    const base = slug(selected.name)

    if (rpgMode && rpgSheet) {
      downloadCanvas(rpgSheet.sheetCanvas, `${base}-rpg-4dir-${frameSize}.png`)
      downloadText(
        JSON.stringify(
          {
            character: selected.name,
            ...rpgSheet.meta,
            style: 'nintendo-clean-vector',
            note: 'Rows: down, left, right, up. Columns: walk frames.',
          },
          null,
          2,
        ),
        `${base}-rpg-4dir-${frameSize}.json`,
      )
      if (variantCanvas) {
        downloadCanvas(variantCanvas, `${base}-rpg-variants-${frameSize}.png`)
      }
      if (rpgPreviewAnim) {
        await exportAnimationGif(
          rpgPreviewAnim,
          `${base}-walk-${rpgDir}-${frameSize}.gif`,
        )
      }
      return
    }

    if (!generated.length) return
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
          if (rpgMode) {
            const sheet = generateRpgWalkSheet({
              frameSize,
              frameCount,
              loadout: character.loadout,
            })
            downloadCanvas(
              sheet.sheetCanvas,
              `${slug(character.name)}-rpg-4dir-${frameSize}.png`,
            )
            if (character.id === (selected?.id ?? characters[0].id)) {
              setRpgSheet(sheet)
            }
          } else {
            const results = await runGenerate(character)
            const { canvas } = packMultiAnimationSheet(results)
            downloadCanvas(
              canvas,
              `${slug(character.name)}-spritesheet-${frameSize}.png`,
            )
            if (character.id === (selected?.id ?? characters[0].id)) {
              setGenerated(results)
            }
          }
        }
        setBusy(false)
      }, 30)
    })
  }

  return (
    <section className="panel">
      <header className="panel-header">
        <div className="ludo-badge">Animate · clean vector Nintendo style</div>
        <h2>Animate Sprite</h2>
        <p>
          Flat chibi Nintendo look — soft shapes, blush, cel shade. Side-view
          walk cycles by default; optional 4-direction sheet stays vector too.
        </p>
      </header>

      <div className="steps-row">
        <div className="step on"><span>1</span> Character</div>
        <div className="step on"><span>2</span> Directions + frames</div>
        <div className="step"><span>3</span> Export sheet</div>
      </div>

      {sheetPreviewUrl && (
        <div className="sheet-banner">
          <div className="sheet-banner-copy">
            <strong>Starting frames ready</strong>
            <span>
              Pick a character (or Builder custom). Clean vector Nintendo style —
              not pixel crunch.
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
        hint="Or use Builder parts — hair/skin drive the variant sheets"
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
                setRpgSheet(null)
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

      <div className="mode-toggles">
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={rpgMode}
            onChange={(e) => {
              setRpgMode(e.target.checked)
              if (e.target.checked) {
                setFrameCount(8)
                setMotionPrompt('4-direction vector walk sheet, 8 frames')
              } else {
                setFrameCount(6)
                setMotionPrompt('walk cycle facing side, looping footsteps')
              }
            }}
          />
          <span>
            <strong>4-direction walk sheet</strong>
            <em>Still clean vector — rows: down · left · right · up</em>
          </span>
        </label>
        {rpgMode && (
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={variants}
              onChange={(e) => setVariants(e.target.checked)}
            />
            <span>
              <strong>Hair / skin variants</strong>
              <em>Pack multiple palette swaps side-by-side</em>
            </span>
          </label>
        )}
      </div>

      {!rpgMode && (
        <>
          <label className="field">
            <span>Motion prompt</span>
            <textarea
              className="prompt-box"
              rows={3}
              value={motionPrompt}
              onChange={(e) => setMotionPrompt(e.target.value)}
              placeholder='e.g. "walk cycle facing side"'
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
                  onClick={() => {
                    if (p.id === 'rpg4dir') {
                      setRpgMode(true)
                      setFrameCount(8)
                    }
                    setMotionPrompt(p.prompt)
                  }}
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
        </>
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
        <label className="field">
          <span>Frame count · {frameCount}</span>
          <input
            type="range"
            min={2}
            max={48}
            step={1}
            value={frameCount}
            onChange={(e) => setFrameCount(Number(e.target.value))}
          />
          <div className="frame-count-row">
            {[4, 6, 8, 12, 16, 24, 32, 48].map((n) => (
              <button
                key={n}
                type="button"
                className={`chip ${frameCount === n ? 'on' : ''}`}
                onClick={() => setFrameCount(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </label>
        <div className="field">
          <span>Framing</span>
          <p className="palette-note">Centered in every cell</p>
        </div>
        <div className="field">
          <span>Layout</span>
          <p className="palette-note">
            {rpgMode
              ? `${frameCount} cols × 4 rows (down/left/right/up)`
              : 'Row per animation'}
          </p>
        </div>
      </div>

      <div className="action-row">
        <button
          type="button"
          className="primary-btn"
          disabled={!selected || busy}
          onClick={handleGenerate}
        >
          {busy
            ? 'Generating…'
            : rpgMode
              ? 'Generate 4-dir walk sheet'
              : 'Generate spritesheet'}
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
          disabled={rpgMode ? !rpgSheet : !generated.length}
          onClick={() => void handleExportPack()}
        >
          Download export pack
        </button>
      </div>

      {rpgMode && rpgSheet && (
        <div className="gen-results">
          <div className="preview-column">
            <div className="chip-row dir-chips">
              {WALK_DIRS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`chip ${rpgDir === d ? 'on' : ''}`}
                  onClick={() => setRpgDir(d)}
                >
                  {d}
                </button>
              ))}
            </div>
            <AnimationPreview animation={rpgPreviewAnim} scale={previewScale} />
          </div>
          <div className="sheet-column">
            <h3>
              {selected?.name} · vector 4-dir · {frameCount} frames
            </h3>
            <div className="rpg-sheet-preview">
              <canvas
                width={rpgSheet.sheetCanvas.width}
                height={rpgSheet.sheetCanvas.height}
                ref={(node) => {
                  if (!node) return
                  const ctx = node.getContext('2d')!
                  ctx.imageSmoothingEnabled = true
                  ctx.clearRect(0, 0, node.width, node.height)
                  ctx.drawImage(rpgSheet.sheetCanvas, 0, 0)
                }}
                style={{
                  width: '100%',
                  maxWidth: 640,
                  height: 'auto',
                  imageRendering: 'auto',
                }}
              />
              <p className="palette-note">
                Rows: down → left → right → up · Columns: walk frames
              </p>
            </div>
            {variantCanvas && (
              <div className="rpg-sheet-preview">
                <h3>Hair / skin variants</h3>
                <canvas
                  width={variantCanvas.width}
                  height={variantCanvas.height}
                  ref={(node) => {
                    if (!node) return
                    const ctx = node.getContext('2d')!
                    ctx.imageSmoothingEnabled = true
                    ctx.clearRect(0, 0, node.width, node.height)
                    ctx.drawImage(variantCanvas, 0, 0)
                  }}
                  style={{
                    width: '100%',
                    maxWidth: 720,
                    height: 'auto',
                    imageRendering: 'auto',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {!rpgMode && generated.length > 0 && (
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
