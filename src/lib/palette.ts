import type { RGB } from '../types'

export function rgbToHex({ r, g, b }: RGB): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

export function colorDist(a: RGB, b: RGB): number {
  const dr = a.r - b.r
  const dg = a.g - b.g
  const db = a.b - b.b
  return dr * dr + dg * dg + db * db
}

export function nearestColor(c: RGB, palette: RGB[]): RGB {
  let best = palette[0]
  let bestD = Infinity
  for (const p of palette) {
    const d = colorDist(c, p)
    if (d < bestD) {
      bestD = d
      best = p
    }
  }
  return best
}

/** Classic console-friendly default palette (Nintendo-inspired, not copied). */
export const NINTENDO_DEFAULT_PALETTE: RGB[] = [
  { r: 0, g: 0, b: 0 },
  { r: 255, g: 255, b: 255 },
  { r: 228, g: 59, b: 68 },
  { r: 255, g: 163, b: 0 },
  { r: 255, g: 222, b: 89 },
  { r: 56, g: 176, b: 80 },
  { r: 34, g: 120, b: 60 },
  { r: 66, g: 165, b: 245 },
  { r: 30, g: 90, b: 180 },
  { r: 160, g: 100, b: 60 },
  { r: 240, g: 190, b: 140 },
  { r: 120, g: 80, b: 40 },
  { r: 180, g: 180, b: 190 },
  { r: 90, g: 90, b: 100 },
  { r: 255, g: 120, b: 160 },
  { r: 140, g: 80, b: 200 },
]

const THEME_PALETTES: Record<string, RGB[]> = {
  overworld: [
    { r: 90, g: 200, b: 90 },
    { r: 56, g: 160, b: 70 },
    { r: 40, g: 120, b: 50 },
    { r: 200, g: 160, b: 90 },
    { r: 140, g: 100, b: 50 },
    { r: 100, g: 190, b: 255 },
    { r: 255, g: 240, b: 180 },
    { r: 255, g: 255, b: 255 },
    { r: 0, g: 0, b: 0 },
    { r: 228, g: 59, b: 68 },
  ],
  forest: [
    { r: 34, g: 100, b: 40 },
    { r: 50, g: 140, b: 55 },
    { r: 90, g: 170, b: 70 },
    { r: 20, g: 60, b: 30 },
    { r: 120, g: 80, b: 40 },
    { r: 80, g: 50, b: 25 },
    { r: 180, g: 60, b: 70 },
    { r: 240, g: 220, b: 100 },
    { r: 0, g: 0, b: 0 },
    { r: 255, g: 255, b: 255 },
  ],
  coast: [
    { r: 240, g: 220, b: 150 },
    { r: 220, g: 190, b: 110 },
    { r: 70, g: 170, b: 220 },
    { r: 40, g: 120, b: 180 },
    { r: 20, g: 80, b: 140 },
    { r: 255, g: 255, b: 255 },
    { r: 160, g: 100, b: 60 },
    { r: 90, g: 190, b: 90 },
    { r: 0, g: 0, b: 0 },
    { r: 255, g: 180, b: 80 },
  ],
  mountain: [
    { r: 140, g: 140, b: 150 },
    { r: 100, g: 100, b: 110 },
    { r: 70, g: 70, b: 80 },
    { r: 180, g: 180, b: 190 },
    { r: 255, g: 255, b: 255 },
    { r: 90, g: 140, b: 80 },
    { r: 160, g: 100, b: 60 },
    { r: 200, g: 80, b: 60 },
    { r: 0, g: 0, b: 0 },
    { r: 120, g: 180, b: 220 },
  ],
  village: [
    { r: 200, g: 140, b: 90 },
    { r: 160, g: 100, b: 60 },
    { r: 120, g: 70, b: 40 },
    { r: 220, g: 80, b: 70 },
    { r: 240, g: 220, b: 160 },
    { r: 90, g: 160, b: 90 },
    { r: 100, g: 150, b: 200 },
    { r: 80, g: 80, b: 90 },
    { r: 0, g: 0, b: 0 },
    { r: 255, g: 255, b: 255 },
  ],
  dungeon: [
    { r: 70, g: 70, b: 85 },
    { r: 50, g: 50, b: 65 },
    { r: 100, g: 100, b: 115 },
    { r: 40, g: 40, b: 50 },
    { r: 180, g: 120, b: 40 },
    { r: 255, g: 180, b: 60 },
    { r: 140, g: 40, b: 50 },
    { r: 90, g: 160, b: 90 },
    { r: 0, g: 0, b: 0 },
    { r: 200, g: 200, b: 210 },
  ],
}

export function getThemePalette(theme: string): RGB[] {
  return THEME_PALETTES[theme] ?? THEME_PALETTES.overworld
}

export async function extractPaletteFromImage(
  img: HTMLImageElement,
  maxColors = 16,
): Promise<RGB[]> {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(img, 0, 0, size, size)
  const { data } = ctx.getImageData(0, 0, size, size)

  const buckets = new Map<string, { color: RGB; count: number }>()
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (a < 128) continue
    // Quantize to reduce noise
    const r = (data[i] >> 4) << 4
    const g = (data[i + 1] >> 4) << 4
    const b = (data[i + 2] >> 4) << 4
    const key = `${r},${g},${b}`
    const existing = buckets.get(key)
    if (existing) existing.count++
    else buckets.set(key, { color: { r, g, b }, count: 1 })
  }

  const sorted = [...buckets.values()].sort((a, b) => b.count - a.count)
  const palette = sorted.slice(0, maxColors).map((b) => b.color)

  // Always include black & white for outlines / highlights
  const hasBlack = palette.some((c) => c.r + c.g + c.b < 40)
  const hasWhite = palette.some((c) => c.r + c.g + c.b > 700)
  if (!hasBlack) palette.unshift({ r: 0, g: 0, b: 0 })
  if (!hasWhite) palette.push({ r: 255, g: 255, b: 255 })

  return palette.slice(0, maxColors)
}

export function mergePalettes(...palettes: RGB[][]): RGB[] {
  const seen = new Set<string>()
  const out: RGB[] = []
  for (const pal of palettes) {
    for (const c of pal) {
      const key = `${c.r},${c.g},${c.b}`
      if (!seen.has(key)) {
        seen.add(key)
        out.push(c)
      }
    }
  }
  return out
}
