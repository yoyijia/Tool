import { createCanvas, getCtx } from './pixelate'

/**
 * Clean Nintendo-vector chibi demo
 * (flat colors, big head, blush, minimal features — matches uploaded sheet vibe).
 */
export function createDemoCharacter(): HTMLCanvasElement {
  const size = 256
  const c = createCanvas(size, size)
  const ctx = getCtx(c, true)
  const s = size / 100

  const ink = '#2d2832'
  const skin = '#ffd6ba'
  const blush = '#ff9eaa'
  const hair = '#3a3338'
  const shirt = '#e85a64'
  const pants = '#4696e6'
  const bag = '#a0dc50'
  const shoe = '#2a262e'

  // Soft shadow
  ctx.fillStyle = 'rgba(45,40,50,0.12)'
  ctx.beginPath()
  ctx.ellipse(50 * s, 92 * s, 22 * s, 5 * s, 0, 0, Math.PI * 2)
  ctx.fill()

  // Legs
  roundRect(ctx, 38 * s, 72 * s, 10 * s, 16 * s, 4 * s, pants)
  roundRect(ctx, 52 * s, 72 * s, 10 * s, 16 * s, 4 * s, pants)

  // Shoes
  roundRect(ctx, 35 * s, 86 * s, 14 * s, 6 * s, 3 * s, shoe)
  roundRect(ctx, 51 * s, 86 * s, 14 * s, 6 * s, 3 * s, shoe)

  // Body / shirt
  roundRect(ctx, 34 * s, 52 * s, 32 * s, 24 * s, 10 * s, shirt)

  // Arms
  roundRect(ctx, 24 * s, 54 * s, 10 * s, 18 * s, 5 * s, skin)
  roundRect(ctx, 66 * s, 54 * s, 10 * s, 18 * s, 5 * s, skin)

  // Lime satchel
  ctx.fillStyle = bag
  ctx.beginPath()
  ctx.ellipse(70 * s, 68 * s, 8 * s, 7 * s, 0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = ink
  ctx.lineWidth = 1.5 * s
  ctx.beginPath()
  ctx.moveTo(58 * s, 55 * s)
  ctx.lineTo(66 * s, 64 * s)
  ctx.stroke()

  // Head
  ctx.fillStyle = skin
  ctx.beginPath()
  ctx.ellipse(50 * s, 34 * s, 22 * s, 22 * s, 0, 0, Math.PI * 2)
  ctx.fill()

  // Curly afro hair
  ctx.fillStyle = hair
  const curls = [
    [50, 14, 14],
    [34, 18, 12],
    [66, 18, 12],
    [28, 30, 11],
    [72, 30, 11],
    [40, 12, 10],
    [60, 12, 10],
    [50, 8, 9],
  ]
  for (const [x, y, r] of curls) {
    ctx.beginPath()
    ctx.arc(x * s, y * s, r * s, 0, Math.PI * 2)
    ctx.fill()
  }

  // Blush
  ctx.fillStyle = blush
  ctx.beginPath()
  ctx.ellipse(38 * s, 38 * s, 5 * s, 3 * s, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(62 * s, 38 * s, 5 * s, 3 * s, 0, 0, Math.PI * 2)
  ctx.fill()

  // Eyes (simple dots)
  ctx.fillStyle = ink
  ctx.beginPath()
  ctx.arc(42 * s, 34 * s, 2.4 * s, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(58 * s, 34 * s, 2.4 * s, 0, Math.PI * 2)
  ctx.fill()

  // Tiny smile
  ctx.strokeStyle = ink
  ctx.lineWidth = 1.8 * s
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(50 * s, 40 * s, 4 * s, 0.15 * Math.PI, 0.85 * Math.PI)
  ctx.stroke()

  return c
}

function roundRect(
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
