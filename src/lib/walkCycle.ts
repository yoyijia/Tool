import type { CharacterLoadout } from './characterParts'
import { DEFAULT_LOADOUT } from './characterParts'
import {
  createPixelCanvas,
  logicalSizeFor,
  outlineCanvas,
  pixelCircle,
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
 * Classic RPG Maker–style chibi side walk / run / idle.
 * Big head, tiny eyes, 1px black outline, stepped shade.
 */
export function drawSideCycleFrame(
  size: number,
  opts: CycleOpts,
): HTMLCanvasElement {
  const loadout = opts.loadout ?? DEFAULT_LOADOUT
  const logical = logicalSizeFor(size)
  const { canvas, ctx } = createPixelCanvas(logical)
  // Normalize coords as if drawing on 32 grid
  const scale = logical / 32
  const S = (n: number) => Math.round(n * scale)
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
  const legAmp = isIdle ? 0 : isRun ? 2 : 1
  const armAmp = isIdle ? 0 : isRun ? 2 : 1
  const bob = Math.abs(Math.cos(phase * twoPi)) * (isIdle ? 0 : isRun ? 1 : 1)
  const swing = Math.sin(phase * twoPi)

  const hipX = S(16)
  const hipY = S(20) - S(bob)
  const headY = hipY - S(10)

  const skin = loadout.skin
  const skinShade = shadeHex(skin, -28)
  const shirt = loadout.shirtColor
  const shirtShade = shadeHex(shirt, -28)
  const pants = loadout.pantsColor
  const pantsShade = shadeHex(pants, -28)
  const hair = loadout.hairColor
  const bag = loadout.accessoryColor
  const shoe = '#000000'

  px(ctx, hipX - S(5), S(29), S(10), S(2), 'rgba(0,0,0,0.15)')

  const backLeg = Math.round(swing * legAmp)
  const frontLeg = Math.round(-swing * legAmp)
  const backArm = Math.round(-swing * armAmp)
  const frontArm = Math.round(swing * armAmp)

  // Far arm
  px(ctx, hipX + S(4), hipY - S(6) + S(backArm), S(3), S(6), skin)

  // Far leg
  px(ctx, hipX - S(3), hipY + S(1) + S(backLeg), S(3), S(7), pants)
  px(ctx, hipX - S(3), hipY + S(4) + S(backLeg), S(3), S(4), pantsShade)
  px(ctx, hipX - S(4), hipY + S(7) + S(backLeg), S(4), S(2), shoe)

  // Torso
  px(ctx, hipX - S(4), hipY - S(7), S(8), S(9), shirt)
  px(ctx, hipX - S(4), hipY - S(1), S(8), S(3), shirtShade)

  // Near leg
  px(ctx, hipX + S(1), hipY + S(1) + S(frontLeg), S(3), S(7), pants)
  px(ctx, hipX + S(1), hipY + S(4) + S(frontLeg), S(3), S(4), pantsShade)
  px(ctx, hipX + S(1), hipY + S(7) + S(frontLeg), S(4), S(2), shoe)

  // Head — oversized chibi
  pixelCircle(ctx, hipX + S(1), headY, S(7), skin)
  px(ctx, hipX - S(2), headY + S(3), S(6), S(2), skinShade)

  // blush
  px(ctx, hipX + S(3), headY + S(1), S(2), S(1), '#ff9eaa')

  // eye — 1×2
  px(ctx, hipX + S(3), headY - S(1), S(1), S(2), '#000000')

  // mouth
  px(ctx, hipX + S(2), headY + S(3), S(2), S(1), '#000000')

  drawSideHair(ctx, hipX, headY, S, loadout.hair, hair, shirt)

  // Near arm
  px(ctx, hipX + S(4), hipY - S(6) + S(frontArm), S(3), S(6), skin)

  // bag
  if (loadout.accessory !== 'none') {
    px(ctx, hipX - S(8), hipY - S(2), S(5), S(6), bag)
    px(ctx, hipX - S(8), hipY - S(2), S(5), S(1), shadeHex(bag, 30))
  }

  ctx.restore()
  outlineCanvas(canvas)
  return upscalePixel(canvas, size)
}

function drawSideHair(
  ctx: CanvasRenderingContext2D,
  hx: number,
  hy: number,
  S: (n: number) => number,
  style: string,
  color: string,
  accent: string,
): void {
  if (style === 'none') return

  if (style === 'curly') {
    for (const [x, y, r] of [
      [0, -4, 4],
      [-4, -3, 3],
      [4, -3, 3],
      [-5, 1, 3],
      [5, 1, 3],
      [0, -7, 3],
      [-3, 3, 2],
      [3, 3, 2],
    ] as const) {
      pixelCircle(ctx, hx + S(x), hy + S(y), S(r), color)
    }
    return
  }

  if (style === 'cap') {
    pixelCircle(ctx, hx, hy - S(8), S(3), color)
    px(ctx, hx - S(6), hy - S(5), S(12), S(4), color)
    px(ctx, hx - S(6), hy - S(5), S(12), S(4), accent)
    px(ctx, hx + S(1), hy - S(3), S(7), S(2), accent)
    return
  }

  if (style === 'backwards') {
    px(ctx, hx - S(6), hy - S(6), S(12), S(4), '#2a262e')
    px(ctx, hx - S(8), hy - S(4), S(5), S(2), '#2a262e')
    return
  }

  if (style === 'explorer') {
    px(ctx, hx - S(7), hy - S(6), S(14), S(4), '#c4a574')
    px(ctx, hx - S(8), hy - S(4), S(16), S(2), '#c4a574')
    return
  }

  if (style === 'spiky') {
    px(ctx, hx - S(4), hy - S(8), S(3), S(6), color)
    px(ctx, hx - S(1), hy - S(9), S(3), S(7), color)
    px(ctx, hx + S(3), hy - S(7), S(3), S(5), color)
    return
  }

  px(ctx, hx - S(6), hy - S(5), S(12), S(5), color)
  if (style === 'bun') {
    pixelCircle(ctx, hx, hy - S(8), S(3), color)
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
