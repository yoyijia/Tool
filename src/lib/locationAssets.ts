import type { LocationAsset, LocationCategory, LocationTheme, RGB } from '../types'
import { getThemePalette, rgbToHex } from './palette'
import { createCanvas, getCtx } from './pixelate'

type DrawFn = (ctx: CanvasRenderingContext2D, size: number, pal: RGB[], seed: number) => void

function c(pal: RGB[], i: number): string {
  return rgbToHex(pal[i % pal.length])
}

function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function softShade(
  ctx: CanvasRenderingContext2D,
  size: number,
  color: string,
  alpha = 0.12,
): void {
  ctx.fillStyle = color
  ctx.globalAlpha = alpha
  ctx.fillRect(0, size * 0.55, size, size * 0.45)
  ctx.globalAlpha = 1
}

const drawGrass: DrawFn = (ctx, size, pal, seed) => {
  ctx.fillStyle = c(pal, 0)
  ctx.fillRect(0, 0, size, size)
  softShade(ctx, size, c(pal, 2), 0.18)
  // Soft tufts
  ctx.fillStyle = c(pal, 1)
  for (let i = 0; i < 7; i++) {
    const x = hash(seed + i) * size
    const y = hash(seed + i + 20) * size
    ctx.beginPath()
    ctx.ellipse(x, y, size * 0.06, size * 0.035, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = c(pal, 2)
  for (let i = 0; i < 4; i++) {
    const x = hash(seed + i + 40) * size
    const y = hash(seed + i + 60) * size
    ctx.beginPath()
    ctx.ellipse(x, y, size * 0.04, size * 0.025, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}

const drawDirt: DrawFn = (ctx, size, pal, seed) => {
  ctx.fillStyle = c(pal, 3)
  ctx.fillRect(0, 0, size, size)
  softShade(ctx, size, c(pal, 4), 0.2)
  ctx.fillStyle = c(pal, 4)
  for (let i = 0; i < 5; i++) {
    ctx.beginPath()
    ctx.ellipse(
      hash(seed + i) * size,
      hash(seed + i + 9) * size,
      size * 0.05,
      size * 0.035,
      0,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }
}

const drawSand: DrawFn = (ctx, size, pal, seed) => {
  ctx.fillStyle = c(pal, 0)
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = c(pal, 1)
  for (let i = 0; i < 6; i++) {
    ctx.beginPath()
    ctx.ellipse(
      hash(seed + i) * size,
      hash(seed + i + 3) * size,
      size * 0.045,
      size * 0.03,
      0,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }
}

const drawStone: DrawFn = (ctx, size, pal) => {
  ctx.fillStyle = c(pal, 0)
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = c(pal, 1)
  roundRect(ctx, size * 0.06, size * 0.06, size * 0.88, size * 0.88, size * 0.08)
  ctx.fill()
  ctx.strokeStyle = c(pal, 2)
  ctx.lineWidth = Math.max(2, size * 0.03)
  ctx.beginPath()
  ctx.moveTo(size * 0.08, size * 0.5)
  ctx.lineTo(size * 0.92, size * 0.5)
  ctx.moveTo(size * 0.5, size * 0.08)
  ctx.lineTo(size * 0.5, size * 0.5)
  ctx.moveTo(size * 0.7, size * 0.5)
  ctx.lineTo(size * 0.7, size * 0.92)
  ctx.stroke()
  // Soft highlight
  ctx.fillStyle = c(pal, 3)
  ctx.globalAlpha = 0.35
  ctx.beginPath()
  ctx.ellipse(size * 0.28, size * 0.28, size * 0.08, size * 0.05, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
}

const drawPath: DrawFn = (ctx, size, pal, seed) => {
  ctx.fillStyle = c(pal, 3)
  ctx.fillRect(0, 0, size, size)
  softShade(ctx, size, c(pal, 4), 0.15)
  ctx.fillStyle = c(pal, 4)
  for (let y = size * 0.12; y < size * 0.9; y += size * 0.22) {
    for (let x = size * 0.12; x < size * 0.9; x += size * 0.22) {
      if (hash(seed + x + y) > 0.3) {
        roundRect(ctx, x, y, size * 0.14, size * 0.12, size * 0.03)
        ctx.fill()
      }
    }
  }
}

const drawWater: DrawFn = (ctx, size, pal, seed) => {
  ctx.fillStyle = c(pal, 2)
  ctx.fillRect(0, 0, size, size)
  const waveY = size * (0.35 + hash(seed) * 0.1)
  ctx.strokeStyle = c(pal, 5) || '#ffffff'
  ctx.globalAlpha = 0.55
  ctx.lineWidth = Math.max(2, size * 0.035)
  ctx.lineCap = 'round'
  ctx.beginPath()
  for (let x = 0; x <= size; x += size * 0.08) {
    const y = waveY + Math.sin((x / size) * Math.PI * 3 + seed) * size * 0.04
    if (x === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
  ctx.beginPath()
  for (let x = 0; x <= size; x += size * 0.08) {
    const y = waveY + size * 0.18 + Math.sin((x / size) * Math.PI * 3 + seed + 1) * size * 0.03
    if (x === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
  // Sparkles
  ctx.globalAlpha = 0.8
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(size * 0.25, size * 0.6, size * 0.025, 0, Math.PI * 2)
  ctx.arc(size * 0.7, size * 0.35, size * 0.02, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
}

const drawWaterEdge: DrawFn = (ctx, size, pal, seed) => {
  drawGrass(ctx, size, pal, seed)
  const shore = size * 0.52
  ctx.fillStyle = c(pal, 2)
  ctx.beginPath()
  ctx.moveTo(0, shore)
  for (let x = 0; x <= size; x += size * 0.1) {
    ctx.lineTo(x, shore + Math.sin(x * 0.2 + seed) * size * 0.04)
  }
  ctx.lineTo(size, size)
  ctx.lineTo(0, size)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = c(pal, 1)
  ctx.globalAlpha = 0.5
  ctx.beginPath()
  ctx.moveTo(0, shore - size * 0.04)
  for (let x = 0; x <= size; x += size * 0.1) {
    ctx.lineTo(x, shore - size * 0.04 + Math.sin(x * 0.2 + seed) * size * 0.03)
  }
  ctx.lineTo(size, shore + size * 0.08)
  ctx.lineTo(0, shore + size * 0.08)
  ctx.closePath()
  ctx.fill()
  ctx.globalAlpha = 1
}

const drawTree: DrawFn = (ctx, size, pal) => {
  // Trunk
  ctx.fillStyle = c(pal, 4)
  roundRect(ctx, size * 0.42, size * 0.55, size * 0.16, size * 0.38, size * 0.04)
  ctx.fill()
  // Canopy blobs — clean vector
  const layers = [
    { x: 0.5, y: 0.38, r: 0.28, col: 1 },
    { x: 0.35, y: 0.44, r: 0.2, col: 0 },
    { x: 0.65, y: 0.42, r: 0.2, col: 2 },
    { x: 0.5, y: 0.28, r: 0.18, col: 1 },
  ]
  for (const L of layers) {
    ctx.fillStyle = c(pal, L.col)
    ctx.beginPath()
    ctx.arc(size * L.x, size * L.y, size * L.r, 0, Math.PI * 2)
    ctx.fill()
  }
  // Soft highlight
  ctx.fillStyle = '#ffffff'
  ctx.globalAlpha = 0.25
  ctx.beginPath()
  ctx.arc(size * 0.42, size * 0.28, size * 0.07, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
}

const drawBush: DrawFn = (ctx, size, pal, seed) => {
  const baseY = size * 0.72
  const blobs = [
    { x: 0.5, y: baseY, rx: 0.34, ry: 0.2, col: 1 },
    { x: 0.32, y: baseY - size * 0.04, rx: 0.2, ry: 0.16, col: 0 },
    { x: 0.68, y: baseY - size * 0.03, rx: 0.18, ry: 0.15, col: 2 },
  ]
  for (const b of blobs) {
    ctx.fillStyle = c(pal, b.col)
    ctx.beginPath()
    ctx.ellipse(size * b.x, b.y, size * b.rx, size * b.ry, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  if (hash(seed) > 0.4) {
    ctx.fillStyle = c(pal, 6)
    ctx.beginPath()
    ctx.arc(size * 0.4, size * 0.6, size * 0.035, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = c(pal, 7)
    ctx.beginPath()
    ctx.arc(size * 0.58, size * 0.62, size * 0.03, 0, Math.PI * 2)
    ctx.fill()
  }
}

const drawRock: DrawFn = (ctx, size, pal) => {
  ctx.fillStyle = c(pal, 0)
  ctx.beginPath()
  ctx.moveTo(size * 0.2, size * 0.75)
  ctx.quadraticCurveTo(size * 0.15, size * 0.45, size * 0.38, size * 0.32)
  ctx.quadraticCurveTo(size * 0.6, size * 0.22, size * 0.78, size * 0.4)
  ctx.quadraticCurveTo(size * 0.92, size * 0.6, size * 0.82, size * 0.78)
  ctx.quadraticCurveTo(size * 0.55, size * 0.9, size * 0.2, size * 0.75)
  ctx.fill()
  ctx.fillStyle = c(pal, 3)
  ctx.globalAlpha = 0.45
  ctx.beginPath()
  ctx.ellipse(size * 0.48, size * 0.42, size * 0.12, size * 0.07, -0.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
}

const drawFlower: DrawFn = (ctx, size, pal, seed) => {
  ctx.strokeStyle = c(pal, 1)
  ctx.lineWidth = Math.max(2, size * 0.04)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(size * 0.5, size * 0.85)
  ctx.quadraticCurveTo(size * 0.52, size * 0.65, size * 0.5, size * 0.48)
  ctx.stroke()
  const petal = c(pal, 6 + Math.floor(hash(seed) * 2))
  const cy = size * 0.42
  const pr = size * 0.08
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2
    ctx.fillStyle = petal
    ctx.beginPath()
    ctx.ellipse(
      size * 0.5 + Math.cos(a) * size * 0.1,
      cy + Math.sin(a) * size * 0.1,
      pr,
      pr * 0.75,
      a,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }
  ctx.fillStyle = c(pal, 7)
  ctx.beginPath()
  ctx.arc(size * 0.5, cy, size * 0.055, 0, Math.PI * 2)
  ctx.fill()
}

const drawHouseWall: DrawFn = (ctx, size, pal) => {
  ctx.fillStyle = c(pal, 0)
  ctx.fillRect(0, 0, size, size)
  ctx.strokeStyle = c(pal, 1)
  ctx.lineWidth = Math.max(1.5, size * 0.02)
  for (let y = size * 0.18; y < size; y += size * 0.18) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(size, y)
    ctx.stroke()
  }
  ctx.fillStyle = c(pal, 2)
  ctx.globalAlpha = 0.2
  ctx.fillRect(0, 0, size * 0.2, size)
  ctx.globalAlpha = 1
}

const drawHouseRoof: DrawFn = (ctx, size, pal) => {
  ctx.fillStyle = c(pal, 3)
  ctx.beginPath()
  ctx.moveTo(size * 0.5, size * 0.08)
  ctx.lineTo(size * 0.95, size * 0.78)
  ctx.lineTo(size * 0.05, size * 0.78)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = c(pal, 4)
  ctx.beginPath()
  ctx.moveTo(size * 0.5, size * 0.18)
  ctx.lineTo(size * 0.82, size * 0.7)
  ctx.lineTo(size * 0.5, size * 0.7)
  ctx.closePath()
  ctx.fill()
  // Soft ridge highlight
  ctx.strokeStyle = '#ffffff'
  ctx.globalAlpha = 0.3
  ctx.lineWidth = Math.max(2, size * 0.03)
  ctx.beginPath()
  ctx.moveTo(size * 0.5, size * 0.12)
  ctx.lineTo(size * 0.5, size * 0.7)
  ctx.stroke()
  ctx.globalAlpha = 1
}

const drawDoor: DrawFn = (ctx, size, pal) => {
  ctx.fillStyle = c(pal, 4)
  roundRect(ctx, size * 0.22, size * 0.12, size * 0.56, size * 0.8, size * 0.08)
  ctx.fill()
  ctx.fillStyle = c(pal, 1)
  roundRect(ctx, size * 0.28, size * 0.18, size * 0.44, size * 0.68, size * 0.06)
  ctx.fill()
  ctx.fillStyle = c(pal, 7)
  ctx.beginPath()
  ctx.arc(size * 0.62, size * 0.55, size * 0.045, 0, Math.PI * 2)
  ctx.fill()
}

const drawWindow: DrawFn = (ctx, size, pal) => {
  ctx.fillStyle = c(pal, 4)
  roundRect(ctx, size * 0.16, size * 0.16, size * 0.68, size * 0.68, size * 0.08)
  ctx.fill()
  ctx.fillStyle = c(pal, 6)
  roundRect(ctx, size * 0.24, size * 0.24, size * 0.52, size * 0.52, size * 0.05)
  ctx.fill()
  ctx.strokeStyle = c(pal, 4)
  ctx.lineWidth = Math.max(2, size * 0.04)
  ctx.beginPath()
  ctx.moveTo(size * 0.5, size * 0.24)
  ctx.lineTo(size * 0.5, size * 0.76)
  ctx.moveTo(size * 0.24, size * 0.5)
  ctx.lineTo(size * 0.76, size * 0.5)
  ctx.stroke()
}

const drawFence: DrawFn = (ctx, size, pal) => {
  const postW = size * 0.12
  ctx.fillStyle = c(pal, 4)
  roundRect(ctx, size * 0.18, size * 0.22, postW, size * 0.6, size * 0.03)
  ctx.fill()
  roundRect(ctx, size * 0.7, size * 0.22, postW, size * 0.6, size * 0.03)
  ctx.fill()
  ctx.fillStyle = c(pal, 3)
  roundRect(ctx, size * 0.12, size * 0.38, size * 0.76, size * 0.08, size * 0.03)
  ctx.fill()
  roundRect(ctx, size * 0.12, size * 0.58, size * 0.76, size * 0.08, size * 0.03)
  ctx.fill()
}

const drawChest: DrawFn = (ctx, size, pal) => {
  const x = size * 0.14
  const y = size * 0.32
  const w = size * 0.72
  const h = size * 0.52
  ctx.fillStyle = c(pal, 3)
  roundRect(ctx, x, y, w, h, size * 0.06)
  ctx.fill()
  ctx.fillStyle = c(pal, 4)
  roundRect(ctx, x, y, w, h * 0.42, size * 0.06)
  ctx.fill()
  ctx.fillStyle = c(pal, 7)
  roundRect(ctx, x, y + h * 0.36, w, size * 0.05, size * 0.02)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(size * 0.5, y + h * 0.58, size * 0.05, 0, Math.PI * 2)
  ctx.fill()
}

const drawSign: DrawFn = (ctx, size, pal) => {
  ctx.fillStyle = c(pal, 4)
  roundRect(ctx, size * 0.45, size * 0.4, size * 0.1, size * 0.5, size * 0.03)
  ctx.fill()
  ctx.fillStyle = c(pal, 3)
  roundRect(ctx, size * 0.18, size * 0.12, size * 0.64, size * 0.38, size * 0.06)
  ctx.fill()
  ctx.fillStyle = c(pal, 4)
  roundRect(ctx, size * 0.28, size * 0.2, size * 0.44, size * 0.07, size * 0.02)
  ctx.fill()
  roundRect(ctx, size * 0.28, size * 0.32, size * 0.3, size * 0.06, size * 0.02)
  ctx.fill()
}

const drawBridge: DrawFn = (ctx, size, pal) => {
  ctx.fillStyle = c(pal, 3)
  roundRect(ctx, 0, size * 0.38, size, size * 0.34, size * 0.04)
  ctx.fill()
  ctx.strokeStyle = c(pal, 4)
  ctx.lineWidth = Math.max(2, size * 0.025)
  for (let x = size * 0.1; x < size; x += size * 0.14) {
    ctx.beginPath()
    ctx.moveTo(x, size * 0.4)
    ctx.lineTo(x, size * 0.7)
    ctx.stroke()
  }
  ctx.fillStyle = c(pal, 1)
  roundRect(ctx, 0, size * 0.32, size, size * 0.08, size * 0.03)
  ctx.fill()
  roundRect(ctx, 0, size * 0.7, size, size * 0.08, size * 0.03)
  ctx.fill()
}

const drawTorch: DrawFn = (ctx, size, pal, seed) => {
  ctx.fillStyle = c(pal, 4)
  roundRect(ctx, size * 0.44, size * 0.42, size * 0.12, size * 0.48, size * 0.04)
  ctx.fill()
  const flicker = 0.9 + hash(seed) * 0.2
  ctx.fillStyle = c(pal, 5)
  ctx.beginPath()
  ctx.ellipse(size * 0.5, size * 0.3, size * 0.1 * flicker, size * 0.16 * flicker, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = c(pal, 7) || '#fff'
  ctx.beginPath()
  ctx.ellipse(size * 0.5, size * 0.28, size * 0.045, size * 0.08, 0, 0, Math.PI * 2)
  ctx.fill()
}

const drawDungeonFloor: DrawFn = (ctx, size, pal) => {
  ctx.fillStyle = c(pal, 0)
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = c(pal, 1)
  roundRect(ctx, size * 0.05, size * 0.05, size * 0.9, size * 0.9, size * 0.06)
  ctx.fill()
  ctx.strokeStyle = c(pal, 2)
  ctx.lineWidth = Math.max(2, size * 0.03)
  ctx.beginPath()
  ctx.moveTo(size * 0.05, size * 0.5)
  ctx.lineTo(size * 0.95, size * 0.5)
  ctx.moveTo(size * 0.5, size * 0.05)
  ctx.lineTo(size * 0.5, size * 0.95)
  ctx.stroke()
}

const drawCliff: DrawFn = (ctx, size, pal) => {
  ctx.fillStyle = c(pal, 1)
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = c(pal, 0)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  for (let y = 0; y <= size; y += size * 0.15) {
    ctx.lineTo(size * (0.12 + Math.sin(y * 0.1) * 0.04), y)
  }
  ctx.lineTo(0, size)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = c(pal, 3)
  roundRect(ctx, 0, 0, size, size * 0.14, size * 0.04)
  ctx.fill()
}

interface AssetDef {
  name: string
  category: LocationCategory
  draw: DrawFn
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
  { name: 'Tree', category: 'nature', draw: drawTree },
  { name: 'Bush', category: 'nature', draw: drawBush },
  { name: 'Rock', category: 'nature', draw: drawRock },
  { name: 'Flower', category: 'decor', draw: drawFlower },
  { name: 'Cliff', category: 'nature', draw: drawCliff, themes: ['mountain'] },
  { name: 'Wall', category: 'structure', draw: drawHouseWall, themes: ['village', 'overworld'] },
  { name: 'Roof', category: 'structure', draw: drawHouseRoof, themes: ['village', 'overworld'] },
  { name: 'Door', category: 'structure', draw: drawDoor, themes: ['village'] },
  { name: 'Window', category: 'structure', draw: drawWindow, themes: ['village'] },
  { name: 'Fence', category: 'props', draw: drawFence },
  { name: 'Chest', category: 'props', draw: drawChest },
  { name: 'Sign', category: 'props', draw: drawSign },
  { name: 'Bridge', category: 'props', draw: drawBridge },
  { name: 'Torch', category: 'decor', draw: drawTorch, themes: ['dungeon', 'village'] },
]

export function generateLocationAssets(
  theme: LocationTheme,
  tileSize: number,
  customPalette?: RGB[],
  seed = Date.now() % 10000,
): LocationAsset[] {
  const pal = customPalette?.length ? customPalette : getThemePalette(theme)

  return ASSET_DEFS.filter(
    (def) => !def.themes || def.themes.includes(theme),
  ).map((def, i) => {
    const canvas = createCanvas(tileSize, tileSize)
    const ctx = getCtx(canvas, true)
    ctx.clearRect(0, 0, tileSize, tileSize)
    def.draw(ctx, tileSize, pal, seed + i * 17)

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

export function packLocationSheet(
  assets: LocationAsset[],
  columns = 8,
): HTMLCanvasElement {
  if (!assets.length) return createCanvas(1, 1)
  const tileSize = assets[0].tileSize
  const cols = Math.min(columns, assets.length)
  const rows = Math.ceil(assets.length / cols)
  const sheet = createCanvas(cols * tileSize, rows * tileSize)
  const ctx = getCtx(sheet, true)
  assets.forEach((asset, i) => {
    const x = (i % cols) * tileSize
    const y = Math.floor(i / cols) * tileSize
    ctx.drawImage(asset.canvas, x, y)
  })
  return sheet
}

export function buildPreviewMap(
  assets: LocationAsset[],
  mapSize = 10,
  tileSize = 64,
): HTMLCanvasElement {
  // Cap preview canvas so 512px tiles don't explode memory
  const previewTile = Math.min(tileSize, 64)
  const scale = previewTile / tileSize
  const canvas = createCanvas(mapSize * previewTile, mapSize * previewTile)
  const ctx = getCtx(canvas, true)
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

  const draw = (asset: LocationAsset | undefined, x: number, y: number) => {
    if (!asset) return
    ctx.drawImage(
      asset.canvas,
      x * previewTile,
      y * previewTile,
      previewTile,
      previewTile,
    )
  }

  void scale

  for (let y = 0; y < mapSize; y++) {
    for (let x = 0; x < mapSize; x++) {
      draw(grass, x, y)
    }
  }

  if (path) {
    for (let x = 2; x < mapSize - 2; x++) {
      draw(path, x, Math.floor(mapSize / 2))
    }
  }

  if (water) {
    for (let y = mapSize - 3; y < mapSize; y++) {
      for (let x = 0; x < 4; x++) {
        if (shore && y === mapSize - 3) draw(shore, x, y)
        else draw(water, x, y)
      }
    }
  }

  draw(tree, 3, 2)
  draw(tree, 8, 1)
  draw(bush, 5, 3)
  draw(bush, 9, 4)
  draw(rock, 1, 4)
  draw(flower, 6, 3)
  draw(flower, 7, 5)

  if (houseWall && roof) {
    draw(houseWall, 9, 7)
    draw(houseWall, 10, 7)
    draw(roof, 9, 6)
    draw(roof, 10, 6)
    draw(byName['Door'], 9, 7)
    draw(byName['Window'], 10, 7)
  }

  return canvas
}
