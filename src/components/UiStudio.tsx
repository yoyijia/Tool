import { useMemo, useState } from 'react'
import { downloadCanvas, downloadJson } from '../lib/pixelate'
import {
  generateUiKit,
  packUiSheet,
  type UiAsset,
  type UiAssetCategory,
} from '../lib/uiAssets'
import type { FrameSize } from '../types'
import { FRAME_SIZES } from '../types'

const CATEGORIES: { id: 'all' | UiAssetCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'hud', label: 'HUD' },
  { id: 'button', label: 'Buttons' },
  { id: 'panel', label: 'Panels' },
  { id: 'icon', label: 'Icons' },
  { id: 'badge', label: 'Badges' },
]

export function UiStudio() {
  const [size, setSize] = useState<FrameSize>(128)
  const [assets, setAssets] = useState<UiAsset[]>([])
  const [filter, setFilter] = useState<'all' | UiAssetCategory>('all')
  const [busy, setBusy] = useState(false)

  const filtered = useMemo(
    () => (filter === 'all' ? assets : assets.filter((a) => a.category === filter)),
    [assets, filter],
  )

  const thumbScale = size === 512 ? 0.25 : size === 128 ? 0.7 : 1.4

  const handleGenerate = () => {
    setBusy(true)
    requestAnimationFrame(() => {
      setTimeout(() => {
        setAssets(generateUiKit({ size }))
        setFilter('all')
        setBusy(false)
      }, 20)
    })
  }

  const handleExport = () => {
    if (!assets.length) return
    const sheet = packUiSheet(assets, 4)
    downloadCanvas(sheet, `pixel-ui-kit-${size}px.png`)
    downloadJson(
      {
        style: 'classic-chibi-pixel',
        size,
        assets: assets.map((a, i) => ({
          index: i,
          name: a.name,
          category: a.category,
          x: (i % 4) * size,
          y: Math.floor(i / 4) * size,
          width: size,
          height: size,
        })),
      },
      `pixel-ui-kit-${size}px.json`,
    )
  }

  return (
    <section className="panel">
      <header className="panel-header">
        <div className="ludo-badge">UI Generator · pixel HUD & chrome</div>
        <h2>Pixel UI Kit</h2>
        <p>
          Generate game UI in the same classic chibi pixel style — basket HUD,
          action buttons, dialogs, hearts, coins, and badges.
        </p>
      </header>

      <div className="steps-row">
        <div className="step on"><span>1</span> Pick size</div>
        <div className="step on"><span>2</span> Generate kit</div>
        <div className="step"><span>3</span> Export sheet</div>
      </div>

      <div className="controls-grid">
        <label className="field">
          <span>UI asset size</span>
          <select
            value={size}
            onChange={(e) => setSize(Number(e.target.value) as FrameSize)}
          >
            {FRAME_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}×{s}px
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="action-row">
        <button
          type="button"
          className="primary-btn"
          disabled={busy}
          onClick={handleGenerate}
        >
          {busy ? 'Generating…' : 'Generate UI kit'}
        </button>
        <button
          type="button"
          className="secondary-btn"
          disabled={!assets.length}
          onClick={handleExport}
        >
          Download UI sheet
        </button>
      </div>

      {assets.length > 0 && (
        <>
          <div className="chip-row">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`chip ${filter === c.id ? 'on' : ''}`}
                onClick={() => setFilter(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="asset-grid">
            {filtered.map((a) => (
              <figure key={a.id} className="asset-card">
                <canvas
                  width={a.canvas.width}
                  height={a.canvas.height}
                  ref={(node) => {
                    if (!node) return
                    const ctx = node.getContext('2d')!
                    ctx.imageSmoothingEnabled = false
                    ctx.clearRect(0, 0, node.width, node.height)
                    ctx.drawImage(a.canvas, 0, 0)
                  }}
                  style={{
                    width: Math.max(64, a.size * thumbScale),
                    height: Math.max(64, a.size * thumbScale),
                    imageRendering: 'pixelated',
                  }}
                />
                <figcaption>
                  <strong>{a.name}</strong>
                  <span>{a.category}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
