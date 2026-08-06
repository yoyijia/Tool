import type { CharacterLoadout } from './characterParts'
import { DEFAULT_LOADOUT } from './characterParts'
import { centerContentOnCanvas, createCanvas, getCtx } from './pixelate'

function shade(hex: string, amount: number): string {
  const h = hex.replace('#', '')
  const r = Math.max(0, Math.min(255, parseInt(h.slice(0, 2), 16) + amount))
  const g = Math.max(0, Math.min(255, parseInt(h.slice(2, 4), 16) + amount))
  const b = Math.max(0, Math.min(255, parseInt(h.slice(4, 6), 16) + amount))
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

/** Flat rounded rect — no ink outlines (matches reference sheet). */
function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
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

function limb(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  len: number,
  thick: number,
  angle: number,
  color: string,
  shoeColor?: string,
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  rr(ctx, -thick / 2, 0, thick, len, thick / 2, color)
  ctx.globalAlpha = 0.3
  rr(ctx, -thick / 2, len * 0.5, thick, len * 0.5, thick / 2, shade(color, -24))
  ctx.globalAlpha = 1
  if (shoeColor) {
    rr(ctx, -thick * 0.65, len - thick * 0.15, thick * 1.45, thick * 0.7, thick * 0.25, shoeColor)
  }
  ctx.restore()
}

export type CycleKind = 'walk' | 'run' | 'idle'

interface CycleOpts {
  loadout?: CharacterLoadout
  facing?: 'right' | 'left'
  /** 0–1 phase within the cycle */
  phase: number
  kind: CycleKind
}

/**
 * Side-profile walk / run / idle frame in the reference sheet's
 * clean flat-vector Nintendo chibi style (no heavy outlines).
 */
export function drawSideCycleFrame(
  size: number,
  opts: CycleOpts,
): HTMLCanvasElement {
  const loadout = opts.loadout ?? DEFAULT_LOADOUT
  const raw = createCanvas(size, size)
  const ctx = getCtx(raw, true)
  const s = size / 100
  const facing = opts.facing ?? 'right'
  const flip = facing === 'left'

  ctx.save()
  if (flip) {
    ctx.translate(size, 0)
    ctx.scale(-1, 1)
  }

  const hipX = 50 * s
  const hipY = 58 * s
  const phase = opts.phase
  const twoPi = Math.PI * 2

  const isRun = opts.kind === 'run'
  const isIdle = opts.kind === 'idle'
  const legAmp = isIdle ? 0.08 : isRun ? 0.85 : 0.7
  const armAmp = isIdle ? 0.12 : isRun ? 0.75 : 0.55
  const bobAmp = isIdle ? 1.2 * s : isRun ? 4.5 * s : 3 * s

  const swing = Math.sin(phase * twoPi)
  const bob = Math.abs(Math.cos(phase * twoPi)) * bobAmp
  const frontLeg = swing * legAmp
  const backLeg = -swing * legAmp
  const frontArm = -swing * armAmp
  const backArm = swing * armAmp

  const bodyY = hipY - bob
  const headY = bodyY - 26 * s

  ctx.fillStyle = 'rgba(31,26,34,0.1)'
  ctx.beginPath()
  ctx.ellipse(hipX, 90 * s, 18 * s, 4 * s, 0, 0, Math.PI * 2)
  ctx.fill()

  const skin = loadout.skin
  const shirt = loadout.shirtColor
  const pants = loadout.pantsColor
  const hair = loadout.hairColor
  const shoe = '#2a262e'

  limb(ctx, hipX + 2 * s, bodyY - 14 * s, 16 * s, 6.5 * s, backArm + 0.15, skin)
  limb(ctx, hipX - 2 * s, hipY - bob * 0.3, 22 * s, 7.5 * s, backLeg + 0.05, pants, shoe)

  rr(ctx, hipX - 12 * s, bodyY - 22 * s, 24 * s, 26 * s, 9 * s, shirt)
  ctx.globalAlpha = 0.28
  rr(ctx, hipX - 12 * s, bodyY - 4 * s, 24 * s, 10 * s, 6 * s, shade(shirt, -28))
  ctx.globalAlpha = 1

  limb(ctx, hipX + 3 * s, hipY - bob * 0.3, 22 * s, 7.5 * s, frontLeg - 0.05, pants, shoe)

  // Head — large circle, flat fill
  ctx.beginPath()
  ctx.ellipse(hipX + 2 * s, headY, 14 * s, 14 * s, 0, 0, Math.PI * 2)
  ctx.fillStyle = skin
  ctx.fill()

  // Blush
  ctx.fillStyle = '#ff9eaa'
  ctx.beginPath()
  ctx.ellipse(hipX + 6 * s, headY + 4 * s, 3 * s, 2 * s, 0, 0, Math.PI * 2)
  ctx.fill()

  // Large black oval eye (side)
  ctx.fillStyle = '#2a262e'
  ctx.beginPath()
  ctx.ellipse(hipX + 7 * s, headY - 0.5 * s, 2.8 * s, 3.6 * s, 0, 0, Math.PI * 2)
  ctx.fill()

  // Tiny nose
  ctx.beginPath()
  ctx.arc(hipX + 13 * s, headY + 1.5 * s, 1.2 * s, 0, Math.PI * 2)
  ctx.fill()

  // Soft smile
  ctx.strokeStyle = '#2a262e'
  ctx.lineWidth = 1.4 * s
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(hipX + 6 * s, headY + 5.5 * s, 2.8 * s, 0.1 * Math.PI, 0.7 * Math.PI)
  ctx.stroke()

  drawSideHair(ctx, hipX, headY, s, loadout.hair, hair, shirt)

  limb(ctx, hipX + 4 * s, bodyY - 14 * s, 16 * s, 6.5 * s, frontArm - 0.1, skin)

  if (loadout.accessory === 'satchel' || loadout.accessory === 'backpack') {
    ctx.fillStyle = loadout.accessoryColor
    ctx.beginPath()
    ctx.ellipse(hipX - 8 * s, bodyY + 4 * s, 6.5 * s, 5.5 * s, -0.3, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
  return centerContentOnCanvas(raw, size, 0.12)
}

function drawSideHair(
  ctx: CanvasRenderingContext2D,
  hx: number,
  hy: number,
  s: number,
  style: string,
  color: string,
  accent: string,
): void {
  ctx.fillStyle = color

  if (style === 'none') return

  if (style === 'cap') {
    ctx.beginPath()
    ctx.ellipse(hx + 1 * s, hy - 8 * s, 15 * s, 8 * s, 0, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = accent
    ctx.beginPath()
    ctx.ellipse(hx + 1 * s, hy - 9 * s, 15 * s, 8 * s, 0, Math.PI, Math.PI * 2)
    ctx.fill()
    rr(ctx, hx - 2 * s, hy - 8 * s, 22 * s, 5 * s, 2 * s, accent)
    return
  }

  if (style === 'explorer') {
    const hat = '#c4a574'
    ctx.beginPath()
    ctx.moveTo(hx - 6 * s, hy - 4 * s)
    ctx.lineTo(hx - 2 * s, hy + 2 * s)
    ctx.lineTo(hx + 2 * s, hy - 3 * s)
    ctx.lineTo(hx + 6 * s, hy + 1 * s)
    ctx.lineTo(hx + 10 * s, hy - 4 * s)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = hat
    ctx.beginPath()
    ctx.ellipse(hx + 1 * s, hy - 8 * s, 15 * s, 8 * s, 0, Math.PI, Math.PI * 2)
    ctx.fill()
    rr(ctx, hx - 14 * s, hy - 8 * s, 32 * s, 5 * s, 2 * s, hat)
    return
  }

  if (style === 'backwards') {
    ctx.fillStyle = '#2a262e'
    ctx.beginPath()
    ctx.ellipse(hx, hy - 8 * s, 14 * s, 7 * s, 0, Math.PI, Math.PI * 2)
    ctx.fill()
    rr(ctx, hx - 16 * s, hy - 8 * s, 12 * s, 4 * s, 2 * s, '#2a262e')
    return
  }

  if (style === 'curly') {
    for (const [x, y, r] of [
      [-6, -10, 8],
      [4, -12, 9],
      [10, -6, 7],
      [-10, -4, 7],
      [0, -16, 7],
    ] as const) {
      ctx.beginPath()
      ctx.arc(hx + x * s, hy + y * s, r * s, 0, Math.PI * 2)
      ctx.fill()
    }
    return
  }

  if (style === 'spiky') {
    ctx.beginPath()
    ctx.moveTo(hx - 12 * s, hy - 2 * s)
    ctx.lineTo(hx - 8 * s, hy - 18 * s)
    ctx.lineTo(hx - 2 * s, hy - 6 * s)
    ctx.lineTo(hx + 2 * s, hy - 20 * s)
    ctx.lineTo(hx + 6 * s, hy - 6 * s)
    ctx.lineTo(hx + 12 * s, hy - 16 * s)
    ctx.lineTo(hx + 14 * s, hy - 2 * s)
    ctx.closePath()
    ctx.fill()
    return
  }

  ctx.beginPath()
  ctx.ellipse(hx + 1 * s, hy - 8 * s, 13 * s, 9 * s, 0, Math.PI, Math.PI * 2)
  ctx.fill()
  if (style === 'bun') {
    ctx.beginPath()
    ctx.arc(hx - 2 * s, hy - 16 * s, 5.5 * s, 0, Math.PI * 2)
    ctx.fill()
  }
}

/** Generate a full centered walk/run/idle cycle sheet as individual frames. */
export function generateSideCycleFrames(
  frameSize: number,
  frameCount: number,
  kind: CycleKind,
  loadout?: CharacterLoadout,
  facing: 'right' | 'left' = 'right',
): HTMLCanvasElement[] {
  const frames: HTMLCanvasElement[] = []
  for (let i = 0; i < frameCount; i++) {
    const phase = i / frameCount
    frames.push(
      drawSideCycleFrame(frameSize, {
        phase,
        kind,
        loadout,
        facing,
      }),
    )
  }
  return frames
}
