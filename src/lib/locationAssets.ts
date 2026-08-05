import type { LocationAsset, LocationCategory, LocationTheme, RGB } from '../types'
import { getThemePalette } from './palette'
import { applyPixelOutline, createCanvas, getCtx } from './pixelate'

type DrawFn = (ctx: CanvasRenderingContext2D, size: number, pal: RGB[], seed: number) => void

function p(pal: RGB[], i: number): string {
  const c = pal[i % pal.length]
  return `rgb(${c.r},${c.g},${c.b})`
}

function fill(ctx: CanvasRenderingContext2D, color: string): void {
  ctx.fillStyle = color
}

function rect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  fill(ctx, color)
  ctx.fillRect(x, y, w, h)
}

function px(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
): void {
  rect(ctx, x, y, 1, 1, color)
}

function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const drawGrass: DrawFn = (ctx, size, pal, seed) => {
  rect(ctx, 0, 0, size, size, p(pal, 0))
  for (let i = 0; i < size * 2; i++) {
    const x = Math.floor(hash(seed + i) * size)
    const y = Math.floor(hash(seed + i + 50) * size)
    px(ctx, x, y, p(pal, 1 + (i % 2)))
  }
  // Soft highlight edge
  for (let x = 0; x < size; x++) {
    if (hash(seed + x + 200) > 0.6) px(ctx, x, 0, p(pal, 2))
  }
}

const drawDirt: DrawFn = (ctx, size, pal, seed) => {
  rect(ctx, 0, 0, size, size, p(pal, 3))
  for (let i = 0; i < size; i++) {
    const x = Math.floor(hash(seed + i) * size)
    const y = Math.floor(hash(seed + i + 9) * size)
    px(ctx, x, y, p(pal, 4))
  }
}

const drawSand: DrawFn = (ctx, size, pal, seed) => {
  rect(ctx, 0, 0, size, size, p(pal, 0))
  for (let i = 0; i < size * 1.5; i++) {
    px(
      ctx,
      Math.floor(hash(seed + i) * size),
      Math.floor(hash(seed + i + 3) * size),
      p(pal, 1),
    )
  }
}

const drawStone: DrawFn = (ctx, size, pal) => {
  rect(ctx, 0, 0, size, size, p(pal, 0))
  const crack = Math.floor(size * 0.45)
  rect(ctx, 1, 1, size - 2, size - 2, p(pal, 1))
  // Brick-ish seams
  rect(ctx, 0, crack, size, 1, p(pal, 2))
  rect(ctx, crack, 0, 1, crack, p(pal, 2))
  rect(ctx, Math.floor(size * 0.7), crack, 1, size - crack, p(pal, 2))
  px(ctx, 2, 2, p(pal, 3))
}

const drawPath: DrawFn = (ctx, size, pal, seed) => {
  rect(ctx, 0, 0, size, size, p(pal, 3))
  for (let y = 2; y < size - 2; y += 3) {
    for (let x = 2; x < size - 2; x += 3) {
      if (hash(seed + x * 7 + y) > 0.35) {
        rect(ctx, x, y, 2, 2, p(pal, 4))
      }
    }
  }
}

const drawWater: DrawFn = (ctx, size, pal, seed) => {
  rect(ctx, 0, 0, size, size, p(pal, 2))
  const waveY = Math.floor(size * 0.35 + hash(seed) * size * 0.15)
  for (let x = 0; x < size; x++) {
    const y = waveY + Math.floor(Math.sin((x + seed) * 0.8) * 1.5)
    px(ctx, x, y, p(pal, 5) || p(pal, 3))
    if (x % 3 === 0) px(ctx, x, y + 2, p(pal, 3))
  }
  // Sparkle
  px(ctx, Math.floor(size * 0.2), Math.floor(size * 0.6), p(pal, 5) || '#fff')
  px(ctx, Math.floor(size * 0.7), Math.floor(size * 0.3), p(pal, 5) || '#fff')
}

const drawWaterEdge: DrawFn = (ctx, size, pal, seed) => {
  drawGrass(ctx, size, pal, seed)
  const shore = Math.floor(size * 0.55)
  rect(ctx, 0, shore, size, size - shore, p(pal, 2))
  for (let x = 0; x < size; x++) {
    const y = shore + Math.floor(Math.sin(x + seed) * 1.2)
    px(ctx, x, y, p(pal, 1))
    px(ctx, x, y + 1, p(pal, 3))
  }
}

const drawTree: DrawFn = (ctx, size, pal) => {
  const trunkW = Math.max(2, Math.floor(size * 0.18))
  const trunkX = Math.floor((size - trunkW) / 2)
  const trunkTop = Math.floor(size * 0.55)
  rect(ctx, trunkX, trunkTop, trunkW, size - trunkTop - 1, p(pal, 4))
  // Canopy blobs
  const cx = size / 2
  const canopyR = size * 0.32
  fill(ctx, p(pal, 1))
  ctx.beginPath()
  ctx.arc(cx, size * 0.38, canopyR, 0, Math.PI * 2)
  ctx.fill()
  fill(ctx, p(pal, 0))
  ctx.beginPath()
  ctx.arc(cx - size * 0.12, size * 0.42, canopyR * 0.7, 0, Math.PI * 2)
  ctx.fill()
  fill(ctx, p(pal, 2))
  ctx.beginPath()
  ctx.arc(cx + size * 0.1, size * 0.32, canopyR * 0.55, 0, Math.PI * 2)
  ctx.fill()
  // Highlight
  px(ctx, Math.floor(cx - 2), Math.floor(size * 0.28), p(pal, 8) || '#fff')
}

const drawBush: DrawFn = (ctx, size, pal, seed) => {
  const baseY = Math.floor(size * 0.7)
  fill(ctx, p(pal, 1))
  ctx.beginPath()
  ctx.ellipse(size * 0.5, baseY, size * 0.38, size * 0.22, 0, 0, Math.PI * 2)
  ctx.fill()
  fill(ctx, p(pal, 0))
  ctx.beginPath()
  ctx.ellipse(size * 0.35, baseY - 2, size * 0.22, size * 0.18, 0, 0, Math.PI * 2)
  ctx.fill()
  fill(ctx, p(pal, 2))
  ctx.beginPath()
  ctx.ellipse(size * 0.62, baseY - 1, size * 0.2, size * 0.16, 0, 0, Math.PI * 2)
  ctx.fill()
  if (hash(seed) > 0.5) {
    px(ctx, Math.floor(size * 0.4), Math.floor(size * 0.55), p(pal, 6))
    px(ctx, Math.floor(size * 0.55), Math.floor(size * 0.58), p(pal, 7))
  }
}

const drawRock: DrawFn = (ctx, size, pal) => {
  fill(ctx, p(pal, 0))
  ctx.beginPath()
  ctx.moveTo(size * 0.2, size * 0.75)
  ctx.lineTo(size * 0.35, size * 0.35)
  ctx.lineTo(size * 0.7, size * 0.3)
  ctx.lineTo(size * 0.85, size * 0.7)
  ctx.lineTo(size * 0.55, size * 0.85)
  ctx.closePath()
  ctx.fill()
  fill(ctx, p(pal, 3))
  ctx.beginPath()
  ctx.moveTo(size * 0.4, size * 0.4)
  ctx.lineTo(size * 0.65, size * 0.35)
  ctx.lineTo(size * 0.55, size * 0.55)
  ctx.closePath()
  ctx.fill()
}

const drawFlower: DrawFn = (ctx, size, pal, seed) => {
  const stemX = Math.floor(size / 2)
  rect(ctx, stemX, Math.floor(size * 0.45), 1, Math.floor(size * 0.4), p(pal, 1))
  const petal = p(pal, 6 + Math.floor(hash(seed) * 2))
  const cy = Math.floor(size * 0.4)
  px(ctx, stemX - 1, cy, petal)
  px(ctx, stemX + 1, cy, petal)
  px(ctx, stemX, cy - 1, petal)
  px(ctx, stemX, cy + 1, petal)
  px(ctx, stemX, cy, p(pal, 7))
}

const drawHouseWall: DrawFn = (ctx, size, pal) => {
  rect(ctx, 0, 0, size, size, p(pal, 0))
  // Plank lines
  for (let y = 3; y < size; y += 4) {
    rect(ctx, 0, y, size, 1, p(pal, 1))
  }
  px(ctx, 2, 2, p(pal, 2))
}

const drawHouseRoof: DrawFn = (ctx, size, pal) => {
  // Transparent base, triangular roof
  for (let y = 0; y < size; y++) {
    const inset = Math.floor((y / size) * (size / 2))
    const left = Math.floor(size / 2) - inset
    const right = Math.ceil(size / 2) + inset
    for (let x = left; x < right; x++) {
      px(ctx, x, y, y % 3 === 0 ? p(pal, 3) : p(pal, 4))
    }
  }
}

const drawDoor: DrawFn = (ctx, size, pal) => {
  rect(ctx, Math.floor(size * 0.25), Math.floor(size * 0.2), Math.floor(size * 0.5), Math.floor(size * 0.8), p(pal, 4))
  rect(ctx, Math.floor(size * 0.3), Math.floor(size * 0.25), Math.floor(size * 0.4), Math.floor(size * 0.7), p(pal, 1))
  px(ctx, Math.floor(size * 0.6), Math.floor(size * 0.55), p(pal, 7))
}

const drawWindow: DrawFn = (ctx, size, pal) => {
  rect(ctx, Math.floor(size * 0.2), Math.floor(size * 0.2), Math.floor(size * 0.6), Math.floor(size * 0.6), p(pal, 4))
  rect(ctx, Math.floor(size * 0.28), Math.floor(size * 0.28), Math.floor(size * 0.44), Math.floor(size * 0.44), p(pal, 6))
  rect(ctx, Math.floor(size * 0.48), Math.floor(size * 0.2), 1, Math.floor(size * 0.6), p(pal, 4))
  rect(ctx, Math.floor(size * 0.2), Math.floor(size * 0.48), Math.floor(size * 0.6), 1, p(pal, 4))
}

const drawFence: DrawFn = (ctx, size, pal) => {
  const postW = Math.max(2, Math.floor(size * 0.12))
  rect(ctx, Math.floor(size * 0.15), Math.floor(size * 0.25), postW, Math.floor(size * 0.65), p(pal, 4))
  rect(ctx, Math.floor(size * 0.7), Math.floor(size * 0.25), postW, Math.floor(size * 0.65), p(pal, 4))
  rect(ctx, Math.floor(size * 0.1), Math.floor(size * 0.4), Math.floor(size * 0.8), 2, p(pal, 3))
  rect(ctx, Math.floor(size * 0.1), Math.floor(size * 0.6), Math.floor(size * 0.8), 2, p(pal, 3))
}

const drawChest: DrawFn = (ctx, size, pal) => {
  const x = Math.floor(size * 0.15)
  const y = Math.floor(size * 0.35)
  const w = Math.floor(size * 0.7)
  const h = Math.floor(size * 0.5)
  rect(ctx, x, y, w, h, p(pal, 3))
  rect(ctx, x, y, w, Math.floor(h * 0.4), p(pal, 4))
  rect(ctx, x, y + Math.floor(h * 0.35), w, 2, p(pal, 7))
  px(ctx, Math.floor(size * 0.48), y + Math.floor(h * 0.5), p(pal, 7))
}

const drawSign: DrawFn = (ctx, size, pal) => {
  const post = Math.max(1, Math.floor(size * 0.1))
  rect(ctx, Math.floor(size / 2) - Math.floor(post / 2), Math.floor(size * 0.35), post, Math.floor(size * 0.55), p(pal, 4))
  rect(ctx, Math.floor(size * 0.2), Math.floor(size * 0.15), Math.floor(size * 0.6), Math.floor(size * 0.35), p(pal, 3))
  rect(ctx, Math.floor(size * 0.28), Math.floor(size * 0.22), Math.floor(size * 0.44), Math.floor(size * 0.08), p(pal, 4))
  rect(ctx, Math.floor(size * 0.28), Math.floor(size * 0.35), Math.floor(size * 0.3), Math.floor(size * 0.06), p(pal, 4))
}

const drawBridge: DrawFn = (ctx, size, pal) => {
  rect(ctx, 0, Math.floor(size * 0.4), size, Math.floor(size * 0.35), p(pal, 3))
  for (let x = 2; x < size; x += 4) {
    rect(ctx, x, Math.floor(size * 0.4), 1, Math.floor(size * 0.35), p(pal, 4))
  }
  rect(ctx, 0, Math.floor(size * 0.35), size, 2, p(pal, 1))
  rect(ctx, 0, Math.floor(size * 0.72), size, 2, p(pal, 1))
}

const drawTorch: DrawFn = (ctx, size, pal, seed) => {
  const px0 = Math.floor(size / 2)
  rect(ctx, px0, Math.floor(size * 0.4), 2, Math.floor(size * 0.5), p(pal, 4))
  const flame = hash(seed) > 0.5 ? p(pal, 5) : p(pal, 4)
  px(ctx, px0, Math.floor(size * 0.25), flame)
  px(ctx, px0 + 1, Math.floor(size * 0.28), p(pal, 7))
  px(ctx, px0 - 1, Math.floor(size * 0.3), flame)
  px(ctx, px0, Math.floor(size * 0.2), p(pal, 7))
}

const drawDungeonFloor: DrawFn = (ctx, size, pal) => {
  rect(ctx, 0, 0, size, size, p(pal, 0))
  rect(ctx, 1, 1, size - 2, size - 2, p(pal, 1))
  rect(ctx, 0, Math.floor(size / 2), size, 1, p(pal, 2))
  rect(ctx, Math.floor(size / 2), 0, 1, size, p(pal, 2))
  px(ctx, 2, 2, p(pal, 3))
}

const drawCliff: DrawFn = (ctx, size, pal) => {
  rect(ctx, 0, 0, size, size, p(pal, 1))
  for (let y = 0; y < size; y++) {
    const jagged = Math.floor(Math.sin(y * 0.7) * 2 + 2)
    rect(ctx, 0, y, jagged, 1, p(pal, 2))
    rect(ctx, size - jagged - 1, y, jagged, 1, p(pal, 0))
  }
  rect(ctx, 0, 0, size, 3, p(pal, 3))
}

interface AssetDef {
  name: string
  category: LocationCategory
  draw: DrawFn
  outline?: boolean
  themes?: LocationTheme[]
}

const ASSET_DEFS: AssetDef[] = [
  { name: 'Grass', category: 'ground', draw: drawGrass },
  { name: 'Dirt', category: 'ground', draw: drawDirt },
  { name: 'Sand', category: 'ground', draw: drawSand, themes: ['coast', 'overworld'] },
  { name: 'Stone Floor', category: 'ground', draw: drawStone, themes: ['mountain', 'dungeon', 'village'] },
  { name: 'Path', category: 'ground', draw: drawPath },
  { name: 'Dungeon Tile', category: 'ground', draw: drawDungeonFloor, themes: ['dungeon'] },
  { name: 'Water', category: 'water', draw: drawWater },
  { name: 'Shore', category: 'water', draw: drawWaterEdge },
  { name: 'Tree', category: 'nature', draw: drawTree, outline: true },
  { name: 'Bush', category: 'nature', draw: drawBush, outline: true },
  { name: 'Rock', category: 'nature', draw: drawRock, outline: true },
  { name: 'Flower', category: 'decor', draw: drawFlower, outline: true },
  { name: 'Cliff', category: 'nature', draw: drawCliff, themes: ['mountain'] },
  { name: 'Wall', category: 'structure', draw: drawHouseWall, themes: ['village', 'overworld'] },
  { name: 'Roof', category: 'structure', draw: drawHouseRoof, outline: true, themes: ['village', 'overworld'] },
  { name: 'Door', category: 'structure', draw: drawDoor, outline: true, themes: ['village'] },
  { name: 'Window', category: 'structure', draw: drawWindow, outline: true, themes: ['village'] },
  { name: 'Fence', category: 'props', draw: drawFence, outline: true },
  { name: 'Chest', category: 'props', draw: drawChest, outline: true },
  { name: 'Sign', category: 'props', draw: drawSign, outline: true },
  { name: 'Bridge', category: 'props', draw: drawBridge },
  { name: 'Torch', category: 'decor', draw: drawTorch, outline: true, themes: ['dungeon', 'village'] },
]

export function generateLocationAssets(
  theme: LocationTheme,
  tileSize: number,
  customPalette?: RGB[],
  seed = Date.now() % 10000,
): LocationAsset[] {
  const pal = customPalette?.length
    ? customPalette
    : getThemePalette(theme)

  return ASSET_DEFS.filter(
    (def) => !def.themes || def.themes.includes(theme),
  ).map((def, i) => {
    const canvas = createCanvas(tileSize, tileSize)
    const ctx = getCtx(canvas)
    ctx.clearRect(0, 0, tileSize, tileSize)
    def.draw(ctx, tileSize, pal, seed + i * 17)

    // Pixelate soft shapes: redraw via image data nearest-neighbor already at tile size
    // Quantize non-integer draws
    quantizeCanvas(canvas, pal)

    if (def.outline !== false && (def.category === 'nature' || def.category === 'props' || def.category === 'structure' || def.category === 'decor')) {
      if (def.outline) applyPixelOutline(canvas, { r: 0, g: 0, b: 0 })
    }

    return {
      id: `${theme}-${def.name.toLowerCase().replace(/\s+/g, '-')}-${seed}-${i}`,
      name: def.name,
      category: def.category,
      theme,
      canvas,
      tileSize,
      modular: true,
    }
  })
}

function quantizeCanvas(canvas: HTMLCanvasElement, palette: RGB[]): void {
  const ctx = getCtx(canvas)
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const { data } = img
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 40) {
      data[i + 3] = 0
      continue
    }
    let best = 0
    let bestD = Infinity
    for (let pi = 0; pi < palette.length; pi++) {
      const c = palette[pi]
      const dr = data[i] - c.r
      const dg = data[i + 1] - c.g
      const db = data[i + 2] - c.b
      const d = dr * dr + dg * dg + db * db
      if (d < bestD) {
        bestD = d
        best = pi
      }
    }
    const c = palette[best]
    data[i] = c.r
    data[i + 1] = c.g
    data[i + 2] = c.b
    data[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
}

export function packLocationSheet(
  assets: LocationAsset[],
  columns = 8,
): HTMLCanvasElement {
  if (!assets.length) return createCanvas(1, 1)
  const tileSize = assets[0].tileSize
  const cols = Math.min(columns, assets.length)
  const rows = Math.ceil(assets.length / cols)
  const sheet = createCanvas(cols * tileSize, rows * tileSize)
  const ctx = getCtx(sheet)
  assets.forEach((asset, i) => {
    const x = (i % cols) * tileSize
    const y = Math.floor(i / cols) * tileSize
    ctx.drawImage(asset.canvas, x, y)
  })
  return sheet
}

export function buildPreviewMap(
  assets: LocationAsset[],
  mapSize = 12,
  tileSize = 16,
): HTMLCanvasElement {
  const canvas = createCanvas(mapSize * tileSize, mapSize * tileSize)
  const ctx = getCtx(canvas)
  const byName = Object.fromEntries(assets.map((a) => [a.name, a]))
  const grass = byName['Grass'] ?? byName['Dirt'] ?? byName['Dungeon Tile'] ?? assets[0]
  const water = byName['Water']
  const tree = byName['Tree']
  const bush = byName['Bush']
  const path = byName['Path'] ?? byName['Stone Floor']
  const rock = byName['Rock']
  const flower = byName['Flower']
  const houseWall = byName['Wall']
  const roof = byName['Roof']
  const shore = byName['Shore']

  for (let y = 0; y < mapSize; y++) {
    for (let x = 0; x < mapSize; x++) {
      const tile = grass
      if (tile) ctx.drawImage(tile.canvas, x * tileSize, y * tileSize)
    }
  }

  // Path strip
  if (path) {
    for (let x = 2; x < mapSize - 2; x++) {
      ctx.drawImage(path.canvas, x * tileSize, Math.floor(mapSize / 2) * tileSize)
    }
  }

  // Water corner
  if (water) {
    for (let y = mapSize - 3; y < mapSize; y++) {
      for (let x = 0; x < 4; x++) {
        if (shore && y === mapSize - 3) {
          ctx.drawImage(shore.canvas, x * tileSize, y * tileSize)
        } else {
          ctx.drawImage(water.canvas, x * tileSize, y * tileSize)
        }
      }
    }
  }

  // Nature scatter
  const place = (asset: LocationAsset | undefined, x: number, y: number) => {
    if (asset) ctx.drawImage(asset.canvas, x * tileSize, y * tileSize)
  }
  place(tree, 3, 2)
  place(tree, 8, 1)
  place(bush, 5, 3)
  place(bush, 9, 4)
  place(rock, 1, 4)
  place(flower, 6, 3)
  place(flower, 7, 5)

  // Mini house
  if (houseWall && roof) {
    place(houseWall, 9, 7)
    place(houseWall, 10, 7)
    place(roof, 9, 6)
    place(roof, 10, 6)
    place(byName['Door'], 9, 7)
    place(byName['Window'], 10, 7)
  }

  return canvas
}
