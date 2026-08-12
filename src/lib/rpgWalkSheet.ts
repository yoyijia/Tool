import type { CharacterLoadoutData, FrameSize } from '../types'
import type { CharacterLoadout } from './characterParts'
import { DEFAULT_LOADOUT } from './characterParts'
import { createCanvas, getCtx } from './pixelate'
import {
  createPixelCanvas,
  logicalSizeFor,
  outlineCanvas,
  pixelCircle,
  px,
  shadeHex,
  upscalePixel,
} from './pixelArt'
import { drawSideCycleFrame } from './walkCycle'

export type WalkDir = 'down' | 'left' | 'right' | 'up'

export const WALK_DIRS: WalkDir[] = ['down', 'left', 'right', 'up']

export const HAIR_VARIANT_COLORS = [
  '#2a262e',
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

/** Classic chibi front / back walk frame (32-grid). */
function drawPixelFrontBack(
  size: number,
  dir: 'down' | 'up',
  phase: number,
  loadout: CharacterLoadout,
): HTMLCanvasElement {
  const logical = logicalSizeFor(size)
  const { canvas, ctx } = createPixelCanvas(logical)
  const scale = logical / 32
  const S = (n: number) => Math.round(n * scale)
  const cx = S(16)
  const swing = Math.sin(phase * Math.PI * 2)
  const bob = Math.abs(Math.cos(phase * Math.PI * 2))
  const stride = Math.round(swing)
  const away = dir === 'up'

  const skin = loadout.skin
  const skinShade = shadeHex(skin, -28)
  const shirt = loadout.shirtColor
  const shirtShade = shadeHex(shirt, -28)
  const pants = loadout.pantsColor
  const pantsShade = shadeHex(pants, -28)
  const hair = loadout.hairColor
  const shoe = '#000000'

  px(ctx, cx - S(5), S(29), S(10), S(2), 'rgba(0,0,0,0.15)')

  const bodyY = S(14) - S(bob)
  const headY = S(7) - S(bob)

  // Arms
  px(ctx, cx - S(7) - S(stride), bodyY + S(1), S(3), S(6), skin)
  px(ctx, cx + S(4) + S(stride), bodyY + S(1), S(3), S(6), skin)

  // Legs
  px(ctx, cx - S(4) - S(stride), bodyY + S(8), S(3), S(6), pants)
  px(ctx, cx + S(1) + S(stride), bodyY + S(8), S(3), S(6), pants)
  px(ctx, cx - S(4) - S(stride), bodyY + S(11), S(3), S(3), pantsShade)
  px(ctx, cx + S(1) + S(stride), bodyY + S(11), S(3), S(3), pantsShade)
  px(ctx, cx - S(5) - S(stride), bodyY + S(13), S(4), S(2), shoe)
  px(ctx, cx + S(1) + S(stride), bodyY + S(13), S(4), S(2), shoe)

  // Torso
  px(ctx, cx - S(4), bodyY, S(8), S(9), shirt)
  px(ctx, cx - S(4), bodyY + S(6), S(8), S(3), shirtShade)

  // Head
  pixelCircle(ctx, cx, headY, S(7), skin)
  if (!away) {
    px(ctx, cx - S(3), headY + S(3), S(6), S(2), skinShade)
    px(ctx, cx - S(5), headY + S(1), S(2), S(1), '#ff9eaa')
    px(ctx, cx + S(3), headY + S(1), S(2), S(1), '#ff9eaa')
    px(ctx, cx - S(3), headY - S(1), S(1), S(2), '#000000')
    px(ctx, cx + S(2), headY - S(1), S(1), S(2), '#000000')
    px(ctx, cx - S(1), headY + S(3), S(3), S(1), '#000000')
  }

  drawFrontHair(ctx, cx, headY, S, loadout.hair, hair, shirt, away)

  if (loadout.accessory !== 'none' && !away) {
    px(ctx, cx + S(5), bodyY + S(4), S(4), S(5), loadout.accessoryColor)
  }

  outlineCanvas(canvas)
  return upscalePixel(canvas, size)
}

function drawFrontHair(
  ctx: CanvasRenderingContext2D,
  cx: number,
  hy: number,
  S: (n: number) => number,
  style: string,
  color: string,
  accent: string,
  back: boolean,
): void {
  if (style === 'none') return

  if (style === 'curly') {
    for (const [x, y, r] of [
      [0, -5, 5],
      [-5, -3, 4],
      [5, -3, 4],
      [-6, 1, 3],
      [6, 1, 3],
      [0, -8, 3],
      [-4, 3, 3],
      [4, 3, 3],
    ] as const) {
      pixelCircle(ctx, cx + S(x), hy + S(y), S(r), color)
    }
    return
  }

  if (style === 'cap') {
    pixelCircle(ctx, cx, hy - S(8), S(3), color)
    px(ctx, cx - S(6), hy - S(4), S(12), S(4), color)
    px(ctx, cx - S(6), hy - S(5), S(12), S(4), accent)
    if (!back) px(ctx, cx + S(1), hy - S(3), S(7), S(2), accent)
    else px(ctx, cx - S(8), hy - S(3), S(7), S(2), accent)
    return
  }

  if (style === 'backwards') {
    px(ctx, cx - S(6), hy - S(6), S(12), S(4), '#2a262e')
    px(ctx, cx - S(8), hy - S(4), S(5), S(2), '#2a262e')
    return
  }

  if (style === 'explorer') {
    px(ctx, cx - S(7), hy - S(6), S(14), S(4), '#c4a574')
    px(ctx, cx - S(8), hy - S(4), S(16), S(2), '#c4a574')
    return
  }

  if (style === 'spiky') {
    px(ctx, cx - S(4), hy - S(8), S(3), S(6), color)
    px(ctx, cx - S(1), hy - S(9), S(3), S(7), color)
    px(ctx, cx + S(3), hy - S(7), S(3), S(5), color)
    return
  }

  px(ctx, cx - S(6), hy - S(5), S(12), S(5), color)
  if (style === 'bun' || back) {
    pixelCircle(ctx, cx, hy - S(8), S(3), color)
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
    style: 'classic-chibi-pixel'
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
      style: 'classic-chibi-pixel',
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
      style: 'classic-chibi-pixel',
      directions: WALK_DIRS,
      frameWidth: opts.frameSize,
      frameHeight: opts.frameSize,
      framesPerDirection: frameCount,
      variantCount: variants.length,
      variants,
    },
  }
}
