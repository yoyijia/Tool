import type { CharacterLoadout } from './characterParts'
import { DEFAULT_LOADOUT } from './characterParts'
import { centerContentOnCanvas, createCanvas, getCtx } from './pixelate'

const INK = '#1f1a22'

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
  stroke = true,
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
  if (stroke) {
    ctx.strokeStyle = INK
    ctx.lineWidth = Math.max(1.5, Math.min(w, h) * 0.08)
    ctx.lineJoin = 'round'
    ctx.stroke()
  }
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
  // cel shade
  ctx.fillStyle = shade(color, -28)
  ctx.globalAlpha = 0.35
  rr(ctx, -thick / 2, len * 0.45, thick, len * 0.55, thick / 2, shade(color, -28), false)
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
 * Draw one side-profile game-sprite frame (walk / run / idle),
 * matching Nintendo clean-vector walk sheets: outlined, cel-shaded, centered.
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

  // Character rig pivot near hip, vertically centered in logical space
  const hipX = 50 * s
  const hipY = 58 * s
  const phase = opts.phase
  const twoPi = Math.PI * 2

  const isRun = opts.kind === 'run'
  const isIdle = opts.kind === 'idle'
  const legAmp = isIdle ? 0.08 : isRun ? 0.85 : 0.7
  const armAmp = isIdle ? 0.12 : isRun ? 0.75 : 0.55
  const bobAmp = isIdle ? 1.2 * s : isRun ? 4.5 * s : 3 * s

  // Classic walk: sin for swing, |cos| for vertical bob (high at passing)
  const swing = Math.sin(phase * twoPi)
  const bob = Math.abs(Math.cos(phase * twoPi)) * bobAmp
  const frontLeg = swing * legAmp
  const backLeg = -swing * legAmp
  const frontArm = -swing * armAmp
  const backArm = swing * armAmp

  const bodyY = hipY - bob
  const headY = bodyY - 26 * s

  // Soft contact shadow (centered under feet)
  ctx.fillStyle = 'rgba(31,26,34,0.12)'
  ctx.beginPath()
  ctx.ellipse(hipX, 90 * s, 18 * s, 4 * s, 0, 0, Math.PI * 2)
  ctx.fill()

  const skin = loadout.skin
  const shirt = loadout.shirtColor
  const pants = loadout.pantsColor
  const hair = loadout.hairColor
  const shoe = '#e23b45'
  const sock = '#ffffff'

  // --- Far (back) arm ---
  limb(ctx, hipX + 2 * s, bodyY - 14 * s, 16 * s, 6 * s, backArm + 0.15, skin)

  // --- Far (back) leg ---
  limb(ctx, hipX - 2 * s, hipY - bob * 0.3, 22 * s, 7 * s, backLeg + 0.05, pants, shoe)
  // sock hint
  ctx.save()
  ctx.translate(hipX - 2 * s, hipY - bob * 0.3)
  ctx.rotate(backLeg + 0.05)
  rr(ctx, -3 * s, 16 * s, 6 * s, 4 * s, 2 * s, sock, false)
  ctx.restore()

  // --- Torso ---
  rr(ctx, hipX - 11 * s, bodyY - 22 * s, 22 * s, 26 * s, 8 * s, shirt)
  // cel shade on torso
  ctx.fillStyle = shade(shirt, -30)
  ctx.globalAlpha = 0.28
  rr(ctx, hipX - 11 * s, bodyY - 6 * s, 22 * s, 10 * s, 6 * s, shade(shirt, -30), false)
  ctx.globalAlpha = 1

  // Collar / pockets (explorer shirt vibe when tee)
  if (loadout.shirt === 'tee' || loadout.shirt === 'hoodie') {
    ctx.strokeStyle = INK
    ctx.lineWidth = 1.5 * s
    ctx.beginPath()
    ctx.moveTo(hipX - 4 * s, bodyY - 20 * s)
    ctx.lineTo(hipX, bodyY - 16 * s)
    ctx.lineTo(hipX + 4 * s, bodyY - 20 * s)
    ctx.stroke()
  }

  // Belt
  rr(ctx, hipX - 11 * s, bodyY + 2 * s, 22 * s, 3.5 * s, 1.5 * s, shade(pants, -40))

  // --- Near (front) leg ---
  limb(ctx, hipX + 3 * s, hipY - bob * 0.3, 22 * s, 7 * s, frontLeg - 0.05, pants, shoe)
  ctx.save()
  ctx.translate(hipX + 3 * s, hipY - bob * 0.3)
  ctx.rotate(frontLeg - 0.05)
  rr(ctx, -3 * s, 16 * s, 6 * s, 4 * s, 2 * s, sock, false)
  ctx.restore()

  // --- Head (side profile) ---
  ctx.beginPath()
  ctx.ellipse(hipX + 2 * s, headY, 13 * s, 13 * s, 0, 0, Math.PI * 2)
  ctx.fillStyle = skin
  ctx.fill()
  ctx.strokeStyle = INK
  ctx.lineWidth = 2 * s
  ctx.stroke()

  // Nose
  ctx.beginPath()
  ctx.ellipse(hipX + 13 * s, headY + 1 * s, 3 * s, 2.2 * s, 0, 0, Math.PI * 2)
  ctx.fillStyle = skin
  ctx.fill()
  ctx.stroke()

  // Eye (side)
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.ellipse(hipX + 7 * s, headY - 1 * s, 4 * s, 4.5 * s, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = INK
  ctx.lineWidth = 1.5 * s
  ctx.stroke()
  ctx.fillStyle = '#6b3e1a'
  ctx.beginPath()
  ctx.arc(hipX + 8 * s, headY - 0.5 * s, 1.8 * s, 0, Math.PI * 2)
  ctx.fill()

  // Smile
  ctx.strokeStyle = INK
  ctx.lineWidth = 1.5 * s
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(hipX + 6 * s, headY + 5 * s, 3 * s, 0.1 * Math.PI, 0.7 * Math.PI)
  ctx.stroke()

  // --- Hair / hat ---
  drawSideHair(ctx, hipX, headY, s, loadout.hair, hair, shirt)

  // --- Near (front) arm ---
  limb(ctx, hipX + 4 * s, bodyY - 14 * s, 16 * s, 6 * s, frontArm - 0.1, skin)

  // Accessory satchel
  if (loadout.accessory === 'satchel' || loadout.accessory === 'backpack') {
    ctx.fillStyle = loadout.accessoryColor
    ctx.beginPath()
    ctx.ellipse(hipX - 8 * s, bodyY + 4 * s, 6 * s, 5 * s, -0.3, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = INK
    ctx.lineWidth = 1.5 * s
    ctx.stroke()
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
  ctx.strokeStyle = INK
  ctx.lineWidth = 2 * s

  if (style === 'none') return

  if (style === 'cap' || style === 'explorer') {
    // Explorer / bucket hat (matches reference sheet)
    const hat = style === 'explorer' ? '#c4a574' : accent
    const band = '#6b4a2a'
    ctx.beginPath()
    ctx.ellipse(hx + 1 * s, hy - 8 * s, 15 * s, 8 * s, 0, Math.PI, Math.PI * 2)
    ctx.fillStyle = hat
    ctx.fill()
    ctx.stroke()
    // brim
    rr(ctx, hx - 14 * s, hy - 8 * s, 32 * s, 5 * s, 2 * s, hat)
    // band
    rr(ctx, hx - 12 * s, hy - 9 * s, 24 * s, 3 * s, 1 * s, band, false)
    // hair fringe under hat
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(hx - 6 * s, hy - 4 * s)
    ctx.lineTo(hx - 2 * s, hy + 2 * s)
    ctx.lineTo(hx + 2 * s, hy - 3 * s)
    ctx.lineTo(hx + 6 * s, hy + 1 * s)
    ctx.lineTo(hx + 10 * s, hy - 4 * s)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    return
  }

  if (style === 'backwards') {
    ctx.beginPath()
    ctx.ellipse(hx, hy - 8 * s, 14 * s, 7 * s, 0, Math.PI, Math.PI * 2)
    ctx.fillStyle = '#2a262e'
    ctx.fill()
    ctx.stroke()
    rr(ctx, hx - 16 * s, hy - 8 * s, 12 * s, 4 * s, 2 * s, '#2a262e')
    return
  }

  if (style === 'spiky' || style === 'curly') {
    ctx.beginPath()
    if (style === 'spiky') {
      ctx.moveTo(hx - 12 * s, hy - 2 * s)
      ctx.lineTo(hx - 8 * s, hy - 18 * s)
      ctx.lineTo(hx - 2 * s, hy - 6 * s)
      ctx.lineTo(hx + 2 * s, hy - 20 * s)
      ctx.lineTo(hx + 6 * s, hy - 6 * s)
      ctx.lineTo(hx + 12 * s, hy - 16 * s)
      ctx.lineTo(hx + 14 * s, hy - 2 * s)
      ctx.closePath()
    } else {
      ctx.arc(hx - 6 * s, hy - 10 * s, 8 * s, 0, Math.PI * 2)
      ctx.arc(hx + 4 * s, hy - 12 * s, 9 * s, 0, Math.PI * 2)
      ctx.arc(hx + 10 * s, hy - 6 * s, 7 * s, 0, Math.PI * 2)
    }
    ctx.fill()
    ctx.stroke()
    return
  }

  // short / bun default
  ctx.beginPath()
  ctx.ellipse(hx + 1 * s, hy - 8 * s, 13 * s, 9 * s, 0, Math.PI, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  if (style === 'bun') {
    ctx.beginPath()
    ctx.arc(hx - 2 * s, hy - 16 * s, 5 * s, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
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
