import { createCanvas, getCtx } from './pixelate'

export type ArtStyleId = 'nintendo-clean-vector' | 'chibi-flat' | 'soft-cel'

export const ART_STYLES: {
  id: ArtStyleId
  label: string
  blurb: string
}[] = [
  {
    id: 'nintendo-clean-vector',
    label: 'Nintendo Clean Vector',
    blurb: 'Flat chibi, soft blush, Switch Sports vibe',
  },
  {
    id: 'chibi-flat',
    label: 'Chibi Flat',
    blurb: 'Bigger head, simpler shapes',
  },
  {
    id: 'soft-cel',
    label: 'Soft Cel',
    blurb: 'Gentle shade bands, cartoon outline soft',
  },
]

interface SpriteTraits {
  hair: 'curly' | 'cap' | 'backwards' | 'bun' | 'short'
  shirt: string
  pants: string
  accent: string
  bag?: string
}

function parseTraits(prompt: string): SpriteTraits {
  const t = prompt.toLowerCase()
  let hair: SpriteTraits['hair'] = 'short'
  if (t.includes('curly') || t.includes('afro')) hair = 'curly'
  else if (t.includes('backwards')) hair = 'backwards'
  else if (t.includes('bun')) hair = 'bun'
  else if (t.includes('cap') || t.includes('hat')) hair = 'cap'

  let shirt = '#e85a64'
  if (t.includes('blue')) shirt = '#4696e6'
  if (t.includes('white')) shirt = '#f5f5f8'
  if (t.includes('green')) shirt = '#3db85a'
  if (t.includes('yellow')) shirt = '#ffb703'
  if (t.includes('coral') || t.includes('pink')) shirt = '#e85a64'
  if (t.includes('red')) shirt = '#e23b45'

  let pants = '#4696e6'
  if (t.includes('jean') || t.includes('denim')) pants = '#3f78c8'
  if (t.includes('overall') || t.includes('black pant')) pants = '#2a262e'
  if (t.includes('short')) pants = '#4696e6'

  let accent = '#a0dc50'
  if (t.includes('gold')) accent = '#ffb703'
  if (t.includes('purple')) accent = '#8e6cff'

  const bag =
    t.includes('bag') || t.includes('satchel') || t.includes('backpack')
      ? accent
      : undefined

  return { hair, shirt, pants, accent, bag }
}

function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: string,
): void {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
  ctx.fill()
}

/**
 * Ludo-style "New Sprite": text description → static character frame
 * in Nintendo clean-vector style (procedural, client-side).
 */
export function generateSpriteFromPrompt(
  prompt: string,
  size = 256,
  style: ArtStyleId = 'nintendo-clean-vector',
): HTMLCanvasElement {
  const traits = parseTraits(prompt || 'friendly chibi hero coral shirt')
  const c = createCanvas(size, size)
  const ctx = getCtx(c, true)
  const s = size / 100
  const cx = 50 * s

  const skin = '#ffd6ba'
  const blush = '#ff9eaa'
  const ink = '#2d2832'
  const hair = '#3a3338'
  const shoe = '#2a262e'
  const headScale = style === 'chibi-flat' ? 1.12 : 1

  ctx.fillStyle = 'rgba(45,40,50,0.12)'
  ctx.beginPath()
  ctx.ellipse(cx, 92 * s, 22 * s, 5 * s, 0, 0, Math.PI * 2)
  ctx.fill()

  rr(ctx, cx - 12 * s, 72 * s, 10 * s, 16 * s, 4 * s, traits.pants)
  rr(ctx, cx + 2 * s, 72 * s, 10 * s, 16 * s, 4 * s, traits.pants)
  rr(ctx, cx - 15 * s, 86 * s, 14 * s, 6 * s, 3 * s, shoe)
  rr(ctx, cx + 1 * s, 86 * s, 14 * s, 6 * s, 3 * s, shoe)

  rr(ctx, cx - 16 * s, 52 * s, 32 * s, 24 * s, 10 * s, traits.shirt)
  rr(ctx, cx - 26 * s, 54 * s, 10 * s, 18 * s, 5 * s, skin)
  rr(ctx, cx + 16 * s, 54 * s, 10 * s, 18 * s, 5 * s, skin)

  if (traits.bag) {
    ctx.fillStyle = traits.bag
    ctx.beginPath()
    ctx.ellipse(cx + 20 * s, 68 * s, 8 * s, 7 * s, 0.2, 0, Math.PI * 2)
    ctx.fill()
  }

  if (style === 'soft-cel') {
    ctx.fillStyle = 'rgba(0,0,0,0.08)'
    rr(ctx, cx - 16 * s, 64 * s, 32 * s, 12 * s, 6 * s, 'rgba(0,0,0,0.08)')
  }

  const hy = 34 * s
  ctx.fillStyle = skin
  ctx.beginPath()
  ctx.ellipse(cx, hy, 22 * s * headScale, 22 * s * headScale, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = blush
  ctx.beginPath()
  ctx.ellipse(cx - 12 * s, hy + 4 * s, 5 * s, 3 * s, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(cx + 12 * s, hy + 4 * s, 5 * s, 3 * s, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = ink
  ctx.beginPath()
  ctx.arc(cx - 8 * s, hy, 2.4 * s, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx + 8 * s, hy, 2.4 * s, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = ink
  ctx.lineWidth = 1.8 * s
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(cx, hy + 6 * s, 4 * s, 0.15 * Math.PI, 0.85 * Math.PI)
  ctx.stroke()

  ctx.fillStyle = hair
  if (traits.hair === 'curly') {
    for (const [x, y, r] of [
      [0, -20, 14],
      [-16, -16, 12],
      [16, -16, 12],
      [-22, -4, 11],
      [22, -4, 11],
      [0, -28, 9],
    ] as const) {
      ctx.beginPath()
      ctx.arc(cx + x * s, hy + y * s, r * s, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (traits.hair === 'cap') {
    ctx.beginPath()
    ctx.ellipse(cx, hy - 14 * s, 18 * s, 8 * s, 0, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = traits.shirt
    ctx.beginPath()
    ctx.ellipse(cx, hy - 16 * s, 18 * s, 10 * s, 0, Math.PI, Math.PI * 2)
    ctx.fill()
    rr(ctx, cx - 2 * s, hy - 16 * s, 22 * s, 5 * s, 2 * s, traits.shirt)
  } else if (traits.hair === 'backwards') {
    ctx.beginPath()
    ctx.ellipse(cx, hy - 12 * s, 18 * s, 10 * s, 0, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#2a262e'
    ctx.beginPath()
    ctx.ellipse(cx, hy - 18 * s, 17 * s, 9 * s, 0, Math.PI, Math.PI * 2)
    ctx.fill()
    rr(ctx, cx - 22 * s, hy - 18 * s, 16 * s, 5 * s, 2 * s, '#2a262e')
  } else if (traits.hair === 'bun') {
    ctx.beginPath()
    ctx.ellipse(cx, hy - 12 * s, 18 * s, 8 * s, 0, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx, hy - 22 * s, 8 * s, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.beginPath()
    ctx.ellipse(cx, hy - 12 * s, 18 * s, 10 * s, 0, Math.PI, Math.PI * 2)
    ctx.fill()
  }

  return c
}
