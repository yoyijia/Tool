import { useEffect, useMemo, useState } from 'react'
import { CharacterCreateStudio } from './components/CharacterCreateStudio'
import { CharacterStudio } from './components/CharacterStudio'
import { LocationStudio } from './components/LocationStudio'
import { StyleReferencePanel } from './components/StyleReferencePanel'
import { UiStudio } from './components/UiStudio'
import {
  extractPaletteFromImage,
  mergePalettes,
  NINTENDO_DEFAULT_PALETTE,
} from './lib/palette'
import { loadImage } from './lib/pixelate'
import { loadSampleSheetCharacters } from './lib/sampleCharacterSheet'
import type { CharacterAsset, StyleReference } from './types'
import './App.css'

type Tab = 'character' | 'animate' | 'tilesets' | 'ui' | 'style'

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
  const [tab, setTab] = useState<Tab>('character')
  const [references, setReferences] = useState<StyleReference[]>([])
  const [characters, setCharacters] = useState<CharacterAsset[]>([])
  const [sheetPreviewUrl, setSheetPreviewUrl] = useState<string | null>(null)
  const [sheetReady, setSheetReady] = useState(false)
  const [focusCharacterId, setFocusCharacterId] = useState<string | null>(null)

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
    if (next[0]) setFocusCharacterId(next[0].id)
    setTab('animate')
  }

  const handleCharacterCreated = (character: CharacterAsset) => {
    setCharacters((prev) => [...prev, character])
    setFocusCharacterId(character.id)
    setTab('animate')
  }

  return (
    <div className="app">
      <div className="sky-layer" aria-hidden />
      <div className="pixel-grid" aria-hidden />

      <header className="hero">
        <div className="brand-block">
          <p className="brand-mark">SpriteNest</p>
          <h1>Pixel generator — characters, tiles &amp; UI</h1>
          <p className="hero-lead">
            Create a classic chibi pixel character, animate walk cycles, build
            location tilesets, and generate game UI — one coherent pixel kit.
            Inspired by{' '}
            <a href="https://ludo.ai" target="_blank" rel="noreferrer">
              Ludo.ai
            </a>
            .
          </p>
        </div>
        <div className="hero-actions">
          <button type="button" className="primary-btn" onClick={() => setTab('character')}>
            Create character
          </button>
          <button type="button" className="secondary-btn" onClick={() => setTab('animate')}>
            Animate
          </button>
        </div>
      </header>

      <div className="pipeline-bar" aria-label="Generator pipeline">
        <button
          type="button"
          className={`pipeline-step ${tab === 'character' ? 'active' : ''}`}
          onClick={() => setTab('character')}
        >
          <span>1</span> Character
        </button>
        <span className="pipeline-arrow" aria-hidden>
          →
        </span>
        <button
          type="button"
          className={`pipeline-step ${tab === 'animate' ? 'active' : ''}`}
          onClick={() => setTab('animate')}
        >
          <span>2</span> Animate
        </button>
        <span className="pipeline-arrow" aria-hidden>
          →
        </span>
        <button
          type="button"
          className={`pipeline-step ${tab === 'tilesets' ? 'active' : ''}`}
          onClick={() => setTab('tilesets')}
        >
          <span>3</span> Tilesets
        </button>
        <span className="pipeline-arrow" aria-hidden>
          →
        </span>
        <button
          type="button"
          className={`pipeline-step ${tab === 'ui' ? 'active' : ''}`}
          onClick={() => setTab('ui')}
        >
          <span>4</span> UI
        </button>
      </div>

      <nav className="tabs" aria-label="Studio sections">
        {(
          [
            ['character', 'Character'],
            ['animate', 'Animate'],
            ['tilesets', 'Tilesets'],
            ['ui', 'UI'],
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
        {tab === 'character' && (
          <CharacterCreateStudio onCreated={handleCharacterCreated} />
        )}
        {tab === 'animate' && (
          <CharacterStudio
            characters={characters}
            palette={activePalette}
            sheetPreviewUrl={sheetPreviewUrl}
            autoGenerate={sheetReady}
            focusCharacterId={focusCharacterId}
            onAdd={addCharacters}
            onRemove={(id) =>
              setCharacters((prev) => prev.filter((c) => c.id !== id))
            }
            onCreateClick={() => setTab('character')}
          />
        )}
        {tab === 'tilesets' && (
          <LocationStudio
            palette={activePalette}
            useCustomPalette={references.length > 0}
          />
        )}
        {tab === 'ui' && <UiStudio />}
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
          Pixel generator workflow · character → animate → tilesets → UI ·
          inspired by{' '}
          <a href="https://ludo.ai/features/sprite-generator" target="_blank" rel="noreferrer">
            Ludo.ai
          </a>
          .
        </p>
      </footer>
    </div>
  )
}
