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

export function getCtx(
  canvas: HTMLCanvasElement,
  smooth = true,
): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.imageSmoothingEnabled = smooth
  if (smooth) ctx.imageSmoothingQuality = 'high'
  return ctx
}

function clamp(n: number): number {
  return Math.max(0, Math.min(255, n))
}

/** Opaque pixel bounding box (ignores near-transparent pixels). */
export function getOpaqueBounds(
  source: HTMLCanvasElement | HTMLImageElement,
  alphaThreshold = 16,
): { x: number; y: number; w: number; h: number } | null {
  const w = source.width
  const h = source.height
  const tmp = createCanvas(w, h)
  const ctx = getCtx(tmp, true)
  ctx.drawImage(source, 0, 0)
  const { data } = ctx.getImageData(0, 0, w, h)

  let minX = w
  let minY = h
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = data[(y * w + x) * 4 + 3]
      if (a < alphaThreshold) continue
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }

  if (maxX < 0) return null
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}

/**
 * Crop to opaque content and draw it dead-center in a square frame.
 */
export function centerContentOnCanvas(
  source: HTMLImageElement | HTMLCanvasElement,
  frameSize: number,
  padRatio = 0.08,
): HTMLCanvasElement {
  const out = createCanvas(frameSize, frameSize)
  const ctx = getCtx(out, true)
  ctx.clearRect(0, 0, frameSize, frameSize)

  const bounds = getOpaqueBounds(source)
  const pad = Math.max(2, Math.floor(frameSize * padRatio))
  const avail = frameSize - pad * 2

  if (!bounds) {
    // Fallback: center whole source
    const scale = Math.min(avail / source.width, avail / source.height)
    const dw = Math.max(1, Math.round(source.width * scale))
    const dh = Math.max(1, Math.round(source.height * scale))
    ctx.drawImage(
      source,
      Math.floor((frameSize - dw) / 2),
      Math.floor((frameSize - dh) / 2),
      dw,
      dh,
    )
    return out
  }

  const scale = Math.min(avail / bounds.w, avail / bounds.h)
  const dw = Math.max(1, Math.round(bounds.w * scale))
  const dh = Math.max(1, Math.round(bounds.h * scale))
  const dx = Math.floor((frameSize - dw) / 2)
  const dy = Math.floor((frameSize - dh) / 2)

  ctx.drawImage(
    source,
    bounds.x,
    bounds.y,
    bounds.w,
    bounds.h,
    dx,
    dy,
    dw,
    dh,
  )
  return out
}

/**
 * Fit uploaded art into a clean Nintendo-vector frame.
 * Character content is always drawn at the center of the frame.
 */
export function renderCleanVectorFrame(
  source: HTMLImageElement | HTMLCanvasElement,
  frameSize: FrameSize,
  palette: RGB[],
  options: {
    snapPalette?: boolean
    softOutline?: boolean
    /** @default 'center' — content bounding-box centered in frame */
    anchor?: 'center' | 'bottom'
  } = {},
): HTMLCanvasElement {
  const { snapPalette = true, softOutline = false, anchor = 'center' } = options

  let out: HTMLCanvasElement
  if (anchor === 'center') {
    out = centerContentOnCanvas(source, frameSize)
  } else {
    out = createCanvas(frameSize, frameSize)
    const ctx = getCtx(out, true)
    const pad = Math.max(4, Math.floor(frameSize * 0.06))
    const avail = frameSize - pad * 2
    const bounds = getOpaqueBounds(source)
    if (bounds) {
      const scale = Math.min(avail / bounds.w, avail / bounds.h)
      const dw = Math.max(1, Math.round(bounds.w * scale))
      const dh = Math.max(1, Math.round(bounds.h * scale))
      const dx = Math.floor((frameSize - dw) / 2)
      const dy = Math.floor(frameSize - pad - dh)
      ctx.drawImage(
        source,
        bounds.x,
        bounds.y,
        bounds.w,
        bounds.h,
        dx,
        dy,
        dw,
        dh,
      )
    } else {
      ctx.drawImage(source, pad, pad, avail, avail)
    }
  }

  if (snapPalette) {
    gentlePaletteSnap(out, palette)
  }

  if (softOutline) {
    applySoftOutline(out, { r: 45, g: 40, b: 50 }, 0.35)
  }

  return out
}

/** Mild palette snap that keeps soft edges (doesn't force binary alpha). */
function gentlePaletteSnap(canvas: HTMLCanvasElement, palette: RGB[]): void {
  const ctx = getCtx(canvas, true)
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const { data } = img

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (a < 12) {
      data[i + 3] = 0
      continue
    }
    // Keep near-skin blush pinks / soft antialias fringes lightly quantized
    const nearest = nearestColor(
      { r: data[i], g: data[i + 1], b: data[i + 2] },
      palette,
    )
    // Blend toward palette so edges stay soft
    const t = a > 220 ? 0.88 : 0.55
    data[i] = clamp(Math.round(data[i] * (1 - t) + nearest.r * t))
    data[i + 1] = clamp(Math.round(data[i + 1] * (1 - t) + nearest.g * t))
    data[i + 2] = clamp(Math.round(data[i + 2] * (1 - t) + nearest.b * t))
  }

  ctx.putImageData(img, 0, 0)
}

function applySoftOutline(
  canvas: HTMLCanvasElement,
  color: RGB,
  strength: number,
): void {
  const ctx = getCtx(canvas, true)
  const w = canvas.width
  const h = canvas.height
  const src = ctx.getImageData(0, 0, w, h)
  const out = ctx.createImageData(w, h)
  out.data.set(src.data)

  const alphaAt = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return 0
    return src.data[(y * w + x) * 4 + 3]
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      if (src.data[i + 3] > 40) continue
      const neighbor =
        alphaAt(x - 1, y) > 40 ||
        alphaAt(x + 1, y) > 40 ||
        alphaAt(x, y - 1) > 40 ||
        alphaAt(x, y + 1) > 40
      if (!neighbor) continue
      out.data[i] = color.r
      out.data[i + 1] = color.g
      out.data[i + 2] = color.b
      out.data[i + 3] = Math.round(255 * strength)
    }
  }
  ctx.putImageData(out, 0, 0)
}

export function cloneCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const c = createCanvas(source.width, source.height)
  getCtx(c, true).drawImage(source, 0, 0)
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

/** @deprecated use renderCleanVectorFrame — kept for call-site compatibility */
export function pixelateToStyle(
  source: HTMLImageElement | HTMLCanvasElement,
  frameSize: FrameSize,
  palette: RGB[],
): HTMLCanvasElement {
  return renderCleanVectorFrame(source, frameSize, palette)
}
