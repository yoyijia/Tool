import { useEffect, useMemo, useState } from 'react'
import { CharacterBuilder } from './components/CharacterBuilder'
import { CharacterStudio } from './components/CharacterStudio'
import { LocationStudio } from './components/LocationStudio'
import { NewSpriteStudio } from './components/NewSpriteStudio'
import { StyleReferencePanel } from './components/StyleReferencePanel'
import {
  extractPaletteFromImage,
  mergePalettes,
  NINTENDO_DEFAULT_PALETTE,
} from './lib/palette'
import { loadImage } from './lib/pixelate'
import { loadSampleSheetCharacters } from './lib/sampleCharacterSheet'
import type { CharacterAsset, StyleReference } from './types'
import './App.css'

type Tab = 'animate' | 'builder' | 'new-sprite' | 'tilesets' | 'style'

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
  const [tab, setTab] = useState<Tab>('animate')
  const [references, setReferences] = useState<StyleReference[]>([])
  const [characters, setCharacters] = useState<CharacterAsset[]>([])
  const [sheetPreviewUrl, setSheetPreviewUrl] = useState<string | null>(null)
  const [sheetReady, setSheetReady] = useState(false)

  useEffect(() => {
    if (sheetReady) return
    void loadSampleSheetCharacters().then(
      ({ sheetDataUrl, characters: sheetChars, palette }) => {
        setSheetPreviewUrl(sheetDataUrl)
        setCharacters(sheetChars)
        setReferences([
          {
            id: 'embedded-sheet',
            name: 'Character sheet (embedded)',
            dataUrl: sheetDataUrl,
            palette,
          },
        ])
        setSheetReady(true)
      },
    )
  }, [sheetReady])

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
      next.push({ id: uid(), name: file.name, dataUrl, palette })
    }
    setReferences((prev) => [...prev, ...next])
  }

  const addCharacters = async (files: File[]) => {
    const next: CharacterAsset[] = []
    for (const file of files) {
      const dataUrl = await fileToDataUrl(file)
      const image = await loadImage(dataUrl)
      next.push({ id: uid(), name: file.name, dataUrl, image })
    }
    setCharacters((prev) => [...prev, ...next])
    setTab('animate')
  }

  return (
    <div className="app">
      <div className="sky-layer" aria-hidden />
      <div className="pixel-grid" aria-hidden />

      <header className="hero">
        <div className="brand-block">
          <p className="brand-mark">SpriteNest</p>
          <h1>AI sprite studio — Ludo.ai-inspired</h1>
          <p className="hero-lead">
            High-fidelity pixel RPG style — outlined chibi heroes, shaded
            sprites, modular supermarket tiles. Animate walk cycles and build
            FairPrice-style worlds. Inspired by{' '}
            <a href="https://ludo.ai" target="_blank" rel="noreferrer">
              Ludo.ai
            </a>
            .
          </p>
        </div>
        <div className="hero-actions">
          <button type="button" className="primary-btn" onClick={() => setTab('animate')}>
            Animate sprite
          </button>
          <button type="button" className="secondary-btn" onClick={() => setTab('builder')}>
            Customize parts
          </button>
        </div>
      </header>

      <nav className="tabs" aria-label="Studio sections">
        {(
          [
            ['animate', 'Animate'],
            ['builder', 'Builder'],
            ['new-sprite', 'New Sprite'],
            ['tilesets', 'Tilesets'],
            ['style', 'Style'],
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
        {tab === 'animate' && (
          <CharacterStudio
            characters={characters}
            palette={activePalette}
            sheetPreviewUrl={sheetPreviewUrl}
            autoGenerate={sheetReady}
            onAdd={addCharacters}
            onRemove={(id) =>
              setCharacters((prev) => prev.filter((c) => c.id !== id))
            }
          />
        )}
        {tab === 'builder' && (
          <CharacterBuilder
            onAddToCharacters={(character) => {
              setCharacters((prev) => [...prev, character])
              setTab('animate')
            }}
          />
        )}
        {tab === 'new-sprite' && (
          <NewSpriteStudio
            onCreated={(character) => {
              setCharacters((prev) => [...prev, character])
              setTab('animate')
            }}
          />
        )}
        {tab === 'tilesets' && (
          <LocationStudio
            palette={activePalette}
            useCustomPalette={references.length > 0}
          />
        )}
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
      </main>

      <footer className="footer">
        <p>
          Workflow inspired by{' '}
          <a href="https://ludo.ai/features/sprite-generator" target="_blank" rel="noreferrer">
            Ludo.ai Sprite Generator
          </a>
          . Pixel-art RPG look · supermarket tiles · not affiliated with
          FairPrice, Ludo.ai, or Nintendo.
        </p>
      </footer>
    </div>
  )
}
