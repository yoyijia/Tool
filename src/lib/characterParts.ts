import { centerContentOnCanvas, createCanvas, getCtx } from './pixelate'

export type PartSlot =
  | 'hair'
  | 'eyes'
  | 'hands'
  | 'legs'
  | 'shirt'
  | 'pants'
  | 'accessory'

export interface PartOption {
  id: string
  label: string
  slot: PartSlot
  /** Preview swatch color hint */
  swatch?: string
}

export interface CharacterLoadout {
  hair: string
  eyes: string
  hands: string
  legs: string
  shirt: string
  pants: string
  accessory: string
  skin: string
  hairColor: string
  shirtColor: string
  pantsColor: string
  accessoryColor: string
}

export const DEFAULT_LOADOUT: CharacterLoadout = {
  hair: 'curly',
  eyes: 'oval',
  hands: 'relaxed',
  legs: 'straight',
  shirt: 'tee',
  pants: 'shorts',
  accessory: 'satchel',
  skin: '#ffd6ba',
  hairColor: '#2f2a30',
  shirtColor: '#e85a64',
  pantsColor: '#5a555e',
  accessoryColor: '#9bc24a',
}

export const PART_OPTIONS: Record<PartSlot, PartOption[]> = {
  hair: [
    { id: 'curly', label: 'Curly', slot: 'hair', swatch: '#3a3338' },
    { id: 'short', label: 'Short', slot: 'hair', swatch: '#3a3338' },
    { id: 'bun', label: 'Bun', slot: 'hair', swatch: '#3a3338' },
    { id: 'spiky', label: 'Spiky', slot: 'hair', swatch: '#e85a20' },
    { id: 'explorer', label: 'Explorer Hat', slot: 'hair', swatch: '#c4a574' },
    { id: 'cap', label: 'Front Cap', slot: 'hair', swatch: '#e23b45' },
    { id: 'backwards', label: 'Backwards Cap', slot: 'hair', swatch: '#2a262e' },
    { id: 'none', label: 'Bald', slot: 'hair' },
  ],
  eyes: [
    { id: 'oval', label: 'Oval Eyes', slot: 'eyes' },
    { id: 'dots', label: 'Dot Eyes', slot: 'eyes' },
    { id: 'happy', label: 'Happy', slot: 'eyes' },
    { id: 'wink', label: 'Wink', slot: 'eyes' },
    { id: 'wide', label: 'Wide', slot: 'eyes' },
    { id: 'tired', label: 'Tired', slot: 'eyes' },
  ],
  hands: [
    { id: 'relaxed', label: 'Relaxed', slot: 'hands' },
    { id: 'wave', label: 'Wave', slot: 'hands' },
    { id: 'akimbo', label: 'On Hips', slot: 'hands' },
    { id: 'out', label: 'Arms Out', slot: 'hands' },
  ],
  legs: [
    { id: 'straight', label: 'Straight', slot: 'legs' },
    { id: 'stride', label: 'Stride', slot: 'legs' },
    { id: 'together', label: 'Together', slot: 'legs' },
  ],
  shirt: [
    { id: 'tee', label: 'T-Shirt', slot: 'shirt' },
    { id: 'hoodie', label: 'Hoodie', slot: 'shirt' },
    { id: 'tank', label: 'Tank', slot: 'shirt' },
    { id: 'overalls', label: 'Overall Top', slot: 'shirt' },
  ],
  pants: [
    { id: 'shorts', label: 'Shorts', slot: 'pants' },
    { id: 'jeans', label: 'Jeans', slot: 'pants' },
    { id: 'overalls', label: 'Overalls', slot: 'pants' },
    { id: 'skirt', label: 'Skirt', slot: 'pants' },
  ],
  accessory: [
    { id: 'none', label: 'None', slot: 'accessory' },
    { id: 'satchel', label: 'Satchel', slot: 'accessory', swatch: '#a0dc50' },
    { id: 'backpack', label: 'Backpack', slot: 'accessory', swatch: '#3f78c8' },
    { id: 'scarf', label: 'Scarf', slot: 'accessory', swatch: '#ffb703' },
  ],
}

export const COLOR_PRESETS = {
  skin: ['#ffd6ba', '#f2c9a0', '#d4a574', '#c68642', '#8d5524'],
  hair: ['#3a3338', '#5a4030', '#c9a06c', '#f0e6d8', '#e23b45', '#4696e6'],
  shirt: ['#e85a64', '#e23b45', '#4696e6', '#f5f5f8', '#3db85a', '#ffb703', '#8e6cff'],
  pants: ['#5a555e', '#4696e6', '#3f78c8', '#2a262e', '#e85a64', '#3db85a', '#f5f5f8'],
  accessory: ['#9bc24a', '#a0dc50', '#3f78c8', '#ffb703', '#e85a64', '#2a262e'],
}

const INK = '#2d2832'
const BLUSH = '#ff9eaa'
const SHOE = '#2a262e'

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

function drawLegs(
  ctx: CanvasRenderingContext2D,
  cx: number,
  s: number,
  style: string,
  color: string,
): void {
  const top = 72 * s
  if (style === 'together') {
    rr(ctx, cx - 8 * s, top, 8 * s, 16 * s, 4 * s, color)
    rr(ctx, cx, top, 8 * s, 16 * s, 4 * s, color)
    rr(ctx, cx - 10 * s, top + 14 * s, 12 * s, 6 * s, 3 * s, SHOE)
    rr(ctx, cx - 2 * s, top + 14 * s, 12 * s, 6 * s, 3 * s, SHOE)
  } else if (style === 'stride') {
    rr(ctx, cx - 16 * s, top, 10 * s, 16 * s, 4 * s, color)
    rr(ctx, cx + 6 * s, top, 10 * s, 16 * s, 4 * s, color)
    rr(ctx, cx - 19 * s, top + 14 * s, 14 * s, 6 * s, 3 * s, SHOE)
    rr(ctx, cx + 5 * s, top + 14 * s, 14 * s, 6 * s, 3 * s, SHOE)
  } else {
    rr(ctx, cx - 12 * s, top, 10 * s, 16 * s, 4 * s, color)
    rr(ctx, cx + 2 * s, top, 10 * s, 16 * s, 4 * s, color)
    rr(ctx, cx - 15 * s, top + 14 * s, 14 * s, 6 * s, 3 * s, SHOE)
    rr(ctx, cx + 1 * s, top + 14 * s, 14 * s, 6 * s, 3 * s, SHOE)
  }
}

function drawPantsOverlay(
  ctx: CanvasRenderingContext2D,
  cx: number,
  s: number,
  style: string,
  color: string,
): void {
  if (style === 'skirt') {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(cx - 16 * s, 68 * s)
    ctx.lineTo(cx + 16 * s, 68 * s)
    ctx.lineTo(cx + 20 * s, 84 * s)
    ctx.lineTo(cx - 20 * s, 84 * s)
    ctx.closePath()
    ctx.fill()
  } else if (style === 'overalls') {
    rr(ctx, cx - 15 * s, 50 * s, 30 * s, 28 * s, 8 * s, color)
    rr(ctx, cx - 10 * s, 44 * s, 5 * s, 12 * s, 2 * s, color)
    rr(ctx, cx + 5 * s, 44 * s, 5 * s, 12 * s, 2 * s, color)
  }
  // shorts/jeans drawn as leg color already
}

function drawShirt(
  ctx: CanvasRenderingContext2D,
  cx: number,
  s: number,
  style: string,
  color: string,
): void {
  if (style === 'tank') {
    rr(ctx, cx - 12 * s, 52 * s, 24 * s, 22 * s, 8 * s, color)
  } else if (style === 'hoodie') {
    rr(ctx, cx - 18 * s, 50 * s, 36 * s, 26 * s, 12 * s, color)
    // hood fluff
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.ellipse(cx, 48 * s, 14 * s, 6 * s, 0, 0, Math.PI * 2)
    ctx.fill()
  } else if (style === 'overalls') {
    rr(ctx, cx - 12 * s, 48 * s, 24 * s, 12 * s, 6 * s, color)
  } else {
    rr(ctx, cx - 16 * s, 52 * s, 32 * s, 24 * s, 10 * s, color)
  }
}

function drawHands(
  ctx: CanvasRenderingContext2D,
  cx: number,
  s: number,
  style: string,
  skin: string,
): void {
  if (style === 'wave') {
    rr(ctx, cx - 26 * s, 54 * s, 10 * s, 18 * s, 5 * s, skin)
    ctx.save()
    ctx.translate(cx + 18 * s, 50 * s)
    ctx.rotate(-0.9)
    rr(ctx, 0, 0, 10 * s, 20 * s, 5 * s, skin)
    ctx.restore()
  } else if (style === 'akimbo') {
    ctx.save()
    ctx.translate(cx - 20 * s, 58 * s)
    ctx.rotate(0.5)
    rr(ctx, 0, 0, 10 * s, 16 * s, 5 * s, skin)
    ctx.restore()
    ctx.save()
    ctx.translate(cx + 12 * s, 58 * s)
    ctx.rotate(-0.5)
    rr(ctx, 0, 0, 10 * s, 16 * s, 5 * s, skin)
    ctx.restore()
  } else if (style === 'out') {
    rr(ctx, cx - 30 * s, 58 * s, 16 * s, 9 * s, 5 * s, skin)
    rr(ctx, cx + 14 * s, 58 * s, 16 * s, 9 * s, 5 * s, skin)
  } else {
    rr(ctx, cx - 26 * s, 54 * s, 10 * s, 18 * s, 5 * s, skin)
    rr(ctx, cx + 16 * s, 54 * s, 10 * s, 18 * s, 5 * s, skin)
  }
}

function drawEyes(
  ctx: CanvasRenderingContext2D,
  cx: number,
  hy: number,
  s: number,
  style: string,
): void {
  ctx.fillStyle = INK
  ctx.strokeStyle = INK
  ctx.lineWidth = 1.8 * s
  ctx.lineCap = 'round'

  if (style === 'happy') {
    ctx.beginPath()
    ctx.arc(cx - 8 * s, hy, 3.5 * s, Math.PI, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(cx + 8 * s, hy, 3.5 * s, Math.PI, Math.PI * 2)
    ctx.stroke()
  } else if (style === 'wink') {
    ctx.beginPath()
    ctx.arc(cx - 8 * s, hy, 2.4 * s, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(cx + 5 * s, hy)
    ctx.lineTo(cx + 11 * s, hy)
    ctx.stroke()
  } else if (style === 'wide') {
    ctx.beginPath()
    ctx.arc(cx - 8 * s, hy, 3.2 * s, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx + 8 * s, hy, 3.2 * s, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(cx - 7 * s, hy - 1 * s, 1.1 * s, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx + 9 * s, hy - 1 * s, 1.1 * s, 0, Math.PI * 2)
    ctx.fill()
  } else if (style === 'oval') {
    // Reference sheet: large solid black ovals + tiny nose
    ctx.beginPath()
    ctx.ellipse(cx - 8 * s, hy, 3.6 * s, 4.4 * s, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(cx + 8 * s, hy, 3.6 * s, 4.4 * s, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx, hy + 3.5 * s, 1.1 * s, 0, Math.PI * 2)
    ctx.fill()
  } else if (style === 'tired') {
    ctx.beginPath()
    ctx.arc(cx - 8 * s, hy + 1 * s, 2.2 * s, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx + 8 * s, hy + 1 * s, 2.2 * s, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(cx - 12 * s, hy - 3 * s)
    ctx.lineTo(cx - 4 * s, hy - 2 * s)
    ctx.moveTo(cx + 4 * s, hy - 2 * s)
    ctx.lineTo(cx + 12 * s, hy - 3 * s)
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.arc(cx - 8 * s, hy, 2.4 * s, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx + 8 * s, hy, 2.4 * s, 0, Math.PI * 2)
    ctx.fill()
  }

  // smile (oval already drew a tiny nose above)
  ctx.beginPath()
  ctx.arc(cx, hy + (style === 'oval' ? 8 : 6) * s, style === 'oval' ? 3.6 * s : 4 * s, 0.15 * Math.PI, 0.85 * Math.PI)
  ctx.stroke()
}

function drawHair(
  ctx: CanvasRenderingContext2D,
  cx: number,
  hy: number,
  s: number,
  style: string,
  color: string,
  shirtColor: string,
): void {
  ctx.fillStyle = color
  if (style === 'none') return

  if (style === 'curly') {
    for (const [x, y, r] of [
      [0, -20, 14],
      [-16, -16, 12],
      [16, -16, 12],
      [-22, -4, 11],
      [22, -4, 11],
      [-10, -24, 10],
      [10, -24, 10],
      [0, -28, 9],
      [-18, 6, 9],
      [18, 6, 9],
    ] as const) {
      ctx.beginPath()
      ctx.arc(cx + x * s, hy + y * s, r * s, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (style === 'short') {
    ctx.beginPath()
    ctx.ellipse(cx, hy - 12 * s, 18 * s, 10 * s, 0, Math.PI, Math.PI * 2)
    ctx.fill()
  } else if (style === 'bun') {
    ctx.beginPath()
    ctx.ellipse(cx, hy - 12 * s, 18 * s, 8 * s, 0, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx, hy - 22 * s, 8 * s, 0, Math.PI * 2)
    ctx.fill()
  } else if (style === 'spiky') {
    ctx.beginPath()
    ctx.moveTo(cx - 18 * s, hy - 6 * s)
    ctx.lineTo(cx - 12 * s, hy - 28 * s)
    ctx.lineTo(cx - 4 * s, hy - 10 * s)
    ctx.lineTo(cx, hy - 30 * s)
    ctx.lineTo(cx + 4 * s, hy - 10 * s)
    ctx.lineTo(cx + 12 * s, hy - 26 * s)
    ctx.lineTo(cx + 18 * s, hy - 6 * s)
    ctx.closePath()
    ctx.fill()
  } else if (style === 'cap') {
    ctx.beginPath()
    ctx.ellipse(cx, hy - 14 * s, 18 * s, 8 * s, 0, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = shirtColor
    ctx.beginPath()
    ctx.ellipse(cx, hy - 16 * s, 18 * s, 10 * s, 0, Math.PI, Math.PI * 2)
    ctx.fill()
    rr(ctx, cx - 2 * s, hy - 16 * s, 22 * s, 5 * s, 2 * s, shirtColor)
  } else if (style === 'explorer') {
    const hat = '#c4a574'
    const band = '#6b4a2a'
    ctx.fillStyle = color
    // fringe
    ctx.beginPath()
    ctx.moveTo(cx - 10 * s, hy - 6 * s)
    ctx.lineTo(cx - 4 * s, hy + 2 * s)
    ctx.lineTo(cx + 2 * s, hy - 5 * s)
    ctx.lineTo(cx + 8 * s, hy + 1 * s)
    ctx.lineTo(cx + 12 * s, hy - 6 * s)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = hat
    ctx.beginPath()
    ctx.ellipse(cx, hy - 14 * s, 18 * s, 10 * s, 0, Math.PI, Math.PI * 2)
    ctx.fill()
    rr(ctx, cx - 20 * s, hy - 12 * s, 40 * s, 6 * s, 3 * s, hat)
    rr(ctx, cx - 14 * s, hy - 13 * s, 28 * s, 3 * s, 1 * s, band)
  } else if (style === 'backwards') {
    ctx.beginPath()
    ctx.ellipse(cx, hy - 12 * s, 18 * s, 10 * s, 0, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#2a262e'
    ctx.beginPath()
    ctx.ellipse(cx, hy - 18 * s, 17 * s, 9 * s, 0, Math.PI, Math.PI * 2)
    ctx.fill()
    rr(ctx, cx - 22 * s, hy - 18 * s, 16 * s, 5 * s, 2 * s, '#2a262e')
  }
}

function drawAccessory(
  ctx: CanvasRenderingContext2D,
  cx: number,
  s: number,
  style: string,
  color: string,
): void {
  if (style === 'none') return
  if (style === 'satchel') {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.ellipse(cx + 20 * s, 68 * s, 8 * s, 7 * s, 0.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = INK
    ctx.lineWidth = 1.5 * s
    ctx.beginPath()
    ctx.moveTo(cx + 4 * s, 55 * s)
    ctx.lineTo(cx + 14 * s, 64 * s)
    ctx.stroke()
  } else if (style === 'backpack') {
    rr(ctx, cx - 14 * s, 54 * s, 28 * s, 18 * s, 6 * s, color)
    rr(ctx, cx - 6 * s, 58 * s, 12 * s, 10 * s, 3 * s, '#fff')
  } else if (style === 'scarf') {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.ellipse(cx, 50 * s, 16 * s, 5 * s, 0, 0, Math.PI * 2)
    ctx.fill()
    rr(ctx, cx + 8 * s, 50 * s, 8 * s, 18 * s, 3 * s, color)
  }
}

/**
 * Compose a Nintendo clean-vector character from modular parts,
 * then place the figure dead-center in the canvas.
 */
export function composeCharacter(
  loadout: CharacterLoadout,
  size = 256,
): HTMLCanvasElement {
  // Draw oversized then center-crop so figure sits in the middle
  const drawSize = size
  const raw = createCanvas(drawSize, drawSize)
  const ctx = getCtx(raw, true)
  const s = drawSize / 100
  const cx = 50 * s
  const hy = 34 * s

  ctx.fillStyle = 'rgba(45,40,50,0.12)'
  ctx.beginPath()
  ctx.ellipse(cx, 92 * s, 22 * s, 5 * s, 0, 0, Math.PI * 2)
  ctx.fill()

  if (loadout.pants !== 'skirt' && loadout.pants !== 'overalls') {
    drawLegs(ctx, cx, s, loadout.legs, loadout.pantsColor)
  } else if (loadout.pants === 'overalls') {
    drawLegs(ctx, cx, s, loadout.legs, loadout.pantsColor)
  } else {
    drawLegs(ctx, cx, s, loadout.legs, loadout.skin)
  }

  drawPantsOverlay(ctx, cx, s, loadout.pants, loadout.pantsColor)
  drawShirt(ctx, cx, s, loadout.shirt, loadout.shirtColor)
  drawHands(ctx, cx, s, loadout.hands, loadout.skin)
  drawAccessory(ctx, cx, s, loadout.accessory, loadout.accessoryColor)

  ctx.fillStyle = loadout.skin
  ctx.beginPath()
  ctx.ellipse(cx, hy, 22 * s, 22 * s, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = BLUSH
  ctx.beginPath()
  ctx.ellipse(cx - 12 * s, hy + 4 * s, 5 * s, 3 * s, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(cx + 12 * s, hy + 4 * s, 5 * s, 3 * s, 0, 0, Math.PI * 2)
  ctx.fill()

  drawEyes(ctx, cx, hy, s, loadout.eyes)
  drawHair(ctx, cx, hy, s, loadout.hair, loadout.hairColor, loadout.shirtColor)

  return centerContentOnCanvas(raw, size, 0.1)
}

/** Tiny part preview icon for picker UI. */
export function composePartPreview(
  slot: PartSlot,
  optionId: string,
  loadout: CharacterLoadout,
  size = 72,
): HTMLCanvasElement {
  const partial: CharacterLoadout = {
    ...DEFAULT_LOADOUT,
    ...loadout,
    [slot]: optionId,
  }
  // For accessory none, still show empty frame character
  return composeCharacter(partial, size)
}
