import { canvasToDataUrl, createCanvas, getCtx, loadImage } from './pixelate'
import type { CharacterAsset, RGB } from '../types'
import { extractPaletteFromImage } from './palette'
import {
  createPixelCanvas,
  outlineCanvas,
  pixelBlob,
  px,
  shadeHex,
  upscalePixel,
} from './pixelArt'

const CELL = 128
const LOGICAL = 48

export type PoseKey = 'down' | 'up' | 'left' | 'right' | 'wave' | 'thinking'

export interface SheetCharacter {
  id: string
  name: string
  poses: Partial<Record<PoseKey, HTMLCanvasElement>>
  primary: HTMLCanvasElement
  dataUrl: string
  image: HTMLImageElement
}

const SKIN = '#c68642'
const SKIN_HI = '#d4a574'
const HAIR = '#1a1420'
const HAIR_HI = '#3a3338'
const RED = '#d62828'
const RED_HI = '#f04a4a'
const NAVY = '#2d3a6e'
const BAG = '#7cb342'
const BAG_HI = '#9ccc65'
const WHITE = '#f0f0f4'
const JEAN = '#3f5f9e'
const BLACK = '#1a1420'
const INK = '#1a1420'

function drawFace(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  opts: { away?: boolean; lookUp?: boolean } = {},
): void {
  pixelBlob(ctx, cx, cy, 10 * s, 10 * s, SKIN)
  px(ctx, cx - 4 * s, cy - 5 * s, 8 * s, 4 * s, SKIN_HI)
  if (opts.away) return

  px(ctx, cx - 7 * s, cy + 2 * s, 3 * s, 2 * s, '#e88890')
  px(ctx, cx + 4 * s, cy + 2 * s, 3 * s, 2 * s, '#e88890')

  const eyeY = opts.lookUp ? cy - 3 * s : cy - 1 * s
  px(ctx, cx - 5 * s, eyeY, 3 * s, 4 * s, INK)
  px(ctx, cx + 2 * s, eyeY, 3 * s, 4 * s, INK)
  px(ctx, cx - 4 * s, eyeY, 1 * s, 1 * s, '#fff')
  px(ctx, cx + 3 * s, eyeY, 1 * s, 1 * s, '#fff')

  px(ctx, cx - 1 * s, cy + 2 * s, 2 * s, 1 * s, INK)
  px(ctx, cx - 2 * s, cy + 5 * s, 4 * s, 1 * s, INK)
}

function curlyHair(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  back = false,
): void {
  const curls = back
    ? [
        [0, -8, 7],
        [-7, -5, 6],
        [7, -5, 6],
        [-9, 1, 5],
        [9, 1, 5],
        [0, -12, 5],
        [-6, 5, 5],
        [6, 5, 5],
      ]
    : [
        [0, -8, 7],
        [-7, -6, 6],
        [7, -6, 6],
        [-9, 0, 5],
        [9, 0, 5],
        [-4, -11, 5],
        [4, -11, 5],
        [0, -13, 4],
        [-7, 4, 4],
        [7, 4, 4],
      ]
  for (const [x, y, r] of curls) {
    pixelBlob(ctx, cx + x * s, cy + y * s, r * s, r * s, HAIR)
  }
  pixelBlob(ctx, cx - 2 * s, cy - 9 * s, 3 * s, 2 * s, HAIR_HI)
}

function legs(
  ctx: CanvasRenderingContext2D,
  cx: number,
  top: number,
  s: number,
  color: string,
  stride = 0,
): void {
  px(ctx, cx - 6 * s - stride, top, 5 * s, 9 * s, color)
  px(ctx, cx + 1 * s + stride, top, 5 * s, 9 * s, color)
  px(ctx, cx - 7 * s - stride, top + 8 * s, 6 * s, 3 * s, BLACK)
  px(ctx, cx + 1 * s + stride, top + 8 * s, 6 * s, 3 * s, BLACK)
}

/** Grocery hero — curly hair, red polo, navy shorts, green bag */
function drawShopper(ctx: CanvasRenderingContext2D, pose: PoseKey): void {
  const s = LOGICAL / 48
  const cx = 24 * s
  const away = pose === 'up'
  const profile = pose === 'left' || pose === 'right'
  const flip = pose === 'left'
  const stride = profile ? 2 * s : 0

  ctx.save()
  if (flip) {
    ctx.translate(LOGICAL, 0)
    ctx.scale(-1, 1)
  }

  ctx.fillStyle = 'rgba(26,20,32,0.2)'
  ctx.beginPath()
  ctx.ellipse(cx, 44 * s, 10 * s, 2 * s, 0, 0, Math.PI * 2)
  ctx.fill()

  legs(ctx, cx, 34 * s, s, NAVY, stride)

  px(ctx, cx - 7 * s, 22 * s, 14 * s, 14 * s, RED)
  px(ctx, cx - 6 * s, 22 * s, 12 * s, 3 * s, RED_HI)

  if (profile) {
    px(ctx, cx + 6 * s, 24 * s, 4 * s, 9 * s, SKIN)
    px(ctx, cx - 9 * s, 26 * s, 3 * s, 7 * s, SKIN)
  } else if (!away) {
    px(ctx, cx - 11 * s, 24 * s, 4 * s, 9 * s, SKIN)
    px(ctx, cx + 7 * s, 24 * s, 4 * s, 9 * s, SKIN)
  } else {
    px(ctx, cx - 11 * s, 24 * s, 4 * s, 9 * s, SKIN)
    px(ctx, cx + 7 * s, 24 * s, 4 * s, 9 * s, SKIN)
  }

  // Green shopping bag
  if (!away || profile) {
    const bx = profile ? cx + 8 * s : cx + 10 * s
    px(ctx, bx, 28 * s, 7 * s, 9 * s, BAG)
    px(ctx, bx + 1 * s, 28 * s, 5 * s, 2 * s, BAG_HI)
  }

  if (away) curlyHair(ctx, cx, 14 * s, s, true)
  drawFace(ctx, cx, 14 * s, s, { away })
  if (!away) curlyHair(ctx, cx, 14 * s, s, false)

  ctx.restore()
}

/** Clerk — bun, red visor, overalls */
function drawClerk(ctx: CanvasRenderingContext2D, pose: PoseKey): void {
  const s = LOGICAL / 48
  const cx = 24 * s
  const away = pose === 'up'
  const profile = pose === 'left' || pose === 'right'
  const flip = pose === 'left'
  const waving = pose === 'wave'
  const thinking = pose === 'thinking'
  const stride = profile ? 2 * s : 0

  ctx.save()
  if (flip) {
    ctx.translate(LOGICAL, 0)
    ctx.scale(-1, 1)
  }

  ctx.fillStyle = 'rgba(26,20,32,0.2)'
  ctx.beginPath()
  ctx.ellipse(cx, 44 * s, 10 * s, 2 * s, 0, 0, Math.PI * 2)
  ctx.fill()

  legs(ctx, cx, 34 * s, s, BLACK, stride)
  px(ctx, cx - 7 * s, 22 * s, 14 * s, 14 * s, BLACK)
  px(ctx, cx - 6 * s, 20 * s, 12 * s, 6 * s, RED)

  if (waving) {
    px(ctx, cx - 11 * s, 24 * s, 4 * s, 9 * s, SKIN)
    px(ctx, cx + 8 * s, 14 * s, 4 * s, 10 * s, SKIN)
  } else if (thinking) {
    px(ctx, cx - 11 * s, 24 * s, 4 * s, 8 * s, SKIN)
    px(ctx, cx + 7 * s, 18 * s, 4 * s, 8 * s, SKIN)
    px(ctx, cx + 8 * s, 16 * s, 4 * s, 4 * s, SKIN)
  } else if (profile) {
    px(ctx, cx + 6 * s, 24 * s, 4 * s, 9 * s, SKIN)
    px(ctx, cx - 9 * s, 26 * s, 3 * s, 7 * s, SKIN)
  } else {
    px(ctx, cx - 11 * s, 24 * s, 4 * s, 9 * s, SKIN)
    px(ctx, cx + 7 * s, 24 * s, 4 * s, 9 * s, SKIN)
  }

  px(ctx, cx - 5 * s, 18 * s, 3 * s, 5 * s, BLACK)
  px(ctx, cx + 2 * s, 18 * s, 3 * s, 5 * s, BLACK)

  drawFace(ctx, cx, 13 * s, s, { away, lookUp: thinking })

  pixelBlob(ctx, cx, 4 * s, 4 * s, 4 * s, HAIR)
  if (!away) {
    pixelBlob(ctx, cx, 8 * s, 9 * s, 4 * s, HAIR)
  } else {
    pixelBlob(ctx, cx, 12 * s, 9 * s, 5 * s, HAIR)
  }
  px(ctx, cx - 8 * s, 6 * s, 16 * s, 5 * s, RED)
  if (!away) px(ctx, cx + 2 * s, 8 * s, 10 * s, 3 * s, RED)
  else px(ctx, cx - 12 * s, 8 * s, 10 * s, 3 * s, RED)

  ctx.restore()
}

/** Backwards-cap shopper */
function drawBagShopper(ctx: CanvasRenderingContext2D, pose: PoseKey): void {
  const s = LOGICAL / 48
  const cx = 24 * s
  const away = pose === 'up'
  const profile = pose === 'left' || pose === 'right'
  const flip = pose === 'left'
  const stride = profile ? 2 * s : 0

  ctx.save()
  if (flip) {
    ctx.translate(LOGICAL, 0)
    ctx.scale(-1, 1)
  }

  ctx.fillStyle = 'rgba(26,20,32,0.2)'
  ctx.beginPath()
  ctx.ellipse(cx, 44 * s, 10 * s, 2 * s, 0, 0, Math.PI * 2)
  ctx.fill()

  legs(ctx, cx, 34 * s, s, JEAN, stride)
  px(ctx, cx - 7 * s, 22 * s, 14 * s, 14 * s, WHITE)
  px(ctx, cx - 6 * s, 22 * s, 12 * s, 3 * s, shadeHex(WHITE, -12))

  if (profile) {
    px(ctx, cx + 6 * s, 24 * s, 4 * s, 9 * s, SKIN)
    px(ctx, cx - 9 * s, 26 * s, 3 * s, 7 * s, SKIN)
  } else {
    px(ctx, cx - 11 * s, 24 * s, 4 * s, 9 * s, SKIN)
    px(ctx, cx + 7 * s, 24 * s, 4 * s, 9 * s, SKIN)
  }

  // Crossbody bag
  px(ctx, cx - 6 * s, 24 * s, 2 * s, 12 * s, BLACK)
  px(ctx, cx + 6 * s, 32 * s, 6 * s, 5 * s, BLACK)

  drawFace(ctx, cx, 13 * s, s, { away })
  pixelBlob(ctx, cx, 8 * s, 9 * s, 5 * s, HAIR)
  px(ctx, cx - 8 * s, 5 * s, 16 * s, 5 * s, BLACK)
  if (!away) px(ctx, cx - 11 * s, 7 * s, 6 * s, 3 * s, BLACK)
  else px(ctx, cx + 5 * s, 7 * s, 6 * s, 3 * s, BLACK)
  px(ctx, cx - 2 * s, 6 * s, 4 * s, 2 * s, '#8a9098')

  ctx.restore()
}

function makePoseCell(
  drawer: (ctx: CanvasRenderingContext2D, pose: PoseKey) => void,
  pose: PoseKey,
): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas(LOGICAL)
  drawer(ctx, pose)
  outlineCanvas(canvas)
  return upscalePixel(canvas, CELL)
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void {
  ctx.fillStyle = 'rgba(26,20,32,0.55)'
  ctx.font = `700 ${Math.max(10, CELL * 0.08)}px Nunito, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(text, x, y)
}

/** Pixel RPG character sheet matching the FairPrice grocery reference. */
export function buildSampleCharacterSheet(): HTMLCanvasElement {
  const cols = 5
  const rows = 3
  const padTop = 28
  const sheet = createCanvas(cols * CELL, rows * CELL + padTop)
  const ctx = getCtx(sheet, false)
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, sheet.width, sheet.height)

  const row1: PoseKey[] = ['left', 'right', 'down', 'up']
  const row2: PoseKey[] = ['wave', 'left', 'right', 'up', 'thinking']
  const row3: PoseKey[] = ['down']

  row1.forEach((pose, i) => {
    const cell = makePoseCell(drawShopper, pose)
    ctx.drawImage(cell, i * CELL, padTop)
    label(ctx, pose, i * CELL + CELL / 2, padTop - 8)
  })
  row2.forEach((pose, i) => {
    const cell = makePoseCell(drawClerk, pose)
    ctx.drawImage(cell, i * CELL, CELL + padTop)
    label(ctx, pose, i * CELL + CELL / 2, CELL + padTop - 8)
  })
  row3.forEach((pose, i) => {
    const cell = makePoseCell(drawBagShopper, pose)
    ctx.drawImage(cell, i * CELL, CELL * 2 + padTop)
    label(ctx, pose, i * CELL + CELL / 2, CELL * 2 + padTop - 8)
  })

  return sheet
}

export async function loadSampleSheetCharacters(): Promise<{
  sheetCanvas: HTMLCanvasElement
  sheetDataUrl: string
  characters: CharacterAsset[]
  sheetCharacters: SheetCharacter[]
  palette: RGB[]
}> {
  const sheetCanvas = buildSampleCharacterSheet()
  const sheetDataUrl = canvasToDataUrl(sheetCanvas)

  const shopDown = makePoseCell(drawShopper, 'down')
  const shopLeft = makePoseCell(drawShopper, 'left')
  const shopRight = makePoseCell(drawShopper, 'right')
  const shopUp = makePoseCell(drawShopper, 'up')

  const clerkWave = makePoseCell(drawClerk, 'wave')
  const clerkLeft = makePoseCell(drawClerk, 'left')
  const clerkRight = makePoseCell(drawClerk, 'right')
  const clerkUp = makePoseCell(drawClerk, 'up')
  const clerkThink = makePoseCell(drawClerk, 'thinking')

  const bagDown = makePoseCell(drawBagShopper, 'down')
  const bagLeft = makePoseCell(drawBagShopper, 'left')
  const bagRight = makePoseCell(drawBagShopper, 'right')
  const bagUp = makePoseCell(drawBagShopper, 'up')

  const defs: {
    id: string
    name: string
    primary: HTMLCanvasElement
    poses: Partial<Record<PoseKey, HTMLCanvasElement>>
    loadout?: CharacterAsset['loadout']
  }[] = [
    {
      id: 'sheet-curly',
      name: 'Curly Shopper',
      primary: shopDown,
      poses: { down: shopDown, left: shopLeft, right: shopRight, up: shopUp },
      loadout: {
        hair: 'curly',
        eyes: 'oval',
        hands: 'relaxed',
        legs: 'straight',
        shirt: 'tee',
        pants: 'shorts',
        accessory: 'satchel',
        skin: '#c68642',
        hairColor: '#1a1420',
        shirtColor: '#d62828',
        pantsColor: '#2d3a6e',
        accessoryColor: '#7cb342',
      },
    },
    {
      id: 'sheet-cap',
      name: 'Market Clerk',
      primary: clerkWave,
      poses: {
        down: clerkWave,
        wave: clerkWave,
        left: clerkLeft,
        right: clerkRight,
        up: clerkUp,
        thinking: clerkThink,
      },
      loadout: {
        hair: 'cap',
        eyes: 'oval',
        hands: 'wave',
        legs: 'straight',
        shirt: 'tee',
        pants: 'overalls',
        accessory: 'none',
        skin: '#c68642',
        hairColor: '#1a1420',
        shirtColor: '#d62828',
        pantsColor: '#1a1420',
        accessoryColor: '#7cb342',
      },
    },
    {
      id: 'sheet-bag',
      name: 'Backwards Cap',
      primary: bagDown,
      poses: { down: bagDown, left: bagLeft, right: bagRight, up: bagUp },
      loadout: {
        hair: 'backwards',
        eyes: 'oval',
        hands: 'relaxed',
        legs: 'straight',
        shirt: 'tee',
        pants: 'jeans',
        accessory: 'backpack',
        skin: '#c68642',
        hairColor: '#1a1420',
        shirtColor: '#f0f0f4',
        pantsColor: '#3f5f9e',
        accessoryColor: '#1a1420',
      },
    },
  ]

  const sheetCharacters: SheetCharacter[] = []
  const characters: CharacterAsset[] = []

  for (const def of defs) {
    const dataUrl = canvasToDataUrl(def.primary)
    const image = await loadImage(dataUrl)
    sheetCharacters.push({
      id: def.id,
      name: def.name,
      poses: def.poses,
      primary: def.primary,
      dataUrl,
      image,
    })
    characters.push({
      id: def.id,
      name: def.name,
      dataUrl,
      image,
      poses: Object.fromEntries(
        Object.entries(def.poses).map(([k, canvas]) => [k, canvasToDataUrl(canvas!)]),
      ),
      loadout: def.loadout,
    })
  }

  const palette = await extractPaletteFromImage(
    await loadImage(canvasToDataUrl(shopDown)),
    16,
  )

  return { sheetCanvas, sheetDataUrl, characters, sheetCharacters, palette }
}
