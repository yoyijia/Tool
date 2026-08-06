import type { CharacterLoadout } from './characterParts'
import { DEFAULT_LOADOUT } from './characterParts'
import {
  createPixelCanvas,
  logicalSizeFor,
  outlineCanvas,
  pixelBlob,
  px,
  shadeHex,
  upscalePixel,
} from './pixelArt'

export type CycleKind = 'walk' | 'run' | 'idle'

interface CycleOpts {
  loadout?: CharacterLoadout
  facing?: 'right' | 'left'
  phase: number
  kind: CycleKind
}

/**
 * Side-view pixel chibi walk / run / idle — FairPrice-style outlined RPG sprite.
 */
export function drawSideCycleFrame(
  size: number,
  opts: CycleOpts,
): HTMLCanvasElement {
  const loadout = opts.loadout ?? DEFAULT_LOADOUT
  const logical = logicalSizeFor(size)
  const { canvas, ctx } = createPixelCanvas(logical)
  const s = logical / 48
  const facing = opts.facing ?? 'right'
  const flip = facing === 'left'

  ctx.save()
  if (flip) {
    ctx.translate(logical, 0)
    ctx.scale(-1, 1)
  }

  const phase = opts.phase
  const twoPi = Math.PI * 2
  const isRun = opts.kind === 'run'
  const isIdle = opts.kind === 'idle'
  const legAmp = isIdle ? 0.5 : isRun ? 3.2 : 2.4
  const armAmp = isIdle ? 0.4 : isRun ? 2.8 : 2.0
  const bob = Math.abs(Math.cos(phase * twoPi)) * (isIdle ? 0.4 : isRun ? 1.6 : 1.1)
  const swing = Math.sin(phase * twoPi)

  const hipX = 24 * s
  const hipY = 30 * s - bob * s
  const headY = hipY - 14 * s

  const skin = loadout.skin
  const skinHi = shadeHex(skin, 28)
  const shirt = loadout.shirtColor
  const shirtHi = shadeHex(shirt, 32)
  const pants = loadout.pantsColor
  const hair = loadout.hairColor
  const hairHi = shadeHex(hair, 40)
  const bag = loadout.accessoryColor
  const shoe = '#1a1420'

  // Contact shadow
  ctx.fillStyle = 'rgba(26,20,32,0.22)'
  ctx.beginPath()
  ctx.ellipse(hipX, 44 * s, 10 * s, 2.2 * s, 0, 0, Math.PI * 2)
  ctx.fill()

  const backLegY = Math.round(swing * legAmp * s)
  const frontLegY = Math.round(-swing * legAmp * s)
  const backArmY = Math.round(-swing * armAmp * s)
  const frontArmY = Math.round(swing * armAmp * s)

  // Far arm
  px(ctx, hipX + 6 * s, hipY - 8 * s + backArmY, 4 * s, 9 * s, skin)

  // Far leg
  px(ctx, hipX - 3 * s, hipY + 2 * s + backLegY, 5 * s, 10 * s, pants)
  px(ctx, hipX - 4 * s, hipY + 11 * s + backLegY, 6 * s, 3 * s, shoe)

  // Torso (polo)
  px(ctx, hipX - 6 * s, hipY - 10 * s, 13 * s, 14 * s, shirt)
  px(ctx, hipX - 5 * s, hipY - 10 * s, 11 * s, 3 * s, shirtHi)
  // Collar V
  px(ctx, hipX - 1 * s, hipY - 10 * s, 3 * s, 2 * s, shadeHex(shirt, -25))

  // Near leg
  px(ctx, hipX + 1 * s, hipY + 2 * s + frontLegY, 5 * s, 10 * s, pants)
  px(ctx, hipX + 1 * s, hipY + 11 * s + frontLegY, 6 * s, 3 * s, shoe)

  // Head
  pixelBlob(ctx, hipX + 1 * s, headY, 9 * s, 9 * s, skin)
  px(ctx, hipX - 2 * s, headY - 4 * s, 8 * s, 4 * s, skinHi)

  // Blush
  px(ctx, hipX + 4 * s, headY + 2 * s, 3 * s, 2 * s, '#e88890')

  // Eye
  px(ctx, hipX + 4 * s, headY - 1 * s, 3 * s, 3 * s, '#1a1420')
  px(ctx, hipX + 5 * s, headY - 1 * s, 1 * s, 1 * s, '#ffffff')

  // Mouth
  px(ctx, hipX + 3 * s, headY + 4 * s, 3 * s, 1 * s, '#1a1420')

  drawPixelHair(ctx, hipX, headY, s, loadout.hair, hair, hairHi, shirt)

  // Near arm
  px(ctx, hipX + 5 * s, hipY - 8 * s + frontArmY, 4 * s, 9 * s, skin)

  // Shopping bag / satchel (held in front — FairPrice pose)
  if (loadout.accessory !== 'none') {
    px(ctx, hipX - 12 * s, hipY - 2 * s, 8 * s, 10 * s, bag)
    px(ctx, hipX - 11 * s, hipY - 2 * s, 6 * s, 2 * s, shadeHex(bag, 35))
    px(ctx, hipX - 10 * s, hipY - 4 * s, 2 * s, 3 * s, shadeHex(bag, -20))
    px(ctx, hipX - 8 * s, hipY - 4 * s, 2 * s, 3 * s, shadeHex(bag, -20))
  }

  ctx.restore()
  outlineCanvas(canvas)
  return upscalePixel(canvas, size)
}

function drawPixelHair(
  ctx: CanvasRenderingContext2D,
  hx: number,
  hy: number,
  s: number,
  style: string,
  color: string,
  hi: string,
  accent: string,
): void {
  if (style === 'none') return

  if (style === 'curly') {
    const curls: [number, number, number][] = [
      [0, -7, 6],
      [-6, -5, 5],
      [6, -5, 5],
      [-8, 0, 4.5],
      [8, 0, 4.5],
      [-4, -9, 4],
      [4, -9, 4],
      [0, -11, 4],
      [-7, 3, 4],
      [7, 3, 4],
    ]
    for (const [x, y, r] of curls) {
      pixelBlob(ctx, hx + x * s, hy + y * s, r * s, r * s, color)
    }
    pixelBlob(ctx, hx - 2 * s, hy - 8 * s, 3 * s, 2 * s, hi)
    return
  }

  if (style === 'cap') {
    pixelBlob(ctx, hx, hy - 5 * s, 9 * s, 4 * s, color)
    pixelBlob(ctx, hx, hy - 12 * s, 4 * s, 4 * s, color) // bun
    px(ctx, hx - 8 * s, hy - 7 * s, 16 * s, 5 * s, accent)
    px(ctx, hx + 2 * s, hy - 5 * s, 10 * s, 3 * s, accent)
    return
  }

  if (style === 'backwards') {
    px(ctx, hx - 8 * s, hy - 8 * s, 16 * s, 6 * s, '#1a1420')
    px(ctx, hx - 10 * s, hy - 6 * s, 6 * s, 3 * s, '#1a1420')
    px(ctx, hx - 2 * s, hy - 7 * s, 4 * s, 2 * s, '#8a9098')
    return
  }

  if (style === 'explorer') {
    pixelBlob(ctx, hx, hy - 2 * s, 5 * s, 3 * s, color)
    px(ctx, hx - 9 * s, hy - 8 * s, 18 * s, 5 * s, '#c4a574')
    px(ctx, hx - 11 * s, hy - 5 * s, 22 * s, 3 * s, '#c4a574')
    px(ctx, hx - 6 * s, hy - 7 * s, 12 * s, 2 * s, '#6b4a2a')
    return
  }

  if (style === 'spiky') {
    px(ctx, hx - 6 * s, hy - 10 * s, 4 * s, 8 * s, color)
    px(ctx, hx - 1 * s, hy - 12 * s, 4 * s, 9 * s, color)
    px(ctx, hx + 4 * s, hy - 9 * s, 4 * s, 7 * s, color)
    return
  }

  // short / bun
  pixelBlob(ctx, hx, hy - 5 * s, 9 * s, 5 * s, color)
  if (style === 'bun') {
    pixelBlob(ctx, hx, hy - 11 * s, 4 * s, 4 * s, color)
  }
}

export function generateSideCycleFrames(
  frameSize: number,
  frameCount: number,
  kind: CycleKind,
  loadout?: CharacterLoadout,
  facing: 'right' | 'left' = 'right',
): HTMLCanvasElement[] {
  const frames: HTMLCanvasElement[] = []
  for (let i = 0; i < frameCount; i++) {
    frames.push(
      drawSideCycleFrame(frameSize, {
        phase: i / frameCount,
        kind,
        loadout,
        facing,
      }),
    )
  }
  return frames
}
