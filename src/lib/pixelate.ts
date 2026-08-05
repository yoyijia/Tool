import type { FrameSize, RGB } from '../types'
import { nearestColor } from './palette'

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export function createCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

export function getCtx(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.imageSmoothingEnabled = false
  return ctx
}

/** Downscale with nearest-neighbor and quantize to palette. */
export function pixelateToStyle(
  source: HTMLImageElement | HTMLCanvasElement,
  frameSize: FrameSize,
  palette: RGB[],
  options: { outline?: boolean; contrast?: number } = {},
): HTMLCanvasElement {
  const { outline = true, contrast = 1.08 } = options
  const mid = createCanvas(frameSize, frameSize)
  const midCtx = getCtx(mid)

  // Fit character into frame with padding
  const pad = Math.max(1, Math.floor(frameSize * 0.08))
  const avail = frameSize - pad * 2
  const scale = Math.min(avail / source.width, avail / source.height)
  const dw = Math.max(1, Math.round(source.width * scale))
  const dh = Math.max(1, Math.round(source.height * scale))
  const dx = Math.floor((frameSize - dw) / 2)
  const dy = Math.floor(frameSize - pad - dh)

  midCtx.clearRect(0, 0, frameSize, frameSize)
  midCtx.drawImage(source, dx, dy, dw, dh)

  const img = midCtx.getImageData(0, 0, frameSize, frameSize)
  const { data } = img

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 40) {
      data[i + 3] = 0
      continue
    }
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]
    // Mild contrast boost for console punch
    r = clamp(Math.round(((r / 255 - 0.5) * contrast + 0.5) * 255))
    g = clamp(Math.round(((g / 255 - 0.5) * contrast + 0.5) * 255))
    b = clamp(Math.round(((b / 255 - 0.5) * contrast + 0.5) * 255))
    const nearest = nearestColor({ r, g, b }, palette)
    data[i] = nearest.r
    data[i + 1] = nearest.g
    data[i + 2] = nearest.b
    data[i + 3] = 255
  }

  midCtx.putImageData(img, 0, 0)

  if (outline) {
    applyPixelOutline(mid, { r: 0, g: 0, b: 0 })
  }

  return mid
}

function clamp(n: number): number {
  return Math.max(0, Math.min(255, n))
}

/** Classic console sprite outline around opaque pixels. */
export function applyPixelOutline(canvas: HTMLCanvasElement, color: RGB): void {
  const ctx = getCtx(canvas)
  const w = canvas.width
  const h = canvas.height
  const src = ctx.getImageData(0, 0, w, h)
  const out = ctx.createImageData(w, h)
  out.data.set(src.data)

  const opaque = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return false
    return src.data[(y * w + x) * 4 + 3] > 40
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      if (src.data[i + 3] > 40) continue
      const neighbor =
        opaque(x - 1, y) ||
        opaque(x + 1, y) ||
        opaque(x, y - 1) ||
        opaque(x, y + 1)
      if (neighbor) {
        out.data[i] = color.r
        out.data[i + 1] = color.g
        out.data[i + 2] = color.b
        out.data[i + 3] = 255
      }
    }
  }
  ctx.putImageData(out, 0, 0)
}

export function cloneCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const c = createCanvas(source.width, source.height)
  getCtx(c).drawImage(source, 0, 0)
  return c
}

export function canvasToDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png')
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string): void {
  const a = document.createElement('a')
  a.href = canvasToDataUrl(canvas)
  a.download = filename
  a.click()
}

export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}
