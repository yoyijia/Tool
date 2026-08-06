import type { CharacterLoadoutData, FrameSize } from '../types'
import type { CharacterLoadout } from './characterParts'
import { DEFAULT_LOADOUT } from './characterParts'
import { createCanvas, getCtx } from './pixelate'
import {
  createPixelCanvas,
  logicalSizeFor,
  outlineCanvas,
  pixelBlob,
  px,
  shadeHex,
  upscalePixel,
} from './pixelArt'
import { drawSideCycleFrame } from './walkCycle'

export type WalkDir = 'down' | 'left' | 'right' | 'up'

export const WALK_DIRS: WalkDir[] = ['down', 'left', 'right', 'up']

export const HAIR_VARIANT_COLORS = [
  '#1a1420',
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

export interface RpgWalkOptions {
  frameSize: FrameSize
  frameCount: number
  loadout?: CharacterLoadoutData
  hairColor?: string
  skinColor?: string
  outfitColor?: string
  bootColor?: string
}

function resolveLoadout(opts: RpgWalkOptions): CharacterLoadout {
  const base = { ...(opts.loadout ?? DEFAULT_LOADOUT) }
  if (opts.hairColor) base.hairColor = opts.hairColor
  if (opts.skinColor) base.skin = opts.skinColor
  if (opts.outfitColor) base.shirtColor = opts.outfitColor
  if (opts.bootColor) base.pantsColor = opts.bootColor
  return base as CharacterLoadout
}

/** Pixel ¾ front / back walk frame. */
function drawPixelFrontBack(
  size: number,
  dir: 'down' | 'up',
  phase: number,
  loadout: CharacterLoadout,
): HTMLCanvasElement {
  const logical = logicalSizeFor(size)
  const { canvas, ctx } = createPixelCanvas(logical)
  const s = logical / 48
  const cx = 24 * s
  const swing = Math.sin(phase * Math.PI * 2)
  const bob = Math.abs(Math.cos(phase * Math.PI * 2)) * 1.1 * s
  const stride = swing * 2.2 * s
  const away = dir === 'up'

  const skin = loadout.skin
  const skinHi = shadeHex(skin, 28)
  const shirt = loadout.shirtColor
  const pants = loadout.pantsColor
  const hair = loadout.hairColor
  const shoe = '#1a1420'

  ctx.fillStyle = 'rgba(26,20,32,0.2)'
  ctx.beginPath()
  ctx.ellipse(cx, 44 * s, 10 * s, 2 * s, 0, 0, Math.PI * 2)
  ctx.fill()

  const bodyY = 22 * s - bob
  const headY = 13 * s - bob

  // Arms
  px(ctx, cx - 11 * s - stride * 0.4, bodyY + 2 * s, 4 * s, 9 * s, skin)
  px(ctx, cx + 7 * s + stride * 0.4, bodyY + 2 * s, 4 * s, 9 * s, skin)

  // Legs
  px(ctx, cx - 6 * s - stride, bodyY + 12 * s, 5 * s, 9 * s, pants)
  px(ctx, cx + 1 * s + stride, bodyY + 12 * s, 5 * s, 9 * s, pants)
  px(ctx, cx - 7 * s - stride, bodyY + 20 * s, 6 * s, 3 * s, shoe)
  px(ctx, cx + 1 * s + stride, bodyY + 20 * s, 6 * s, 3 * s, shoe)

  // Torso
  px(ctx, cx - 7 * s, bodyY, 14 * s, 14 * s, shirt)
  px(ctx, cx - 6 * s, bodyY, 12 * s, 3 * s, shadeHex(shirt, 30))

  // Head
  pixelBlob(ctx, cx, headY, 10 * s, 10 * s, skin)
  if (!away) {
    px(ctx, cx - 4 * s, headY - 5 * s, 8 * s, 4 * s, skinHi)
    px(ctx, cx - 7 * s, headY + 2 * s, 3 * s, 2 * s, '#e88890')
    px(ctx, cx + 4 * s, headY + 2 * s, 3 * s, 2 * s, '#e88890')
    px(ctx, cx - 5 * s, headY - 1 * s, 3 * s, 4 * s, '#1a1420')
    px(ctx, cx + 2 * s, headY - 1 * s, 3 * s, 4 * s, '#1a1420')
    px(ctx, cx - 1 * s, headY + 2 * s, 2 * s, 1 * s, '#1a1420')
    px(ctx, cx - 2 * s, headY + 5 * s, 4 * s, 1 * s, '#1a1420')
  }

  drawFrontHair(ctx, cx, headY, s, loadout.hair, hair, shirt, away)

  if (loadout.accessory !== 'none' && !away) {
    px(ctx, cx + 8 * s, bodyY + 6 * s, 7 * s, 9 * s, loadout.accessoryColor)
    px(ctx, cx + 9 * s, bodyY + 6 * s, 5 * s, 2 * s, shadeHex(loadout.accessoryColor, 30))
  }

  outlineCanvas(canvas)
  return upscalePixel(canvas, size)
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
  if (style === 'none') return

  if (style === 'curly') {
    for (const [x, y, r] of [
      [0, -8, 7],
      [-7, -5, 6],
      [7, -5, 6],
      [-9, 1, 5],
      [9, 1, 5],
      [0, -12, 5],
      [-6, 4, 4],
      [6, 4, 4],
    ] as const) {
      pixelBlob(ctx, cx + x * s, hy + y * s, r * s, r * s, color)
    }
    pixelBlob(ctx, cx - 2 * s, hy - 9 * s, 3 * s, 2 * s, shadeHex(color, 40))
    return
  }

  if (style === 'cap') {
    pixelBlob(ctx, cx, hy - 12 * s, 4 * s, 4 * s, color)
    pixelBlob(ctx, cx, hy - 4 * s, 9 * s, 4 * s, color)
    px(ctx, cx - 8 * s, hy - 7 * s, 16 * s, 5 * s, accent)
    if (!back) px(ctx, cx + 2 * s, hy - 5 * s, 10 * s, 3 * s, accent)
    else px(ctx, cx - 12 * s, hy - 5 * s, 10 * s, 3 * s, accent)
    return
  }

  if (style === 'backwards') {
    px(ctx, cx - 8 * s, hy - 8 * s, 16 * s, 6 * s, '#1a1420')
    px(ctx, cx - 10 * s, hy - 6 * s, 6 * s, 3 * s, '#1a1420')
    return
  }

  if (style === 'explorer') {
    px(ctx, cx - 9 * s, hy - 8 * s, 18 * s, 5 * s, '#c4a574')
    px(ctx, cx - 11 * s, hy - 5 * s, 22 * s, 3 * s, '#c4a574')
    return
  }

  if (style === 'spiky') {
    px(ctx, cx - 6 * s, hy - 10 * s, 4 * s, 8 * s, color)
    px(ctx, cx - 1 * s, hy - 12 * s, 4 * s, 9 * s, color)
    px(ctx, cx + 4 * s, hy - 9 * s, 4 * s, 7 * s, color)
    return
  }

  pixelBlob(ctx, cx, hy - 5 * s, 9 * s, 5 * s, color)
  if (style === 'bun' || back) {
    pixelBlob(ctx, cx, hy - 11 * s, 4 * s, 4 * s, color)
  }
}

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
      frames.push(drawPixelFrontBack(opts.frameSize, dir, phase, loadout))
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
    layout: 'pixel-rpg-4dir'
    style: 'pixel-art'
    directions: WalkDir[]
    frameWidth: number
    frameHeight: number
    columns: number
    rows: number
    fps: number
  }
}

export function generateRpgWalkSheet(opts: RpgWalkOptions): DirectionalWalkSheet {
  const frameCount = Math.max(2, Math.min(48, opts.frameCount))
  const frames = WALK_DIRS.map((dir) =>
    generateDirectionalWalkFrames(dir, { ...opts, frameCount }),
  )
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
      layout: 'pixel-rpg-4dir',
      style: 'pixel-art',
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
  skinColors: string[] = [opts.loadout?.skin ?? SKIN_VARIANT_COLORS[3]],
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
      layout: 'pixel-rpg-4dir-variants',
      style: 'pixel-art',
      directions: WALK_DIRS,
      frameWidth: opts.frameSize,
      frameHeight: opts.frameSize,
      framesPerDirection: frameCount,
      variantCount: variants.length,
      variants,
    },
  }
}
