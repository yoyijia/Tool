import { canvasToDataUrl, centerContentOnCanvas, createCanvas, getCtx, loadImage } from './pixelate'
import type { CharacterAsset, RGB } from '../types'
import { extractPaletteFromImage } from './palette'

const CELL = 160
const INK = '#2d2832'
const SKIN = '#ffd6ba'
const BLUSH = '#ff9eaa'
const HAIR = '#3a3338'
const CORAL = '#e85a64'
const RED = '#e23b45'
const BLUE = '#4696e6'
const JEAN = '#3f78c8'
const LIME = '#a0dc50'
const WHITE = '#f5f5f8'
const BLACK = '#2a262e'
const SHOE = '#2a262e'

export type PoseKey = 'down' | 'up' | 'left' | 'right' | 'wave' | 'thinking'

export interface SheetCharacter {
  id: string
  name: string
  poses: Partial<Record<PoseKey, HTMLCanvasElement>>
  /** Best single frame for animation generation (usually facing down). */
  primary: HTMLCanvasElement
  dataUrl: string
  image: HTMLImageElement
}

function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: string,
): void {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
  ctx.fill()
}

function face(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  opts: { look?: 'center' | 'up' | 'away'; eyes?: boolean } = {},
): void {
  const { look = 'center', eyes = true } = opts
  ctx.fillStyle = SKIN
  ctx.beginPath()
  ctx.ellipse(cx, cy, 22 * s, 22 * s, 0, 0, Math.PI * 2)
  ctx.fill()

  if (look === 'away') return

  ctx.fillStyle = BLUSH
  ctx.beginPath()
  ctx.ellipse(cx - 12 * s, cy + 4 * s, 5 * s, 3 * s, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(cx + 12 * s, cy + 4 * s, 5 * s, 3 * s, 0, 0, Math.PI * 2)
  ctx.fill()

  if (!eyes) return

  ctx.fillStyle = INK
  const eyeY = look === 'up' ? cy - 4 * s : cy
  ctx.beginPath()
  ctx.arc(cx - 8 * s, eyeY, 2.4 * s, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx + 8 * s, eyeY, 2.4 * s, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = INK
  ctx.lineWidth = 1.8 * s
  ctx.lineCap = 'round'
  ctx.beginPath()
  if (look === 'up') {
    ctx.moveTo(cx - 3 * s, cy + 8 * s)
    ctx.lineTo(cx + 3 * s, cy + 8 * s)
  } else {
    ctx.arc(cx, cy + 6 * s, 4 * s, 0.15 * Math.PI, 0.85 * Math.PI)
  }
  ctx.stroke()
}

function curlyHair(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, back = false): void {
  ctx.fillStyle = HAIR
  const curls = back
    ? [
        [0, -18, 14],
        [-16, -14, 12],
        [16, -14, 12],
        [-22, -2, 11],
        [22, -2, 11],
        [-10, -22, 10],
        [10, -22, 10],
        [0, -26, 9],
        [-14, 8, 10],
        [14, 8, 10],
      ]
    : [
        [0, -20, 14],
        [-16, -16, 12],
        [16, -16, 12],
        [-22, -4, 11],
        [22, -4, 11],
        [-10, -24, 10],
        [10, -24, 10],
        [0, -28, 9],
        [-18, 6, 9],
        [18, 6, 9],
      ]
  for (const [x, y, r] of curls) {
    ctx.beginPath()
    ctx.arc(cx + x * s, cy + y * s, r * s, 0, Math.PI * 2)
    ctx.fill()
  }
}

function legs(
  ctx: CanvasRenderingContext2D,
  cx: number,
  top: number,
  s: number,
  color: string,
  stride = 0,
): void {
  rr(ctx, cx - 12 * s - stride, top, 10 * s, 16 * s, 4 * s, color)
  rr(ctx, cx + 2 * s + stride, top, 10 * s, 16 * s, 4 * s, color)
  rr(ctx, cx - 15 * s - stride, top + 14 * s, 14 * s, 6 * s, 3 * s, SHOE)
  rr(ctx, cx + 1 * s + stride, top + 14 * s, 14 * s, 6 * s, 3 * s, SHOE)
}

/** Character 1 — curly hair, coral tee, blue shorts, lime bag */
function drawCurly(
  ctx: CanvasRenderingContext2D,
  pose: PoseKey,
): void {
  const s = CELL / 100
  const cx = 50 * s
  const facingAway = pose === 'up'
  const profile = pose === 'left' || pose === 'right'
  const flip = pose === 'left'
  const stride = pose === 'left' || pose === 'right' ? 3 * s : 0

  ctx.save()
  if (flip) {
    ctx.translate(CELL, 0)
    ctx.scale(-1, 1)
  }

  // shadow
  ctx.fillStyle = 'rgba(45,40,50,0.12)'
  ctx.beginPath()
  ctx.ellipse(cx, 92 * s, 22 * s, 5 * s, 0, 0, Math.PI * 2)
  ctx.fill()

  legs(ctx, cx, 72 * s, s, BLUE, stride)

  // body
  rr(ctx, cx - 16 * s, 52 * s, 32 * s, 24 * s, 10 * s, CORAL)

  if (profile) {
    rr(ctx, cx + 12 * s, 54 * s, 10 * s, 18 * s, 5 * s, SKIN)
    rr(ctx, cx - 18 * s, 56 * s, 8 * s, 14 * s, 4 * s, SKIN)
  } else if (!facingAway) {
    rr(ctx, cx - 26 * s, 54 * s, 10 * s, 18 * s, 5 * s, SKIN)
    rr(ctx, cx + 16 * s, 54 * s, 10 * s, 18 * s, 5 * s, SKIN)
  } else {
    rr(ctx, cx - 26 * s, 54 * s, 10 * s, 18 * s, 5 * s, SKIN)
    rr(ctx, cx + 16 * s, 54 * s, 10 * s, 18 * s, 5 * s, SKIN)
  }

  // lime satchel
  if (!facingAway || profile) {
    ctx.fillStyle = LIME
    ctx.beginPath()
    ctx.ellipse(cx + (profile ? 14 : 20) * s, 68 * s, 8 * s, 7 * s, 0.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = INK
    ctx.lineWidth = 1.5 * s
    ctx.beginPath()
    ctx.moveTo(cx + 4 * s, 55 * s)
    ctx.lineTo(cx + 14 * s, 64 * s)
    ctx.stroke()
  }

  if (facingAway) curlyHair(ctx, cx, 34 * s, s, true)
  face(ctx, cx, 34 * s, s, {
    look: facingAway ? 'away' : 'center',
    eyes: !facingAway,
  })
  if (!facingAway) curlyHair(ctx, cx, 34 * s, s, false)

  // ear for profile
  if (profile) {
    ctx.fillStyle = SKIN
    ctx.beginPath()
    ctx.ellipse(cx + 18 * s, 36 * s, 4 * s, 5 * s, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

/** Character 2 — red cap, red tee, black overalls */
function drawCapOveralls(
  ctx: CanvasRenderingContext2D,
  pose: PoseKey,
): void {
  const s = CELL / 100
  const cx = 50 * s
  const facingAway = pose === 'up'
  const profile = pose === 'left' || pose === 'right'
  const flip = pose === 'left'
  const waving = pose === 'wave'
  const thinking = pose === 'thinking'
  const stride = profile ? 3 * s : 0

  ctx.save()
  if (flip) {
    ctx.translate(CELL, 0)
    ctx.scale(-1, 1)
  }

  ctx.fillStyle = 'rgba(45,40,50,0.12)'
  ctx.beginPath()
  ctx.ellipse(cx, 92 * s, 22 * s, 5 * s, 0, 0, Math.PI * 2)
  ctx.fill()

  legs(ctx, cx, 72 * s, s, BLACK, stride)

  // overalls body
  rr(ctx, cx - 15 * s, 50 * s, 30 * s, 26 * s, 8 * s, BLACK)
  // red shirt peek
  rr(ctx, cx - 12 * s, 48 * s, 24 * s, 12 * s, 6 * s, RED)

  // arms
  if (waving) {
    rr(ctx, cx - 26 * s, 52 * s, 10 * s, 18 * s, 5 * s, SKIN)
    // raised wave arm
    ctx.save()
    ctx.translate(cx + 18 * s, 50 * s)
    ctx.rotate(-0.9)
    rr(ctx, 0, 0, 10 * s, 20 * s, 5 * s, SKIN)
    ctx.restore()
  } else if (thinking) {
    rr(ctx, cx - 26 * s, 54 * s, 10 * s, 16 * s, 5 * s, SKIN)
    ctx.save()
    ctx.translate(cx + 14 * s, 48 * s)
    ctx.rotate(-0.5)
    rr(ctx, 0, 0, 9 * s, 18 * s, 5 * s, SKIN)
    ctx.restore()
    // hand on chin
    ctx.fillStyle = SKIN
    ctx.beginPath()
    ctx.arc(cx + 14 * s, 42 * s, 5 * s, 0, Math.PI * 2)
    ctx.fill()
  } else if (profile) {
    rr(ctx, cx + 12 * s, 54 * s, 10 * s, 18 * s, 5 * s, SKIN)
    rr(ctx, cx - 18 * s, 56 * s, 8 * s, 14 * s, 4 * s, SKIN)
  } else {
    rr(ctx, cx - 26 * s, 54 * s, 10 * s, 18 * s, 5 * s, SKIN)
    rr(ctx, cx + 16 * s, 54 * s, 10 * s, 18 * s, 5 * s, SKIN)
  }

  // overall straps
  ctx.fillStyle = BLACK
  rr(ctx, cx - 10 * s, 44 * s, 5 * s, 10 * s, 2 * s, BLACK)
  rr(ctx, cx + 5 * s, 44 * s, 5 * s, 10 * s, 2 * s, BLACK)

  face(ctx, cx, 32 * s, s, {
    look: facingAway ? 'away' : thinking ? 'up' : 'center',
    eyes: !facingAway,
  })

  // hair bun
  ctx.fillStyle = HAIR
  ctx.beginPath()
  ctx.arc(cx, 14 * s, 8 * s, 0, Math.PI * 2)
  ctx.fill()
  if (!facingAway) {
    ctx.beginPath()
    ctx.ellipse(cx, 22 * s, 18 * s, 8 * s, 0, Math.PI, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.beginPath()
    ctx.ellipse(cx, 28 * s, 18 * s, 10 * s, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // red cap
  ctx.fillStyle = RED
  ctx.beginPath()
  ctx.ellipse(cx, 18 * s, 18 * s, 10 * s, 0, Math.PI, Math.PI * 2)
  ctx.fill()
  if (!facingAway) {
    // brim
    rr(ctx, cx - 4 * s, 18 * s, 24 * s, 5 * s, 2 * s, RED)
  } else {
    rr(ctx, cx - 20 * s, 18 * s, 24 * s, 5 * s, 2 * s, RED)
  }

  ctx.restore()
}

/** Character 3 — backwards cap, white tee, jeans, black bag */
function drawBackwardsCap(
  ctx: CanvasRenderingContext2D,
  pose: PoseKey,
): void {
  const s = CELL / 100
  const cx = 50 * s
  const facingAway = pose === 'up'
  const profile = pose === 'left' || pose === 'right'
  const flip = pose === 'left'
  const stride = profile ? 3 * s : 0

  ctx.save()
  if (flip) {
    ctx.translate(CELL, 0)
    ctx.scale(-1, 1)
  }

  ctx.fillStyle = 'rgba(45,40,50,0.12)'
  ctx.beginPath()
  ctx.ellipse(cx, 92 * s, 22 * s, 5 * s, 0, 0, Math.PI * 2)
  ctx.fill()

  legs(ctx, cx, 72 * s, s, JEAN, stride)
  rr(ctx, cx - 16 * s, 50 * s, 32 * s, 26 * s, 10 * s, WHITE)

  if (profile) {
    rr(ctx, cx + 12 * s, 54 * s, 10 * s, 18 * s, 5 * s, SKIN)
    rr(ctx, cx - 18 * s, 56 * s, 8 * s, 14 * s, 4 * s, SKIN)
  } else {
    rr(ctx, cx - 26 * s, 54 * s, 10 * s, 18 * s, 5 * s, SKIN)
    rr(ctx, cx + 16 * s, 54 * s, 10 * s, 18 * s, 5 * s, SKIN)
  }

  // cross-body bag
  ctx.strokeStyle = BLACK
  ctx.lineWidth = 2.5 * s
  ctx.beginPath()
  ctx.moveTo(cx - 14 * s, 52 * s)
  ctx.lineTo(cx + 16 * s, 70 * s)
  ctx.stroke()
  ctx.fillStyle = BLACK
  ctx.beginPath()
  ctx.ellipse(cx + 16 * s, 72 * s, 7 * s, 6 * s, 0.3, 0, Math.PI * 2)
  ctx.fill()

  face(ctx, cx, 32 * s, s, {
    look: facingAway ? 'away' : 'center',
    eyes: !facingAway,
  })

  // short dark hair
  ctx.fillStyle = HAIR
  ctx.beginPath()
  ctx.ellipse(cx, 20 * s, 18 * s, 12 * s, 0, Math.PI, Math.PI * 2)
  ctx.fill()

  // backwards black cap
  ctx.fillStyle = BLACK
  ctx.beginPath()
  ctx.ellipse(cx, 16 * s, 17 * s, 9 * s, 0, Math.PI, Math.PI * 2)
  ctx.fill()
  // brim at back
  if (!facingAway) {
    rr(ctx, cx - 22 * s, 16 * s, 16 * s, 5 * s, 2 * s, BLACK)
  } else {
    rr(ctx, cx + 4 * s, 16 * s, 18 * s, 5 * s, 2 * s, BLACK)
  }
  // buckle
  ctx.fillStyle = '#888'
  rr(ctx, cx - 4 * s, 14 * s, 8 * s, 4 * s, 1 * s, '#9aa')

  ctx.restore()
}

function makePoseCell(
  drawer: (ctx: CanvasRenderingContext2D, pose: PoseKey) => void,
  pose: PoseKey,
): HTMLCanvasElement {
  const c = createCanvas(CELL, CELL)
  const ctx = getCtx(c, true)
  ctx.clearRect(0, 0, CELL, CELL)
  drawer(ctx, pose)
  // Place the drawn figure dead-center in the cell
  return centerContentOnCanvas(c, CELL, 0.1)
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void {
  ctx.fillStyle = 'rgba(45,40,50,0.55)'
  ctx.font = `600 ${Math.max(11, CELL * 0.09)}px Nunito, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(text, x, y)
}

/**
 * Builds the embedded Nintendo-clean-vector character sheet
 * matching the uploaded reference (3 characters, directional poses).
 */
export function buildSampleCharacterSheet(): HTMLCanvasElement {
  const cols = 5
  const rows = 3
  const padTop = 28
  const sheet = createCanvas(cols * CELL, rows * CELL + padTop)
  const ctx = getCtx(sheet, true)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, sheet.width, sheet.height)

  const row1: PoseKey[] = ['left', 'right', 'down', 'up']
  const row2: PoseKey[] = ['wave', 'left', 'right', 'up', 'thinking']
  const row3: PoseKey[] = ['down']

  row1.forEach((pose, i) => {
    const cell = makePoseCell(drawCurly, pose)
    ctx.drawImage(cell, i * CELL, padTop)
    label(ctx, pose, i * CELL + CELL / 2, padTop - 8)
  })

  row2.forEach((pose, i) => {
    const cell = makePoseCell(drawCapOveralls, pose)
    ctx.drawImage(cell, i * CELL, CELL + padTop)
    label(ctx, pose, i * CELL + CELL / 2, CELL + padTop - 8)
  })

  row3.forEach((pose, i) => {
    const cell = makePoseCell(drawBackwardsCap, pose)
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

  const curlyDown = makePoseCell(drawCurly, 'down')
  const curlyLeft = makePoseCell(drawCurly, 'left')
  const curlyRight = makePoseCell(drawCurly, 'right')
  const curlyUp = makePoseCell(drawCurly, 'up')

  const capWave = makePoseCell(drawCapOveralls, 'wave')
  const capLeft = makePoseCell(drawCapOveralls, 'left')
  const capRight = makePoseCell(drawCapOveralls, 'right')
  const capUp = makePoseCell(drawCapOveralls, 'up')
  const capThink = makePoseCell(drawCapOveralls, 'thinking')
  const capDown = makePoseCell(drawCapOveralls, 'wave') // closest front

  const bagDown = makePoseCell(drawBackwardsCap, 'down')
  const bagLeft = makePoseCell(drawBackwardsCap, 'left')
  const bagRight = makePoseCell(drawBackwardsCap, 'right')
  const bagUp = makePoseCell(drawBackwardsCap, 'up')

  const defs: {
    id: string
    name: string
    primary: HTMLCanvasElement
    poses: Partial<Record<PoseKey, HTMLCanvasElement>>
  }[] = [
    {
      id: 'sheet-curly',
      name: 'Curly Hero',
      primary: curlyDown,
      poses: { down: curlyDown, left: curlyLeft, right: curlyRight, up: curlyUp },
    },
    {
      id: 'sheet-cap',
      name: 'Red Cap',
      primary: capWave,
      poses: {
        down: capDown,
        wave: capWave,
        left: capLeft,
        right: capRight,
        up: capUp,
        thinking: capThink,
      },
    },
    {
      id: 'sheet-bag',
      name: 'Backwards Cap',
      primary: bagDown,
      poses: { down: bagDown, left: bagLeft, right: bagRight, up: bagUp },
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
    })
  }

  const palette = await extractPaletteFromImage(
    await loadImage(canvasToDataUrl(curlyDown)),
    16,
  )

  return { sheetCanvas, sheetDataUrl, characters, sheetCharacters, palette }
}
