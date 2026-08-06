import type { CharacterLoadoutData, FrameSize } from '../types'
import type { CharacterLoadout } from './characterParts'
import { DEFAULT_LOADOUT } from './characterParts'
import { centerContentOnCanvas, createCanvas, getCtx } from './pixelate'
import { drawSideCycleFrame } from './walkCycle'

export type WalkDir = 'down' | 'left' | 'right' | 'up'

export const WALK_DIRS: WalkDir[] = ['down', 'left', 'right', 'up']

export const HAIR_VARIANT_COLORS = [
  '#3a3338',
  '#2a3a6e',
  '#6b3e1a',
  '#e88ab0',
  '#5ec4c0',
  '#b0b8c4',
  '#c9b86c',
  '#e85a20',
]

export const SKIN_VARIANT_COLORS = [
  '#ffd6ba',
  '#f2c9a0',
  '#d4a574',
  '#c68642',
  '#8d5524',
]

const INK = '#2d2832'
const BLUSH = '#ff9eaa'

export interface RpgWalkOptions {
  frameSize: FrameSize
  frameCount: number
  loadout?: CharacterLoadoutData
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

function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
  _stroke = false,
): void {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
}

function resolveLoadout(opts: RpgWalkOptions): CharacterLoadout {
  const base = { ...(opts.loadout ?? DEFAULT_LOADOUT) }
  if (opts.hairColor) base.hairColor = opts.hairColor
  if (opts.skinColor) base.skin = opts.skinColor
  if (opts.outfitColor) base.shirtColor = opts.outfitColor
  if (opts.bootColor) base.pantsColor = opts.bootColor
  return base as CharacterLoadout
}

/**
 * Clean-vector ¾ Nintendo chibi facing down or up (front/back).
 */
function drawVectorFrontBack(
  size: number,
  dir: 'down' | 'up',
  phase: number,
  loadout: CharacterLoadout,
): HTMLCanvasElement {
  const raw = createCanvas(size, size)
  const ctx = getCtx(raw, true)
  const s = size / 100
  const cx = 50 * s
  const swing = Math.sin(phase * Math.PI * 2)
  const bob = Math.abs(Math.cos(phase * Math.PI * 2)) * 2.5 * s
  const stride = swing * 4 * s

  const skin = loadout.skin
  const hair = loadout.hairColor
  const shirt = loadout.shirtColor
  const pants = loadout.pantsColor
  const shoe = '#2a262e'
  const facingAway = dir === 'up'

  // Shadow
  ctx.fillStyle = 'rgba(45,40,50,0.1)'
  ctx.beginPath()
  ctx.ellipse(cx, 90 * s, 18 * s, 4 * s, 0, 0, Math.PI * 2)
  ctx.fill()

  const bodyY = 52 * s - bob
  const headY = 28 * s - bob

  // Arms
  const armL = facingAway ? stride * 0.4 : -stride * 0.4
  const armR = facingAway ? -stride * 0.4 : stride * 0.4
  rr(ctx, cx - 20 * s + armL, bodyY - 2 * s, 8 * s, 16 * s, 4 * s, skin)
  rr(ctx, cx + 12 * s + armR, bodyY - 2 * s, 8 * s, 16 * s, 4 * s, skin)

  // Legs
  rr(ctx, cx - 12 * s - stride, bodyY + 18 * s, 9 * s, 16 * s, 4 * s, pants)
  rr(ctx, cx + 3 * s + stride, bodyY + 18 * s, 9 * s, 16 * s, 4 * s, pants)
  rr(ctx, cx - 13 * s - stride, bodyY + 32 * s, 11 * s, 5 * s, 2.5 * s, shoe)
  rr(ctx, cx + 2 * s + stride, bodyY + 32 * s, 11 * s, 5 * s, 2.5 * s, shoe)

  // Torso
  rr(ctx, cx - 14 * s, bodyY - 4 * s, 28 * s, 24 * s, 10 * s, shirt)
  ctx.globalAlpha = 0.25
  rr(ctx, cx - 14 * s, bodyY + 10 * s, 28 * s, 10 * s, 6 * s, shade(shirt, -28))
  ctx.globalAlpha = 1

  // Head — flat fill, no outline
  ctx.beginPath()
  ctx.ellipse(cx, headY, 17 * s, 17 * s, 0, 0, Math.PI * 2)
  ctx.fillStyle = skin
  ctx.fill()

  if (!facingAway) {
    ctx.fillStyle = BLUSH
    ctx.beginPath()
    ctx.ellipse(cx - 9 * s, headY + 4 * s, 4 * s, 2.5 * s, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(cx + 9 * s, headY + 4 * s, 4 * s, 2.5 * s, 0, 0, Math.PI * 2)
    ctx.fill()

    // Large oval eyes + tiny nose (reference sheet)
    ctx.fillStyle = INK
    ctx.beginPath()
    ctx.ellipse(cx - 6 * s, headY - 1 * s, 3 * s, 3.8 * s, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(cx + 6 * s, headY - 1 * s, 3 * s, 3.8 * s, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx, headY + 3 * s, 1 * s, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = INK
    ctx.lineWidth = 1.5 * s
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(cx, headY + 6 * s, 3.2 * s, 0.18 * Math.PI, 0.82 * Math.PI)
    ctx.stroke()
  }

  drawFrontHair(ctx, cx, headY, s, loadout.hair, hair, shirt, facingAway)

  if (loadout.accessory === 'satchel' && !facingAway) {
    ctx.fillStyle = loadout.accessoryColor
    ctx.beginPath()
    ctx.ellipse(cx + 14 * s, bodyY + 12 * s, 6 * s, 5 * s, 0.2, 0, Math.PI * 2)
    ctx.fill()
  }

  return centerContentOnCanvas(raw, size, 0.1)
}

function drawFrontHair(
  ctx: CanvasRenderingContext2D,
  cx: number,
  hy: number,
  s: number,
  style: string,
  color: string,
  accent: string,
  back: boolean,
): void {
  ctx.fillStyle = color

  if (style === 'none') return

  if (style === 'curly') {
    for (const [x, y, r] of [
      [0, -14, 12],
      [-12, -10, 10],
      [12, -10, 10],
      [-16, 0, 9],
      [16, 0, 9],
      [0, -20, 9],
      [-8, 6, 8],
      [8, 6, 8],
    ] as const) {
      ctx.beginPath()
      ctx.arc(cx + x * s, hy + y * s, r * s, 0, Math.PI * 2)
      ctx.fill()
    }
    return
  }

  if (style === 'explorer' || style === 'cap') {
    const hat = style === 'explorer' ? '#c4a574' : accent
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(cx - 8 * s, hy - 4 * s)
    ctx.lineTo(cx - 3 * s, hy + 2 * s)
    ctx.lineTo(cx + 3 * s, hy - 3 * s)
    ctx.lineTo(cx + 8 * s, hy + 1 * s)
    ctx.lineTo(cx + 10 * s, hy - 4 * s)
    ctx.closePath()
    ctx.fill()
    // bun under cap for red-cap look
    if (style === 'cap') {
      ctx.beginPath()
      ctx.arc(cx, hy - 18 * s, 6 * s, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = hat
    ctx.beginPath()
    ctx.ellipse(cx, hy - 10 * s, 16 * s, 8 * s, 0, Math.PI, Math.PI * 2)
    ctx.fill()
    rr(ctx, cx - (back ? 18 : 2) * s, hy - 10 * s, 24 * s, 5 * s, 2.5 * s, hat)
    if (style === 'explorer') {
      rr(ctx, cx - 12 * s, hy - 11 * s, 24 * s, 2.5 * s, 1 * s, '#6b4a2a')
    }
    return
  }

  if (style === 'backwards') {
    ctx.fillStyle = '#2a262e'
    ctx.beginPath()
    ctx.ellipse(cx, hy - 10 * s, 15 * s, 7 * s, 0, Math.PI, Math.PI * 2)
    ctx.fill()
    rr(ctx, cx - 18 * s, hy - 9 * s, 14 * s, 4 * s, 2 * s, '#2a262e')
    return
  }

  if (style === 'spiky') {
    ctx.beginPath()
    ctx.moveTo(cx - 14 * s, hy - 2 * s)
    ctx.lineTo(cx - 8 * s, hy - 18 * s)
    ctx.lineTo(cx - 2 * s, hy - 6 * s)
    ctx.lineTo(cx + 2 * s, hy - 20 * s)
    ctx.lineTo(cx + 8 * s, hy - 6 * s)
    ctx.lineTo(cx + 14 * s, hy - 16 * s)
    ctx.lineTo(cx + 14 * s, hy - 2 * s)
    ctx.closePath()
    ctx.fill()
    return
  }

  ctx.beginPath()
  ctx.ellipse(cx, hy - 8 * s, 15 * s, 10 * s, 0, Math.PI, Math.PI * 2)
  ctx.fill()
  if (style === 'bun' || back) {
    ctx.beginPath()
    ctx.arc(cx, hy - (back ? 4 : 18) * s, 6 * s, 0, Math.PI * 2)
    ctx.fill()
  }
}

/** One direction row in clean vector Nintendo style. */
export function generateDirectionalWalkFrames(
  dir: WalkDir,
  opts: RpgWalkOptions,
): HTMLCanvasElement[] {
  const frameCount = Math.max(2, Math.min(48, opts.frameCount))
  const loadout = resolveLoadout(opts)
  const frames: HTMLCanvasElement[] = []

  for (let i = 0; i < frameCount; i++) {
    const phase = i / frameCount
    if (dir === 'left' || dir === 'right') {
      frames.push(
        drawSideCycleFrame(opts.frameSize, {
          phase,
          kind: 'walk',
          loadout,
          facing: dir,
        }),
      )
    } else {
      frames.push(drawVectorFrontBack(opts.frameSize, dir, phase, loadout))
    }
  }
  return frames
}

export interface DirectionalWalkSheet {
  directions: WalkDir[]
  frameCount: number
  frameSize: number
  frames: HTMLCanvasElement[][]
  sheetCanvas: HTMLCanvasElement
  fps: number
  meta: {
    layout: 'nintendo-vector-4dir'
    style: 'clean-vector'
    directions: WalkDir[]
    frameWidth: number
    frameHeight: number
    columns: number
    rows: number
    fps: number
  }
}

/** 4-row walk sheet in clean vector Nintendo style (not pixel). */
export function generateRpgWalkSheet(opts: RpgWalkOptions): DirectionalWalkSheet {
  const frameCount = Math.max(2, Math.min(48, opts.frameCount))
  const frames = WALK_DIRS.map((dir) =>
    generateDirectionalWalkFrames(dir, { ...opts, frameCount }),
  )
  const sheet = createCanvas(frameCount * opts.frameSize, WALK_DIRS.length * opts.frameSize)
  const ctx = getCtx(sheet, true)

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
      layout: 'nintendo-vector-4dir',
      style: 'clean-vector',
      directions: [...WALK_DIRS],
      frameWidth: opts.frameSize,
      frameHeight: opts.frameSize,
      columns: frameCount,
      rows: WALK_DIRS.length,
      fps: 10,
    },
  }
}

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
  const ctx = getCtx(canvas, true)

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
      layout: 'nintendo-vector-4dir-variants',
      style: 'clean-vector',
      directions: WALK_DIRS,
      frameWidth: opts.frameSize,
      frameHeight: opts.frameSize,
      framesPerDirection: frameCount,
      variantCount: variants.length,
      variants,
    },
  }
}
