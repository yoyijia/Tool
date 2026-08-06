import { useMemo, useState } from 'react'
import {
  buildPreviewMap,
  generateLocationAssets,
  packLocationSheet,
} from '../lib/locationAssets'
import { downloadCanvas, downloadJson } from '../lib/pixelate'
import type { LocationAsset, LocationTheme, RGB, TileSize } from '../types'
import { LOCATION_THEMES, TILE_SIZES } from '../types'

interface LocationStudioProps {
  palette: RGB[]
  useCustomPalette: boolean
}

export function LocationStudio({ palette, useCustomPalette }: LocationStudioProps) {
  const [theme, setTheme] = useState<LocationTheme>('market')
  const [tileSize, setTileSize] = useState<TileSize>(64)
  const [assets, setAssets] = useState<LocationAsset[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [busy, setBusy] = useState(false)

  const categories = useMemo(() => {
    const set = new Set(assets.map((a) => a.category))
    return ['all', ...set]
  }, [assets])

  const filtered = assets.filter(
    (a) => filter === 'all' || a.category === filter,
  )

  const thumbScale = tileSize === 512 ? 0.2 : tileSize === 128 ? 0.55 : 1.1

  const handleGenerate = () => {
    setBusy(true)
    requestAnimationFrame(() => {
      setTimeout(() => {
        const next = generateLocationAssets(
          theme,
          tileSize,
          useCustomPalette ? palette : undefined,
          Math.floor(Math.random() * 100000),
        )
        setAssets(next)
        setFilter('all')
        setBusy(false)
      }, 30)
    })
  }

  const handleExportSheet = () => {
    if (!assets.length) return
    const sheet = packLocationSheet(assets, tileSize >= 512 ? 4 : 8)
    downloadCanvas(sheet, `${theme}-tileset-${tileSize}px.png`)
    downloadJson(
      {
        theme,
        tileSize,
        style: 'pixel-art',
        modular: true,
        tiles: assets.map((a, i) => {
          const cols = tileSize >= 512 ? 4 : 8
          return {
            index: i,
            name: a.name,
            category: a.category,
            x: (i % cols) * tileSize,
            y: Math.floor(i / cols) * tileSize,
            width: tileSize,
            height: tileSize,
          }
        }),
      },
      `${theme}-tileset-${tileSize}px.json`,
    )
  }

  const handleExportMap = () => {
    if (!assets.length) return
    const map = buildPreviewMap(assets, 12, tileSize)
    downloadCanvas(map, `${theme}-preview-map.png`)
  }

  const previewMap = useMemo(() => {
    if (!assets.length) return null
    return buildPreviewMap(assets, 10, tileSize)
  }, [assets, tileSize])

  return (
    <section className="panel">
      <header className="panel-header">
        <div className="ludo-badge">Tilesets · pixel RPG assets</div>
        <h2>Modular Location Tiles</h2>
        <p>
          Supermarket shelves, produce, checkout, and world tiles — crisp pixel
          art at 64×64, 128×128, or 512×512.
        </p>
      </header>

      <div className="theme-grid">
        {LOCATION_THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`theme-card ${theme === t.id ? 'active' : ''}`}
            onClick={() => setTheme(t.id)}
          >
            <strong>{t.label}</strong>
            <span>{t.blurb}</span>
          </button>
        ))}
      </div>

      <div className="controls-grid">
        <label className="field">
          <span>Tile size</span>
          <select
            value={tileSize}
            onChange={(e) => setTileSize(Number(e.target.value) as TileSize)}
          >
            {TILE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}×{s}px
              </option>
            ))}
          </select>
        </label>
        <div className="field">
          <span>Palette</span>
          <p className="palette-note">
            {useCustomPalette
              ? 'Using palette from your style references'
              : 'Using built-in theme palette — add style refs to match your character sheet'}
          </p>
        </div>
      </div>

      <div className="action-row">
        <button
          type="button"
          className="primary-btn"
          disabled={busy}
          onClick={handleGenerate}
        >
          {busy ? 'Generating…' : 'Generate location assets'}
        </button>
        <button
          type="button"
          className="secondary-btn"
          disabled={!assets.length}
          onClick={handleExportSheet}
        >
          Download tileset
        </button>
        <button
          type="button"
          className="secondary-btn"
          disabled={!assets.length}
          onClick={handleExportMap}
        >
          Download map preview
        </button>
      </div>

      {assets.length > 0 && (
        <>
          <div className="chip-row">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                className={`chip ${filter === c ? 'on' : ''}`}
                onClick={() => setFilter(c)}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="location-layout">
            <div className="asset-grid">
              {filtered.map((asset) => (
                <figure key={asset.id} className="asset-card">
                  <canvas
                    width={asset.tileSize}
                    height={asset.tileSize}
                    ref={(node) => {
                      if (!node) return
                      const ctx = node.getContext('2d')!
                      ctx.imageSmoothingEnabled = true
                      ctx.clearRect(0, 0, asset.tileSize, asset.tileSize)
                      ctx.drawImage(asset.canvas, 0, 0)
                    }}
                    style={{
                      width: Math.max(64, asset.tileSize * thumbScale),
                      height: Math.max(64, asset.tileSize * thumbScale),
                    }}
                  />
                  <figcaption>
                    <strong>{asset.name}</strong>
                    <span>{asset.category} · {asset.tileSize}px</span>
                  </figcaption>
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() =>
                      downloadCanvas(
                        asset.canvas,
                        `${asset.theme}-${asset.name.toLowerCase().replace(/\s+/g, '-')}-${asset.tileSize}.png`,
                      )
                    }
                  >
                    PNG
                  </button>
                </figure>
              ))}
            </div>

            {previewMap && (
              <div className="map-preview">
                <h3>Modular preview</h3>
                <canvas
                  width={previewMap.width}
                  height={previewMap.height}
                  ref={(node) => {
                    if (!node) return
                    const ctx = node.getContext('2d')!
                    ctx.imageSmoothingEnabled = true
                    ctx.clearRect(0, 0, previewMap.width, previewMap.height)
                    ctx.drawImage(previewMap, 0, 0)
                  }}
                  style={{
                    width: Math.min(420, previewMap.width * 1.5),
                    height: 'auto',
                    maxWidth: '100%',
                  }}
                />
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}
