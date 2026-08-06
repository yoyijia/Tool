import type { CharacterLoadoutData, FrameSize } from '../types'
import { centerContentOnCanvas, createCanvas, getCtx } from './pixelate'

export type WalkDir = 'down' | 'left' | 'right' | 'up'

export const WALK_DIRS: WalkDir[] = ['down', 'left', 'right', 'up']

export const HAIR_VARIANT_COLORS = [
  '#2a3a6e', // dark blue
  '#1a1a1a', // black
  '#6b3e1a', // brown
  '#e88ab0', // pink
  '#5ec4c0', // teal
  '#b0b8c4', // silver
  '#c9b86c', // blonde
  '#e85a20', // orange
]

export const SKIN_VARIANT_COLORS = [
  '#ffd6ba',
  '#f2c9a0',
  '#d4a574',
  '#c68642',
  '#8d5524',
]

const INK = '#1a1420'

export interface RpgWalkOptions {
  frameSize: FrameSize
  frameCount: number
  loadout?: CharacterLoadoutData
  /** Pixel-art base cell before upscale (keeps Nintendo RPG crispness). */
  pixelBase?: 32 | 48 | 64
  hairColor?: string
  skinColor?: string
  outfitColor?: string
  bootColor?: string
}

function shade(hex: string, amount: number): string {
  const h = hex.replace('#', '')
  const r = Math.max(0, Math.min(255, parseInt(h.slice(0, 2), 16) + amount))
  const g = Math.max(0, Math.min(255, parseInt(h.slice(2, 4), 16) + amount))
  const b = Math.max(0, Math.min(255, parseInt(h.slice(4, 6), 16) + amount))
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

function px(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
}

function outlineRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
): void {
  px(ctx, x, y, w, h, fill)
  ctx.strokeStyle = INK
  ctx.lineWidth = 1
  ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(w) - 1, Math.round(h) - 1)
}

/**
 * Draw one RPG Maker–style ¾ walk frame at pixelBase resolution.
 */
function drawRpgWalkPixel(
  base: number,
  dir: WalkDir,
  phase: number,
  colors: {
    skin: string
    hair: string
    outfit: string
    boot: string
    hairStyle: string
  },
): HTMLCanvasElement {
  const c = createCanvas(base, base)
  const ctx = getCtx(c, false)
  ctx.clearRect(0, 0, base, base)

  const s = base / 32
  const cx = 16 * s
  // walk bob + stride
  const swing = Math.sin(phase * Math.PI * 2)
  const bob = Math.round(Math.abs(Math.cos(phase * Math.PI * 2)) * 1 * s)
  const stride = Math.round(swing * (dir === 'left' || dir === 'right' ? 2.5 : 2) * s)

  const skin = colors.skin
  const hair = colors.hair
  const outfit = colors.outfit
  const boot = colors.boot
  const outfitDark = shade(outfit, -35)
  const skinDark = shade(skin, -25)

  // Shadow
  px(ctx, cx - 6 * s, 28 * s, 12 * s, 2 * s, 'rgba(0,0,0,0.15)')

  if (dir === 'down') {
    drawFacingDown(ctx, cx, bob, stride, s, skin, skinDark, hair, outfit, outfitDark, boot, colors.hairStyle)
  } else if (dir === 'up') {
    drawFacingUp(ctx, cx, bob, stride, s, skin, hair, outfit, outfitDark, boot, colors.hairStyle)
  } else if (dir === 'right') {
    drawFacingSide(ctx, cx, bob, stride, s, skin, skinDark, hair, outfit, outfitDark, boot, colors.hairStyle, false)
  } else {
    drawFacingSide(ctx, cx, bob, -stride, s, skin, skinDark, hair, outfit, outfitDark, boot, colors.hairStyle, true)
  }

  return c
}

function drawFacingDown(
  ctx: CanvasRenderingContext2D,
  cx: number,
  bob: number,
  stride: number,
  s: number,
  skin: string,
  skinDark: string,
  hair: string,
  outfit: string,
  outfitDark: string,
  boot: string,
  hairStyle: string,
): void {
  const y = 4 * s - bob

  // Far arm
  outlineRect(ctx, cx - 9 * s - stride * 0.3, y + 12 * s, 3 * s, 7 * s, skin)
  // Near arm
  outlineRect(ctx, cx + 6 * s + stride * 0.3, y + 12 * s, 3 * s, 7 * s, skin)

  // Legs
  outlineRect(ctx, cx - 5 * s - stride, y + 20 * s, 4 * s, 6 * s, outfitDark)
  outlineRect(ctx, cx + 1 * s + stride, y + 20 * s, 4 * s, 6 * s, outfitDark)
  // Boots
  outlineRect(ctx, cx - 5 * s - stride, y + 25 * s, 4 * s, 3 * s, boot)
  outlineRect(ctx, cx + 1 * s + stride, y + 25 * s, 4 * s, 3 * s, boot)

  // Body / leotard-like outfit
  outlineRect(ctx, cx - 6 * s, y + 11 * s, 12 * s, 10 * s, outfit)
  px(ctx, cx - 6 * s, y + 18 * s, 12 * s, 3 * s, outfitDark)

  // Head
  outlineRect(ctx, cx - 6 * s, y + 2 * s, 12 * s, 10 * s, skin)
  // Eyes
  px(ctx, cx - 3 * s, y + 6 * s, 2 * s, 2 * s, INK)
  px(ctx, cx + 2 * s, y + 6 * s, 2 * s, 2 * s, INK)
  // Mouth
  px(ctx, cx - 1 * s, y + 9 * s, 3 * s, 1 * s, skinDark)

  drawHairDown(ctx, cx, y, s, hair, hairStyle)
}

function drawFacingUp(
  ctx: CanvasRenderingContext2D,
  cx: number,
  bob: number,
  stride: number,
  s: number,
  skin: string,
  hair: string,
  outfit: string,
  outfitDark: string,
  boot: string,
  hairStyle: string,
): void {
  const y = 4 * s - bob

  outlineRect(ctx, cx - 9 * s + stride * 0.3, y + 12 * s, 3 * s, 7 * s, skin)
  outlineRect(ctx, cx + 6 * s - stride * 0.3, y + 12 * s, 3 * s, 7 * s, skin)

  outlineRect(ctx, cx - 5 * s + stride, y + 20 * s, 4 * s, 6 * s, outfitDark)
  outlineRect(ctx, cx + 1 * s - stride, y + 20 * s, 4 * s, 6 * s, outfitDark)
  outlineRect(ctx, cx - 5 * s + stride, y + 25 * s, 4 * s, 3 * s, boot)
  outlineRect(ctx, cx + 1 * s - stride, y + 25 * s, 4 * s, 3 * s, boot)

  outlineRect(ctx, cx - 6 * s, y + 11 * s, 12 * s, 10 * s, outfit)
  px(ctx, cx - 6 * s, y + 18 * s, 12 * s, 3 * s, outfitDark)

  // Head back
  outlineRect(ctx, cx - 6 * s, y + 2 * s, 12 * s, 10 * s, skin)
  drawHairUp(ctx, cx, y, s, hair, hairStyle)
}

function drawFacingSide(
  ctx: CanvasRenderingContext2D,
  cx: number,
  bob: number,
  stride: number,
  s: number,
  skin: string,
  skinDark: string,
  hair: string,
  outfit: string,
  outfitDark: string,
  boot: string,
  hairStyle: string,
  flip: boolean,
): void {
  const y = 4 * s - bob
  ctx.save()
  if (flip) {
    ctx.translate(32 * s, 0)
    ctx.scale(-1, 1)
  }

  // Far leg
  outlineRect(ctx, cx - 1 * s - stride, y + 20 * s, 4 * s, 6 * s, outfitDark)
  outlineRect(ctx, cx - 1 * s - stride, y + 25 * s, 4 * s, 3 * s, boot)

  // Body
  outlineRect(ctx, cx - 4 * s, y + 11 * s, 9 * s, 10 * s, outfit)
  px(ctx, cx - 4 * s, y + 18 * s, 9 * s, 3 * s, outfitDark)

  // Near leg
  outlineRect(ctx, cx + 1 * s + stride, y + 20 * s, 4 * s, 6 * s, outfitDark)
  outlineRect(ctx, cx + 1 * s + stride, y + 25 * s, 4 * s, 3 * s, boot)

  // Far arm
  outlineRect(ctx, cx - 2 * s - stride * 0.5, y + 12 * s, 3 * s, 7 * s, skin)

  // Head
  outlineRect(ctx, cx - 3 * s, y + 2 * s, 10 * s, 10 * s, skin)
  // Eye
  px(ctx, cx + 3 * s, y + 6 * s, 2 * s, 2 * s, INK)
  px(ctx, cx + 5 * s, y + 8 * s, 2 * s, 1 * s, skinDark)

  // Near arm
  outlineRect(ctx, cx + 2 * s + stride * 0.5, y + 12 * s, 3 * s, 7 * s, skin)

  drawHairSide(ctx, cx, y, s, hair, hairStyle)
  ctx.restore()
}

function drawHairDown(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  s: number,
  hair: string,
  style: string,
): void {
  // Top hair
  outlineRect(ctx, cx - 7 * s, y + 1 * s, 14 * s, 5 * s, hair)
  if (style === 'curly' || style === 'bun' || style === 'spiky' || style === 'short' || style === 'explorer') {
    // bangs
    px(ctx, cx - 6 * s, y + 5 * s, 3 * s, 2 * s, hair)
    px(ctx, cx + 3 * s, y + 5 * s, 3 * s, 2 * s, hair)
  }
  // Ponytail (reference sheet style)
  if (style !== 'none' && style !== 'cap' && style !== 'backwards') {
    outlineRect(ctx, cx + 5 * s, y + 3 * s, 5 * s, 8 * s, hair)
    outlineRect(ctx, cx + 6 * s, y + 10 * s, 4 * s, 4 * s, hair)
  }
  if (style === 'cap' || style === 'explorer') {
    const hat = style === 'explorer' ? '#c4a574' : '#e23b45'
    outlineRect(ctx, cx - 8 * s, y + 0 * s, 16 * s, 4 * s, hat)
    outlineRect(ctx, cx - 9 * s, y + 3 * s, 18 * s, 2 * s, hat)
  }
}

function drawHairUp(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  s: number,
  hair: string,
  style: string,
): void {
  outlineRect(ctx, cx - 7 * s, y + 1 * s, 14 * s, 8 * s, hair)
  if (style !== 'none' && style !== 'cap' && style !== 'backwards') {
    outlineRect(ctx, cx - 2 * s, y + 8 * s, 8 * s, 6 * s, hair)
  }
  if (style === 'cap' || style === 'explorer') {
    const hat = style === 'explorer' ? '#c4a574' : '#e23b45'
    outlineRect(ctx, cx - 8 * s, y + 0 * s, 16 * s, 5 * s, hat)
  }
}

function drawHairSide(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  s: number,
  hair: string,
  style: string,
): void {
  outlineRect(ctx, cx - 4 * s, y + 1 * s, 12 * s, 5 * s, hair)
  if (style !== 'none' && style !== 'cap' && style !== 'backwards') {
    // ponytail behind
    outlineRect(ctx, cx - 7 * s, y + 4 * s, 5 * s, 9 * s, hair)
  }
  if (style === 'cap' || style === 'explorer') {
    const hat = style === 'explorer' ? '#c4a574' : '#e23b45'
    outlineRect(ctx, cx - 5 * s, y + 0 * s, 14 * s, 4 * s, hat)
    outlineRect(ctx, cx + 6 * s, y + 2 * s, 5 * s, 2 * s, hat)
  }
}

function upscaleNearest(src: HTMLCanvasElement, target: number): HTMLCanvasElement {
  const out = createCanvas(target, target)
  const ctx = getCtx(out, false)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(src, 0, 0, target, target)
  return out
}

function resolveColors(loadout?: CharacterLoadoutData, overrides?: Partial<RpgWalkOptions>) {
  return {
    skin: overrides?.skinColor ?? loadout?.skin ?? '#ffd6ba',
    hair: overrides?.hairColor ?? loadout?.hairColor ?? '#2a3a6e',
    outfit: overrides?.outfitColor ?? loadout?.shirtColor ?? '#5a6a9e',
    boot: overrides?.bootColor ?? '#3a3040',
    hairStyle: loadout?.hair ?? 'short',
  }
}

/** One direction row: N centered frames. */
export function generateDirectionalWalkFrames(
  dir: WalkDir,
  opts: RpgWalkOptions,
): HTMLCanvasElement[] {
  const frameCount = Math.max(2, Math.min(48, opts.frameCount))
  const pixelBase = opts.pixelBase ?? 32
  const colors = resolveColors(opts.loadout, opts)
  const frames: HTMLCanvasElement[] = []

  for (let i = 0; i < frameCount; i++) {
    const phase = i / frameCount
    const pixel = drawRpgWalkPixel(pixelBase, dir, phase, colors)
    const scaled = upscaleNearest(pixel, opts.frameSize)
    frames.push(centerContentOnCanvas(scaled, opts.frameSize, 0.08))
  }
  return frames
}

export interface DirectionalWalkSheet {
  /** Row order: down, left, right, up */
  directions: WalkDir[]
  frameCount: number
  frameSize: number
  /** frames[dirIndex][frameIndex] */
  frames: HTMLCanvasElement[][]
  /** Packed sheet: rows=dirs, cols=frames */
  sheetCanvas: HTMLCanvasElement
  fps: number
  meta: {
    layout: 'rpg-maker-4dir'
    directions: WalkDir[]
    frameWidth: number
    frameHeight: number
    columns: number
    rows: number
    fps: number
  }
}

/** Classic RPG sheet: 4 rows (down/left/right/up) × N frame columns. */
export function generateRpgWalkSheet(opts: RpgWalkOptions): DirectionalWalkSheet {
  const frameCount = Math.max(2, Math.min(48, opts.frameCount))
  const frames = WALK_DIRS.map((dir) => generateDirectionalWalkFrames(dir, { ...opts, frameCount }))
  const sheet = createCanvas(frameCount * opts.frameSize, WALK_DIRS.length * opts.frameSize)
  const ctx = getCtx(sheet, false)
  ctx.imageSmoothingEnabled = false

  frames.forEach((row, ri) => {
    row.forEach((frame, fi) => {
      ctx.drawImage(frame, fi * opts.frameSize, ri * opts.frameSize)
    })
  })

  return {
    directions: [...WALK_DIRS],
    frameCount,
    frameSize: opts.frameSize,
    frames,
    sheetCanvas: sheet,
    fps: 10,
    meta: {
      layout: 'rpg-maker-4dir',
      directions: [...WALK_DIRS],
      frameWidth: opts.frameSize,
      frameHeight: opts.frameSize,
      columns: frameCount,
      rows: WALK_DIRS.length,
      fps: 10,
    },
  }
}

/** Multi-variant sheet like the reference: variants side-by-side, each with 4-dir rows stacked… 
 *  Simpler export: one mega-sheet with variants as column-groups.
 */
export function generateVariantWalkSheet(
  opts: RpgWalkOptions,
  hairColors: string[] = HAIR_VARIANT_COLORS.slice(0, 4),
  skinColors: string[] = [opts.loadout?.skin ?? SKIN_VARIANT_COLORS[0]],
): { canvas: HTMLCanvasElement; meta: Record<string, unknown> } {
  const frameCount = Math.max(2, Math.min(48, opts.frameCount))
  const variants: { hair: string; skin: string }[] = []
  for (const skin of skinColors) {
    for (const hair of hairColors) {
      variants.push({ hair, skin })
    }
  }

  const variantWidth = frameCount * opts.frameSize
  const canvas = createCanvas(
    variantWidth * variants.length,
    WALK_DIRS.length * opts.frameSize,
  )
  const ctx = getCtx(canvas, false)
  ctx.imageSmoothingEnabled = false

  variants.forEach((v, vi) => {
    const sheet = generateRpgWalkSheet({
      ...opts,
      frameCount,
      hairColor: v.hair,
      skinColor: v.skin,
    })
    ctx.drawImage(sheet.sheetCanvas, vi * variantWidth, 0)
  })

  return {
    canvas,
    meta: {
      layout: 'rpg-maker-4dir-variants',
      directions: WALK_DIRS,
      frameWidth: opts.frameSize,
      frameHeight: opts.frameSize,
      framesPerDirection: frameCount,
      variantCount: variants.length,
      variants,
      columnsPerVariant: frameCount,
      rows: WALK_DIRS.length,
    },
  }
}
