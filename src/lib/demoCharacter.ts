import { createCanvas, getCtx } from './pixelate'

/** Tiny Nintendo-inspired hero for first-run demo (original, not a franchise character). */
export function createDemoCharacter(): HTMLCanvasElement {
  const size = 32
  const c = createCanvas(size, size)
  const ctx = getCtx(c)

  // Cap
  ctx.fillStyle = '#e63946'
  ctx.fillRect(10, 4, 12, 4)
  ctx.fillRect(8, 6, 16, 3)

  // Face
  ctx.fillStyle = '#f2c9a0'
  ctx.fillRect(10, 9, 12, 8)

  // Eyes
  ctx.fillStyle = '#1a2a3a'
  ctx.fillRect(12, 11, 2, 2)
  ctx.fillRect(18, 11, 2, 2)

  // Smile
  ctx.fillRect(14, 15, 4, 1)

  // Shirt
  ctx.fillStyle = '#2196f3'
  ctx.fillRect(9, 17, 14, 7)

  // Buttons
  ctx.fillStyle = '#ffb703'
  ctx.fillRect(15, 19, 2, 2)

  // Arms
  ctx.fillStyle = '#f2c9a0'
  ctx.fillRect(6, 18, 3, 5)
  ctx.fillRect(23, 18, 3, 5)

  // Overalls / pants
  ctx.fillStyle = '#3db85a'
  ctx.fillRect(10, 24, 5, 5)
  ctx.fillRect(17, 24, 5, 5)

  // Shoes
  ctx.fillStyle = '#8d5524'
  ctx.fillRect(9, 29, 6, 2)
  ctx.fillRect(17, 29, 6, 2)

  // Outline accents
  ctx.fillStyle = '#1a2a3a'
  ctx.fillRect(10, 3, 12, 1)
  ctx.fillRect(8, 6, 1, 3)
  ctx.fillRect(23, 6, 1, 3)

  return c
}
