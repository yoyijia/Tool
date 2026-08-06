/**
 * High-fidelity pixel-art helpers.
 * Draw in a low logical grid, then nearest-neighbor scale to output size.
 */

import { createCanvas, getCtx } from './pixelate'

export const PIXEL_INK = '#1a1420'

export function shadeHex(hex: string, amount: number): string {
  const h = hex.replace('#', '')
  const r = Math.max(0, Math.min(255, parseInt(h.slice(0, 2), 16) + amount))
  const g = Math.max(0, Math.min(255, parseInt(h.slice(2, 4), 16) + amount))
  const b = Math.max(0, Math.min(255, parseInt(h.slice(4, 6), 16) + amount))
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

/** Logical pixel size for character sprites before upscale. */
export function logicalSizeFor(frameSize: number): number {
  if (frameSize >= 512) return 64
  if (frameSize >= 128) return 48
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

/** Nearest-neighbor upscale to square frameSize. */
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
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
}

/** Filled rect with 1px dark outline (pixel RPG silhouette). */
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
  const rw = Math.round(w)
  const rh = Math.round(h)
  ctx.fillStyle = ink
  ctx.fillRect(rx - 1, ry - 1, rw + 2, rh + 2)
  ctx.fillStyle = fill
  ctx.fillRect(rx, ry, rw, rh)
}

/** Soft blob approximated as stacked pixel ovals (for curly hair, produce). */
export function pixelBlob(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: string,
): void {
  ctx.fillStyle = color
  for (let y = -ry; y <= ry; y++) {
    const t = 1 - (y * y) / (ry * ry || 1)
    if (t <= 0) continue
    const half = Math.round(rx * Math.sqrt(t))
    ctx.fillRect(Math.round(cx - half), Math.round(cy + y), half * 2 + 1, 1)
  }
}

/** Draw ink outline around opaque pixels (1px). */
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
  const [ir, ig, ib] = [
    parseInt(ink.slice(1, 3), 16),
    parseInt(ink.slice(3, 5), 16),
    parseInt(ink.slice(5, 7), 16),
  ]
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
