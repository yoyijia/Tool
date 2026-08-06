import type { AnimationType } from '../types'

/** Ludo-style motion presets shown as quick chips. */
export const MOTION_PRESETS: {
  id: string
  label: string
  prompt: string
  anims: AnimationType[]
}[] = [
  {
    id: 'idle',
    label: 'Idle',
    prompt: 'soft idle pose, subtle breathing bob',
    anims: ['idle'],
  },
  {
    id: 'rpg4dir',
    label: '4-Dir RPG Walk',
    prompt: '4-direction RPG walk sheet, 8 frames',
    anims: ['walk'],
  },
  {
    id: 'walk',
    label: 'Walk',
    prompt: 'walk cycle facing side, looping footsteps',
    anims: ['walk'],
  },
  {
    id: 'run',
    label: 'Run',
    prompt: 'run cycle, leaning forward, faster bob',
    anims: ['run'],
  },
  {
    id: 'jump',
    label: 'Jump',
    prompt: 'jump with squash anticipation and land',
    anims: ['jump'],
  },
  {
    id: 'attack',
    label: 'Attack',
    prompt: 'winds up and strikes forward',
    anims: ['attack'],
  },
  {
    id: 'hit',
    label: 'Hit / Hurt',
    prompt: 'takes a hit, flash and knockback',
    anims: ['hurt'],
  },
  {
    id: 'celebrate',
    label: 'Celebrate',
    prompt: 'happy bounce and wave celebrate',
    anims: ['celebrate'],
  },
  {
    id: 'pack',
    label: 'Animation Pack',
    prompt: 'idle, walk, run, jump — full character pack',
    anims: ['idle', 'walk', 'run', 'jump'],
  },
]

const KEYWORD_MAP: { keys: string[]; anim: AnimationType }[] = [
  { keys: ['idle', 'breath', 'stand', 'wait'], anim: 'idle' },
  { keys: ['walk', 'stroll', 'footstep'], anim: 'walk' },
  { keys: ['run', 'sprint', 'dash', 'charge'], anim: 'run' },
  { keys: ['jump', 'leap', 'hop'], anim: 'jump' },
  { keys: ['attack', 'slash', 'strike', 'punch', 'swing', 'hit enemy'], anim: 'attack' },
  { keys: ['hurt', 'damage', 'hit react', 'knock', 'death', 'collapse'], anim: 'hurt' },
  { keys: ['celebrate', 'cheer', 'wave', 'victory', 'happy'], anim: 'celebrate' },
]

/**
 * Parse a Ludo-style motion prompt into animation types.
 * Falls back to animation pack if nothing matches.
 */
export function parseMotionPrompt(prompt: string): AnimationType[] {
  const text = prompt.toLowerCase().trim()
  if (!text) return ['idle', 'walk', 'run', 'jump']

  const found = new Set<AnimationType>()
  for (const row of KEYWORD_MAP) {
    if (row.keys.some((k) => text.includes(k))) found.add(row.anim)
  }

  if (text.includes('pack') || text.includes('full') || text.includes('all')) {
    return ['idle', 'walk', 'run', 'jump']
  }

  if (!found.size) {
    // Infer a single sensible default from verbs
    if (text.includes('loop')) return ['idle']
    return ['walk']
  }

  return [...found]
}
