import { useState } from 'react'
import { CharacterBuilder } from './CharacterBuilder'
import { NewSpriteStudio } from './NewSpriteStudio'
import type { CharacterAsset } from '../types'

interface CharacterCreateStudioProps {
  onCreated: (character: CharacterAsset) => void
}

type Mode = 'parts' | 'prompt'

/**
 * Unified character creator: modular parts OR text prompt,
 * then hand off to Animate.
 */
export function CharacterCreateStudio({ onCreated }: CharacterCreateStudioProps) {
  const [mode, setMode] = useState<Mode>('parts')

  return (
    <div className="create-studio">
      <section className="panel create-intro">
        <header className="panel-header">
          <div className="ludo-badge">Character Generator · create then animate</div>
          <h2>Create a pixel character</h2>
          <p>
            Build with modular parts or describe a sprite. When you&apos;re happy,
            send it to Animate for walk cycles and spritesheets.
          </p>
        </header>

        <div className="steps-row">
          <div className="step on"><span>1</span> Create</div>
          <div className="step"><span>2</span> Animate</div>
          <div className="step"><span>3</span> Export</div>
        </div>

        <div className="mode-toggles">
          <label className="toggle-row">
            <input
              type="radio"
              name="create-mode"
              checked={mode === 'parts'}
              onChange={() => setMode('parts')}
            />
            <span>
              <strong>Parts builder</strong>
              <em>Hair, eyes, clothes, bag — classic chibi pixel</em>
            </span>
          </label>
          <label className="toggle-row">
            <input
              type="radio"
              name="create-mode"
              checked={mode === 'prompt'}
              onChange={() => setMode('prompt')}
            />
            <span>
              <strong>Text prompt</strong>
              <em>Describe appearance → generate a starting frame</em>
            </span>
          </label>
        </div>
      </section>

      {mode === 'parts' ? (
        <CharacterBuilder onAddToCharacters={onCreated} compact />
      ) : (
        <NewSpriteStudio onCreated={onCreated} compact />
      )}
    </div>
  )
}
