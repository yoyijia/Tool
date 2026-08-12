/**
 * Classic chibi pixel-art helpers (RPG Maker / handheld style).
 * Draw in a low logical grid, then nearest-neighbor scale up.
 */

import { createCanvas, getCtx } from './pixelate'

export const PIXEL_INK = '#000000'

export function shadeHex(hex: string, amount: number): string {
  const h = hex.replace('#', '')
  const r = Math.max(0, Math.min(255, parseInt(h.slice(0, 2), 16) + amount))
  const g = Math.max(0, Math.min(255, parseInt(h.slice(2, 4), 16) + amount))
  const b = Math.max(0, Math.min(255, parseInt(h.slice(4, 6), 16) + amount))
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

/** Chunkier classic grid — 32 logical for most sizes. */
export function logicalSizeFor(frameSize: number): number {
  if (frameSize >= 512) return 48
  return 32
}

export function createPixelCanvas(logical: number): {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
} {
  const canvas = createCanvas(logical, logical)
  const ctx = getCtx(canvas, false)
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, logical, logical)
  return { canvas, ctx }
}

export function upscalePixel(
  source: HTMLCanvasElement,
  frameSize: number,
): HTMLCanvasElement {
  const out = createCanvas(frameSize, frameSize)
  const ctx = getCtx(out, false)
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, frameSize, frameSize)
  ctx.drawImage(source, 0, 0, frameSize, frameSize)
  return out
}

export function px(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)))
}

export function outlinedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  ink = PIXEL_INK,
): void {
  const rx = Math.round(x)
  const ry = Math.round(y)
  const rw = Math.max(1, Math.round(w))
  const rh = Math.max(1, Math.round(h))
  ctx.fillStyle = ink
  ctx.fillRect(rx - 1, ry - 1, rw + 2, rh + 2)
  ctx.fillStyle = fill
  ctx.fillRect(rx, ry, rw, rh)
}

/** Discrete pixel circle (no smooth ellipses). */
export function pixelCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string,
): void {
  ctx.fillStyle = color
  const R = Math.max(1, Math.round(r))
  const ox = Math.round(cx)
  const oy = Math.round(cy)
  for (let y = -R; y <= R; y++) {
    for (let x = -R; x <= R; x++) {
      if (x * x + y * y <= R * R + R * 0.35) {
        ctx.fillRect(ox + x, oy + y, 1, 1)
      }
    }
  }
}

export function pixelBlob(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: string,
): void {
  ctx.fillStyle = color
  const RX = Math.max(1, Math.round(rx))
  const RY = Math.max(1, Math.round(ry))
  const ox = Math.round(cx)
  const oy = Math.round(cy)
  for (let y = -RY; y <= RY; y++) {
    const t = 1 - (y * y) / (RY * RY || 1)
    if (t <= 0) continue
    const half = Math.round(RX * Math.sqrt(t))
    ctx.fillRect(ox - half, oy + y, half * 2 + 1, 1)
  }
}

/** 1px solid black outline around opaque pixels. */
export function outlineCanvas(
  canvas: HTMLCanvasElement,
  ink = PIXEL_INK,
): void {
  const ctx = getCtx(canvas, false)
  const w = canvas.width
  const h = canvas.height
  const src = ctx.getImageData(0, 0, w, h)
  const out = ctx.createImageData(w, h)
  out.data.set(src.data)
  const a = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return 0
    return src.data[(y * w + x) * 4 + 3]
  }
  const ir = parseInt(ink.slice(1, 3), 16)
  const ig = parseInt(ink.slice(3, 5), 16)
  const ib = parseInt(ink.slice(5, 7), 16)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      if (src.data[i + 3] > 40) continue
      const edge =
        a(x - 1, y) > 40 ||
        a(x + 1, y) > 40 ||
        a(x, y - 1) > 40 ||
        a(x, y + 1) > 40
      if (!edge) continue
      out.data[i] = ir
      out.data[i + 1] = ig
      out.data[i + 2] = ib
      out.data[i + 3] = 255
    }
  }
  ctx.putImageData(out, 0, 0)
}

/** Tiny 3×5 pixel font for sheet labels. */
const GLYPHS: Record<string, number[]> = {
  // rows of 3 bits, 5 rows
  a: [0, 2, 5, 7, 5],
  d: [0, 4, 5, 5, 6],
  e: [0, 7, 6, 1, 7],
  f: [0, 7, 6, 1, 1],
  g: [0, 6, 1, 5, 6],
  h: [0, 5, 7, 5, 5],
  i: [0, 2, 2, 2, 2],
  k: [0, 5, 6, 5, 5],
  l: [0, 1, 1, 1, 7],
  n: [0, 5, 7, 5, 5],
  o: [0, 2, 5, 5, 2],
  p: [0, 6, 5, 6, 1],
  r: [0, 6, 5, 6, 5],
  t: [0, 7, 2, 2, 2],
  u: [0, 5, 5, 5, 7],
  v: [0, 5, 5, 5, 2],
  w: [0, 5, 5, 7, 5],
  ' ': [0, 0, 0, 0, 0],
}

export function drawPixelText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = 'rgba(0,0,0,0.45)',
  scale = 1,
): void {
  const t = text.toLowerCase()
  let cursor = Math.round(x)
  const oy = Math.round(y)
  ctx.fillStyle = color
  for (const ch of t) {
    const g = GLYPHS[ch] ?? GLYPHS[' ']
    for (let row = 0; row < 5; row++) {
      const bits = g[row] ?? 0
      for (let col = 0; col < 3; col++) {
        if (bits & (1 << (2 - col))) {
          ctx.fillRect(cursor + col * scale, oy + row * scale, scale, scale)
        }
      }
    }
    cursor += 4 * scale
  }
}
