import { useState } from 'react'
import {
  ART_STYLES,
  generateSpriteFromPrompt,
  type ArtStyleId,
} from '../lib/textToSprite'
import { canvasToDataUrl } from '../lib/pixelate'
import type { CharacterAsset } from '../types'

interface NewSpriteStudioProps {
  onCreated: (character: CharacterAsset) => void
}

export function NewSpriteStudio({ onCreated }: NewSpriteStudioProps) {
  const [style, setStyle] = useState<ArtStyleId>('pixel-rpg')
  const [prompt, setPrompt] = useState(
    'pixel RPG shopper with curly hair, red polo, navy shorts, green shopping bag',
  )
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const handleGenerate = () => {
    setBusy(true)
    requestAnimationFrame(() => {
      setTimeout(() => {
        const canvas = generateSpriteFromPrompt(prompt, 256, style)
        const dataUrl = canvasToDataUrl(canvas)
        setPreviewUrl(dataUrl)
        setBusy(false)
      }, 20)
    })
  }

  const handleUse = async () => {
    if (!previewUrl) return
    const image = new Image()
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject()
      image.src = previewUrl
    })
    onCreated({
      id: `generated-${Date.now()}`,
      name: prompt.slice(0, 40).replace(/\s+/g, '-') || 'new-sprite',
      dataUrl: previewUrl,
      image,
    })
  }

  return (
    <section className="panel">
      <header className="panel-header">
        <div className="ludo-badge">New Sprite · Ludo.ai-style workflow</div>
        <h2>Text-to-Sprite</h2>
        <p>
          Describe a static character — appearance only, not motion. Then send it
          to Animate to make a spritesheet (like Ludo’s New Sprite → Animate).
        </p>
      </header>

      <div className="steps-row">
        <div className="step on"><span>1</span> Describe</div>
        <div className="step"><span>2</span> Generate</div>
        <div className="step"><span>3</span> Animate</div>
      </div>

      <label className="field">
        <span>Sprite prompt</span>
        <textarea
          className="prompt-box"
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="A chibi adventurer with a red cap, white tee, and backpack…"
        />
      </label>

      <div className="field">
        <span>Art style</span>
        <div className="theme-grid">
          {ART_STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`theme-card ${style === s.id ? 'active' : ''}`}
              onClick={() => setStyle(s.id)}
            >
              <strong>{s.label}</strong>
              <span>{s.blurb}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="action-row">
        <button
          type="button"
          className="primary-btn"
          disabled={busy || !prompt.trim()}
          onClick={handleGenerate}
        >
          {busy ? 'Generating…' : 'Generate static sprite'}
        </button>
        <button
          type="button"
          className="secondary-btn"
          disabled={!previewUrl}
          onClick={() => void handleUse()}
        >
          Use in Animate
        </button>
      </div>

      {previewUrl && (
        <div className="preview-stage new-sprite-preview">
          <img src={previewUrl} alt="Generated sprite" />
          <div className="preview-meta">Static starting frame · ready to animate</div>
        </div>
      )}
    </section>
  )
}
