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

/**
 * Clean Nintendo-vector default palette
 * (chibi / Switch Sports / Miitopia-adjacent flat colors).
 */
export const NINTENDO_DEFAULT_PALETTE: RGB[] = [
  { r: 45, g: 40, b: 50 }, // soft ink
  { r: 255, g: 255, b: 255 },
  { r: 255, g: 214, b: 186 }, // skin light
  { r: 242, g: 186, b: 150 }, // skin mid
  { r: 255, g: 160, b: 170 }, // blush
  { r: 232, g: 90, b: 100 }, // coral / red shirt
  { r: 220, g: 60, b: 70 }, // deep red
  { r: 70, g: 150, b: 230 }, // blue shorts/jeans
  { r: 45, g: 110, b: 190 },
  { r: 160, g: 220, b: 80 }, // lime bag
  { r: 60, g: 55, b: 65 }, // dark hair / shoes
  { r: 90, g: 70, b: 55 }, // brown hair
  { r: 245, g: 245, b: 248 }, // white tee
  { r: 40, g: 40, b: 48 }, // overalls / black
  { r: 120, g: 200, b: 110 }, // grass
  { r: 90, g: 175, b: 85 },
  { r: 255, g: 200, b: 80 }, // accent gold
  { r: 180, g: 210, b: 240 }, // soft sky
]

const THEME_PALETTES: Record<string, RGB[]> = {
  overworld: [
    { r: 120, g: 205, b: 105 },
    { r: 90, g: 175, b: 85 },
    { r: 70, g: 145, b: 70 },
    { r: 210, g: 175, b: 110 },
    { r: 160, g: 120, b: 70 },
    { r: 130, g: 200, b: 245 },
    { r: 255, g: 245, b: 200 },
    { r: 255, g: 255, b: 255 },
    { r: 45, g: 40, b: 50 },
    { r: 232, g: 90, b: 100 },
    { r: 255, g: 160, b: 170 },
  ],
  forest: [
    { r: 55, g: 130, b: 70 },
    { r: 80, g: 160, b: 85 },
    { r: 110, g: 185, b: 95 },
    { r: 35, g: 85, b: 50 },
    { r: 140, g: 95, b: 55 },
    { r: 95, g: 65, b: 40 },
    { r: 220, g: 90, b: 100 },
    { r: 250, g: 225, b: 120 },
    { r: 45, g: 40, b: 50 },
    { r: 255, g: 255, b: 255 },
  ],
  coast: [
    { r: 245, g: 225, b: 165 },
    { r: 230, g: 200, b: 130 },
    { r: 90, g: 185, b: 230 },
    { r: 55, g: 145, b: 200 },
    { r: 35, g: 105, b: 165 },
    { r: 255, g: 255, b: 255 },
    { r: 160, g: 110, b: 70 },
    { r: 110, g: 195, b: 110 },
    { r: 45, g: 40, b: 50 },
    { r: 255, g: 180, b: 90 },
  ],
  mountain: [
    { r: 165, g: 165, b: 175 },
    { r: 125, g: 125, b: 138 },
    { r: 90, g: 90, b: 105 },
    { r: 200, g: 200, b: 210 },
    { r: 255, g: 255, b: 255 },
    { r: 110, g: 160, b: 100 },
    { r: 160, g: 110, b: 70 },
    { r: 210, g: 95, b: 80 },
    { r: 45, g: 40, b: 50 },
    { r: 140, g: 190, b: 230 },
  ],
  village: [
    { r: 220, g: 165, b: 115 },
    { r: 180, g: 125, b: 80 },
    { r: 140, g: 90, b: 55 },
    { r: 230, g: 95, b: 90 },
    { r: 250, g: 230, b: 180 },
    { r: 110, g: 180, b: 110 },
    { r: 120, g: 170, b: 220 },
    { r: 90, g: 90, b: 105 },
    { r: 45, g: 40, b: 50 },
    { r: 255, g: 255, b: 255 },
  ],
  dungeon: [
    { r: 95, g: 95, b: 115 },
    { r: 70, g: 70, b: 90 },
    { r: 120, g: 120, b: 140 },
    { r: 50, g: 50, b: 65 },
    { r: 210, g: 150, b: 70 },
    { r: 255, g: 195, b: 90 },
    { r: 180, g: 70, b: 85 },
    { r: 110, g: 180, b: 110 },
    { r: 45, g: 40, b: 50 },
    { r: 220, g: 220, b: 230 },
  ],
}

export function getThemePalette(theme: string): RGB[] {
  return THEME_PALETTES[theme] ?? THEME_PALETTES.overworld
}

export async function extractPaletteFromImage(
  img: HTMLImageElement,
  maxColors = 16,
): Promise<RGB[]> {
  const size = 96
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(img, 0, 0, size, size)
  const { data } = ctx.getImageData(0, 0, size, size)

  const buckets = new Map<string, { color: RGB; count: number }>()
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (a < 128) continue
    // Gentler quantize for vector flats
    const r = (data[i] >> 3) << 3
    const g = (data[i + 1] >> 3) << 3
    const b = (data[i + 2] >> 3) << 3
    const key = `${r},${g},${b}`
    const existing = buckets.get(key)
    if (existing) existing.count++
    else buckets.set(key, { color: { r, g, b }, count: 1 })
  }

  const sorted = [...buckets.values()].sort((a, b) => b.count - a.count)
  const palette = sorted.slice(0, maxColors).map((b) => b.color)

  const hasInk = palette.some((c) => c.r + c.g + c.b < 80)
  const hasWhite = palette.some((c) => c.r + c.g + c.b > 700)
  const hasBlush = palette.some(
    (c) => c.r > 200 && c.g > 120 && c.g < 200 && c.b > 130 && c.b < 200,
  )
  if (!hasInk) palette.unshift({ r: 45, g: 40, b: 50 })
  if (!hasWhite) palette.push({ r: 255, g: 255, b: 255 })
  if (!hasBlush) palette.push({ r: 255, g: 160, b: 170 })

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
