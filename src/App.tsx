import { useEffect, useMemo, useState } from 'react'
import { CharacterStudio } from './components/CharacterStudio'
import { LocationStudio } from './components/LocationStudio'
import { StyleReferencePanel } from './components/StyleReferencePanel'
import { createDemoCharacter } from './lib/demoCharacter'
import {
  extractPaletteFromImage,
  mergePalettes,
  NINTENDO_DEFAULT_PALETTE,
} from './lib/palette'
import { canvasToDataUrl, loadImage } from './lib/pixelate'
import type { CharacterAsset, StyleReference } from './types'
import './App.css'

type Tab = 'style' | 'characters' | 'locations'

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function App() {
  const [tab, setTab] = useState<Tab>('characters')
  const [references, setReferences] = useState<StyleReference[]>([])
  const [characters, setCharacters] = useState<CharacterAsset[]>([])
  const [demoReady, setDemoReady] = useState(false)

  useEffect(() => {
    if (demoReady) return
    const canvas = createDemoCharacter()
    const dataUrl = canvasToDataUrl(canvas)
    void loadImage(dataUrl).then((image) => {
      setCharacters([
        {
          id: 'demo-hero',
          name: 'Demo Hero.png',
          dataUrl,
          image,
        },
      ])
      setDemoReady(true)
    })
  }, [demoReady])

  const activePalette = useMemo(() => {
    if (!references.length) return NINTENDO_DEFAULT_PALETTE
    return mergePalettes(
      ...references.map((r) => r.palette),
      NINTENDO_DEFAULT_PALETTE.slice(0, 4),
    ).slice(0, 24)
  }, [references])

  const addStyleRefs = async (files: File[]) => {
    const next: StyleReference[] = []
    for (const file of files) {
      const dataUrl = await fileToDataUrl(file)
      const image = await loadImage(dataUrl)
      const palette = await extractPaletteFromImage(image, 12)
      next.push({
        id: uid(),
        name: file.name,
        dataUrl,
        palette,
      })
    }
    setReferences((prev) => [...prev, ...next])
  }

  const addCharacters = async (files: File[]) => {
    const next: CharacterAsset[] = []
    for (const file of files) {
      const dataUrl = await fileToDataUrl(file)
      const image = await loadImage(dataUrl)
      next.push({
        id: uid(),
        name: file.name,
        dataUrl,
        image,
      })
    }
    setCharacters((prev) => [...prev, ...next])
    setTab('characters')
  }

  return (
    <div className="app">
      <div className="sky-layer" aria-hidden />
      <div className="pixel-grid" aria-hidden />

      <header className="hero">
        <div className="brand-block">
          <p className="brand-mark">SpriteNest</p>
          <h1>Nintendo-style sprite studio</h1>
          <p className="hero-lead">
            Upload your console-inspired art and characters. Generate walk cycles,
            idle loops, and modular location tilesets — all in a classic Nintendo look.
          </p>
        </div>
        <div className="hero-actions">
          <button type="button" className="primary-btn" onClick={() => setTab('characters')}>
            Animate a character
          </button>
          <button type="button" className="secondary-btn" onClick={() => setTab('locations')}>
            Build locations
          </button>
        </div>
      </header>

      <nav className="tabs" aria-label="Studio sections">
        {(
          [
            ['style', 'Style'],
            ['characters', 'Characters'],
            ['locations', 'Locations'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`tab ${tab === id ? 'active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      <main className="main">
        {tab === 'style' && (
          <StyleReferencePanel
            references={references}
            activePalette={activePalette}
            onAdd={addStyleRefs}
            onRemove={(id) =>
              setReferences((prev) => prev.filter((r) => r.id !== id))
            }
          />
        )}
        {tab === 'characters' && (
          <CharacterStudio
            characters={characters}
            palette={activePalette}
            onAdd={addCharacters}
            onRemove={(id) =>
              setCharacters((prev) => prev.filter((c) => c.id !== id))
            }
          />
        )}
        {tab === 'locations' && (
          <LocationStudio
            palette={activePalette}
            useCustomPalette={references.length > 0}
          />
        )}
      </main>

      <footer className="footer">
        <p>
          SpriteNest creates Nintendo-<em>inspired</em> pixel art for your games.
          Export PNG sprite sheets + JSON metadata ready for engines.
        </p>
      </footer>
    </div>
  )
}
