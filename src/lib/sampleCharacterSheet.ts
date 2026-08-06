import { canvasToDataUrl, createCanvas, getCtx, loadImage } from './pixelate'
import type { CharacterAsset, RGB } from '../types'
import { extractPaletteFromImage } from './palette'
import {
  createPixelCanvas,
  drawPixelText,
  outlineCanvas,
  pixelCircle,
  px,
  shadeHex,
  upscalePixel,
} from './pixelArt'

/** Export cell size (nearest-neighbor up from 32). */
const CELL = 128
const LOGICAL = 32

export type PoseKey = 'down' | 'up' | 'left' | 'right' | 'wave' | 'thinking'

export interface SheetCharacter {
  id: string
  name: string
  poses: Partial<Record<PoseKey, HTMLCanvasElement>>
  primary: HTMLCanvasElement
  dataUrl: string
  image: HTMLImageElement
}

// Classic chibi palette matching the reference sheet
const SKIN = '#ffd6ba'
const SKIN_SHADE = '#f0b898'
const BLUSH = '#ff9eaa'
const HAIR = '#2a262e'
const RED = '#e23b45'
const RED_SHADE = '#c43038'
const BLUE = '#4696e6'
const BLUE_SHADE = '#3578c0'
const LIME = '#a0dc50'
const WHITE = '#f5f5f8'
const JEAN = '#3f78c8'
const BLACK = '#2a262e'
const INK = '#000000'

/**
 * Classic RPG chibi face: big round head, tiny 2px eyes, blush dots.
 */
function drawFace(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  opts: { away?: boolean; lookUp?: boolean } = {},
): void {
  pixelCircle(ctx, cx, cy, 7, SKIN)
  // chin shade
  px(ctx, cx - 3, cy + 3, 6, 2, SKIN_SHADE)
  if (opts.away) return

  // blush
  px(ctx, cx - 5, cy + 1, 2, 1, BLUSH)
  px(ctx, cx + 3, cy + 1, 2, 1, BLUSH)

  // eyes — 1×2 vertical pixels (classic chibi)
  const eyeY = opts.lookUp ? cy - 2 : cy - 1
  px(ctx, cx - 3, eyeY, 1, 2, INK)
  px(ctx, cx + 2, eyeY, 1, 2, INK)

  // tiny mouth
  if (opts.lookUp) {
    px(ctx, cx - 1, cy + 3, 2, 1, INK)
  } else {
    px(ctx, cx - 1, cy + 3, 3, 1, INK)
  }
}

function curlyHair(ctx: CanvasRenderingContext2D, cx: number, cy: number, back = false): void {
  const curls = back
    ? [
        [0, -5, 5],
        [-5, -3, 4],
        [5, -3, 4],
        [-6, 1, 4],
        [6, 1, 4],
        [0, -8, 4],
        [-4, 4, 3],
        [4, 4, 3],
      ]
    : [
        [0, -5, 5],
        [-5, -4, 4],
        [5, -4, 4],
        [-6, 0, 4],
        [6, 0, 4],
        [-3, -7, 3],
        [3, -7, 3],
        [0, -8, 3],
        [-5, 3, 3],
        [5, 3, 3],
      ]
  for (const [x, y, r] of curls) {
    pixelCircle(ctx, cx + x, cy + y, r, HAIR)
  }
}

function legs(
  ctx: CanvasRenderingContext2D,
  cx: number,
  top: number,
  color: string,
  shade: string,
  stride = 0,
): void {
  px(ctx, cx - 4 - stride, top, 3, 6, color)
  px(ctx, cx + 1 + stride, top, 3, 6, color)
  px(ctx, cx - 4 - stride, top + 3, 3, 3, shade)
  px(ctx, cx + 1 + stride, top + 3, 3, 3, shade)
  px(ctx, cx - 5 - stride, top + 5, 4, 2, BLACK)
  px(ctx, cx + 1 + stride, top + 5, 4, 2, BLACK)
}

/** Row 1 — curly afro, red tee, blue shorts, lime bag */
function drawCurly(ctx: CanvasRenderingContext2D, pose: PoseKey): void {
  const cx = 16
  const away = pose === 'up'
  const profile = pose === 'left' || pose === 'right'
  const flip = pose === 'left'
  const stride = profile ? 1 : 0

  ctx.save()
  if (flip) {
    ctx.translate(LOGICAL, 0)
    ctx.scale(-1, 1)
  }

  // shadow
  px(ctx, cx - 5, 29, 10, 2, 'rgba(0,0,0,0.15)')

  legs(ctx, cx, 22, BLUE, BLUE_SHADE, stride)

  // torso
  px(ctx, cx - 4, 14, 8, 9, RED)
  px(ctx, cx - 4, 20, 8, 3, RED_SHADE)

  // arms
  if (profile) {
    px(ctx, cx + 4, 15, 3, 6, SKIN)
    px(ctx, cx - 6, 16, 2, 5, SKIN)
  } else {
    px(ctx, cx - 7, 15, 3, 6, SKIN)
    px(ctx, cx + 4, 15, 3, 6, SKIN)
  }

  // lime satchel
  if (!away || profile) {
    const bx = profile ? cx + 5 : cx + 6
    px(ctx, bx, 18, 4, 5, LIME)
    px(ctx, bx, 18, 4, 1, shadeHex(LIME, 30))
  }

  if (away) curlyHair(ctx, cx, 8, true)
  drawFace(ctx, cx, 8, { away })
  if (!away) curlyHair(ctx, cx, 8, false)

  ctx.restore()
}

/** Row 2 — clerk: bun, red visor, apron + badge */
function drawClerk(ctx: CanvasRenderingContext2D, pose: PoseKey): void {
  const cx = 16
  const away = pose === 'up'
  const profile = pose === 'left' || pose === 'right'
  const flip = pose === 'left'
  const waving = pose === 'wave'
  const thinking = pose === 'thinking'
  const stride = profile ? 1 : 0

  ctx.save()
  if (flip) {
    ctx.translate(LOGICAL, 0)
    ctx.scale(-1, 1)
  }

  px(ctx, cx - 5, 29, 10, 2, 'rgba(0,0,0,0.15)')

  legs(ctx, cx, 22, BLACK, '#1a1420', stride)

  // black apron body
  px(ctx, cx - 4, 14, 8, 9, BLACK)
  // red shirt peek at collar
  px(ctx, cx - 3, 13, 6, 4, RED)
  // badge
  if (!away && !profile) {
    px(ctx, cx + 1, 17, 2, 2, WHITE)
    px(ctx, cx + 1, 17, 2, 1, RED)
  }

  if (waving) {
    px(ctx, cx - 7, 15, 3, 6, SKIN)
    px(ctx, cx + 5, 8, 3, 7, SKIN)
  } else if (thinking) {
    px(ctx, cx - 7, 15, 3, 5, SKIN)
    px(ctx, cx + 4, 11, 3, 5, SKIN)
    px(ctx, cx + 5, 10, 3, 3, SKIN)
  } else if (profile) {
    px(ctx, cx + 4, 15, 3, 6, SKIN)
    px(ctx, cx - 6, 16, 2, 5, SKIN)
  } else {
    px(ctx, cx - 7, 15, 3, 6, SKIN)
    px(ctx, cx + 4, 15, 3, 6, SKIN)
  }

  // straps
  px(ctx, cx - 3, 12, 2, 3, BLACK)
  px(ctx, cx + 1, 12, 2, 3, BLACK)

  drawFace(ctx, cx, 7, { away, lookUp: thinking })

  // bun + hair bowl
  pixelCircle(ctx, cx, 1, 3, HAIR)
  if (!away) {
    px(ctx, cx - 6, 3, 12, 4, HAIR)
  } else {
    pixelCircle(ctx, cx, 6, 6, HAIR)
  }

  // red visor
  px(ctx, cx - 6, 2, 12, 4, RED)
  if (!away) px(ctx, cx + 1, 4, 7, 2, RED)
  else px(ctx, cx - 8, 4, 7, 2, RED)

  ctx.restore()
}

/** Row 3 — backwards cap, white tee, jeans, black bag */
function drawCapKid(ctx: CanvasRenderingContext2D, pose: PoseKey): void {
  const cx = 16
  const away = pose === 'up'
  const profile = pose === 'left' || pose === 'right'
  const flip = pose === 'left'
  const stride = profile ? 1 : 0

  ctx.save()
  if (flip) {
    ctx.translate(LOGICAL, 0)
    ctx.scale(-1, 1)
  }

  px(ctx, cx - 5, 29, 10, 2, 'rgba(0,0,0,0.15)')

  legs(ctx, cx, 22, JEAN, shadeHex(JEAN, -25), stride)
  px(ctx, cx - 4, 14, 8, 9, WHITE)
  px(ctx, cx - 4, 20, 8, 3, shadeHex(WHITE, -18))

  if (profile) {
    px(ctx, cx + 4, 15, 3, 6, SKIN)
    px(ctx, cx - 6, 16, 2, 5, SKIN)
  } else {
    px(ctx, cx - 7, 15, 3, 6, SKIN)
    px(ctx, cx + 4, 15, 3, 6, SKIN)
  }

  // crossbody strap + bag
  px(ctx, cx - 3, 14, 1, 8, BLACK)
  px(ctx, cx + 3, 20, 4, 4, BLACK)

  drawFace(ctx, cx, 7, { away })
  px(ctx, cx - 6, 2, 12, 5, HAIR)

  // backwards cap
  px(ctx, cx - 6, 1, 12, 4, BLACK)
  if (!away) px(ctx, cx - 8, 3, 5, 2, BLACK)
  else px(ctx, cx + 3, 3, 5, 2, BLACK)
  px(ctx, cx - 1, 2, 3, 1, '#9aa3ad')

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

/** Classic pixel RPG character sheet matching the uploaded reference. */
export function buildSampleCharacterSheet(): HTMLCanvasElement {
  const cols = 5
  const rows = 3
  const padTop = 14
  const sheet = createCanvas(cols * CELL, rows * CELL + padTop)
  const ctx = getCtx(sheet, false)
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, sheet.width, sheet.height)

  const row1: PoseKey[] = ['left', 'right', 'down', 'up']
  const row2: PoseKey[] = ['wave', 'left', 'right', 'up', 'thinking']
  const row3: PoseKey[] = ['down']

  // Labels in blocky pixel font (scaled for 128 cells)
  const labelScale = 2
  const labelY = 2

  row1.forEach((pose, i) => {
    const cell = makePoseCell(drawCurly, pose)
    ctx.drawImage(cell, i * CELL, padTop)
    const tw = pose.length * 4 * labelScale
    drawPixelText(ctx, pose, i * CELL + (CELL - tw) / 2, labelY, 'rgba(0,0,0,0.4)', labelScale)
  })
  row2.forEach((pose, i) => {
    const cell = makePoseCell(drawClerk, pose)
    ctx.drawImage(cell, i * CELL, CELL + padTop)
    const tw = pose.length * 4 * labelScale
    drawPixelText(
      ctx,
      pose,
      i * CELL + (CELL - tw) / 2,
      CELL + labelY,
      'rgba(0,0,0,0.4)',
      labelScale,
    )
  })
  row3.forEach((pose, i) => {
    const cell = makePoseCell(drawCapKid, pose)
    ctx.drawImage(cell, i * CELL, CELL * 2 + padTop)
    const tw = pose.length * 4 * labelScale
    drawPixelText(
      ctx,
      pose,
      i * CELL + (CELL - tw) / 2,
      CELL * 2 + labelY,
      'rgba(0,0,0,0.4)',
      labelScale,
    )
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

  const curlyDown = makePoseCell(drawCurly, 'down')
  const curlyLeft = makePoseCell(drawCurly, 'left')
  const curlyRight = makePoseCell(drawCurly, 'right')
  const curlyUp = makePoseCell(drawCurly, 'up')

  const clerkWave = makePoseCell(drawClerk, 'wave')
  const clerkLeft = makePoseCell(drawClerk, 'left')
  const clerkRight = makePoseCell(drawClerk, 'right')
  const clerkUp = makePoseCell(drawClerk, 'up')
  const clerkThink = makePoseCell(drawClerk, 'thinking')
  const clerkDown = makePoseCell(drawClerk, 'down')

  const bagDown = makePoseCell(drawCapKid, 'down')
  const bagLeft = makePoseCell(drawCapKid, 'left')
  const bagRight = makePoseCell(drawCapKid, 'right')
  const bagUp = makePoseCell(drawCapKid, 'up')

  const defs: {
    id: string
    name: string
    primary: HTMLCanvasElement
    poses: Partial<Record<PoseKey, HTMLCanvasElement>>
    loadout?: CharacterAsset['loadout']
  }[] = [
    {
      id: 'sheet-curly',
      name: 'Curly Hero',
      primary: curlyDown,
      poses: { down: curlyDown, left: curlyLeft, right: curlyRight, up: curlyUp },
      loadout: {
        hair: 'curly',
        eyes: 'dots',
        hands: 'relaxed',
        legs: 'straight',
        shirt: 'tee',
        pants: 'shorts',
        accessory: 'satchel',
        skin: '#ffd6ba',
        hairColor: '#2a262e',
        shirtColor: '#e23b45',
        pantsColor: '#4696e6',
        accessoryColor: '#a0dc50',
      },
    },
    {
      id: 'sheet-cap',
      name: 'Red Cap',
      primary: clerkWave,
      poses: {
        down: clerkDown,
        wave: clerkWave,
        left: clerkLeft,
        right: clerkRight,
        up: clerkUp,
        thinking: clerkThink,
      },
      loadout: {
        hair: 'cap',
        eyes: 'dots',
        hands: 'wave',
        legs: 'straight',
        shirt: 'tee',
        pants: 'overalls',
        accessory: 'none',
        skin: '#ffd6ba',
        hairColor: '#2a262e',
        shirtColor: '#e23b45',
        pantsColor: '#2a262e',
        accessoryColor: '#a0dc50',
      },
    },
    {
      id: 'sheet-bag',
      name: 'Backwards Cap',
      primary: bagDown,
      poses: { down: bagDown, left: bagLeft, right: bagRight, up: bagUp },
      loadout: {
        hair: 'backwards',
        eyes: 'dots',
        hands: 'relaxed',
        legs: 'straight',
        shirt: 'tee',
        pants: 'jeans',
        accessory: 'backpack',
        skin: '#ffd6ba',
        hairColor: '#2a262e',
        shirtColor: '#f5f5f8',
        pantsColor: '#3f78c8',
        accessoryColor: '#2a262e',
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
    await loadImage(canvasToDataUrl(curlyDown)),
    16,
  )

  return { sheetCanvas, sheetDataUrl, characters, sheetCharacters, palette }
}
