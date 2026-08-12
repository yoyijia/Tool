/**
 * Classic chibi-pixel UI kit — HUD, buttons, panels, icons
 * matching RPG / supermarket game chrome.
 */

import type { FrameSize } from '../types'
import { createCanvas, getCtx } from './pixelate'
import {
  createPixelCanvas,
  drawPixelText,
  logicalSizeFor,
  outlineCanvas,
  px,
  shadeHex,
  upscalePixel,
} from './pixelArt'

export type UiAssetCategory = 'hud' | 'button' | 'panel' | 'icon' | 'badge'

export interface UiAsset {
  id: string
  name: string
  category: UiAssetCategory
  canvas: HTMLCanvasElement
  size: number
}

export interface UiGenerateOptions {
  size: FrameSize
  seed?: number
}

function pack(
  name: string,
  category: UiAssetCategory,
  logical: HTMLCanvasElement,
  size: number,
): UiAsset {
  outlineCanvas(logical)
  const canvas = upscalePixel(logical, size)
  return {
    id: `ui-${name.toLowerCase().replace(/\s+/g, '-')}-${size}`,
    name,
    category,
    canvas,
    size,
  }
}

function drawBasketHud(logical: number): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas(logical)
  const s = logical / 32
  // dark pill
  px(ctx, 2 * s, 10 * s, 28 * s, 12 * s, 'rgba(20,16,28,0.75)')
  // basket
  px(ctx, 4 * s, 12 * s, 8 * s, 7 * s, '#e23b45')
  px(ctx, 5 * s, 11 * s, 2 * s, 2 * s, '#e23b45')
  px(ctx, 9 * s, 11 * s, 2 * s, 2 * s, '#e23b45')
  px(ctx, 5 * s, 13 * s, 6 * s, 1 * s, '#ff9eaa')
  // counter
  drawPixelText(ctx, '1/5', Math.round(15 * s), Math.round(13 * s), '#ffffff', Math.max(1, Math.round(s)))
  return canvas
}

function drawActionButton(logical: number, accent: string): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas(logical)
  const s = logical / 32
  const cx = 16 * s
  const cy = 16 * s
  // circle body
  for (let y = -10; y <= 10; y++) {
    for (let x = -10; x <= 10; x++) {
      if (x * x + y * y <= 100) {
        ctx.fillStyle = accent
        ctx.fillRect(Math.round(cx + x * s / 1.2), Math.round(cy + y * s / 1.2), Math.max(1, Math.round(s)), Math.max(1, Math.round(s)))
      }
    }
  }
  // highlight
  px(ctx, 10 * s, 8 * s, 6 * s, 3 * s, shadeHex(accent, 40))
  // doc icon
  px(ctx, 13 * s, 11 * s, 6 * s, 8 * s, '#ffffff')
  px(ctx, 14 * s, 12 * s, 4 * s, 1 * s, accent)
  px(ctx, 14 * s, 14 * s, 4 * s, 1 * s, accent)
  px(ctx, 14 * s, 16 * s, 3 * s, 1 * s, accent)
  return canvas
}

function drawPrimaryButton(logical: number): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas(logical)
  const s = logical / 32
  px(ctx, 2 * s, 10 * s, 28 * s, 12 * s, '#e23b45')
  px(ctx, 2 * s, 10 * s, 28 * s, 3 * s, '#ff6b6b')
  px(ctx, 2 * s, 19 * s, 28 * s, 3 * s, '#c43038')
  drawPixelText(ctx, 'ok', Math.round(12 * s), Math.round(13 * s), '#ffffff', Math.max(1, Math.round(s)))
  return canvas
}

function drawSecondaryButton(logical: number): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas(logical)
  const s = logical / 32
  px(ctx, 2 * s, 10 * s, 28 * s, 12 * s, '#3f78c8')
  px(ctx, 2 * s, 10 * s, 28 * s, 3 * s, '#5a96e6')
  px(ctx, 2 * s, 19 * s, 28 * s, 3 * s, '#2f5a9a')
  drawPixelText(ctx, 'back', Math.round(8 * s), Math.round(13 * s), '#ffffff', Math.max(1, Math.round(s)))
  return canvas
}

function drawDialogPanel(logical: number): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas(logical)
  const s = logical / 32
  px(ctx, 2 * s, 4 * s, 28 * s, 24 * s, '#fffaf0')
  px(ctx, 2 * s, 4 * s, 28 * s, 4 * s, '#4696e6')
  px(ctx, 4 * s, 10 * s, 24 * s, 2 * s, '#d8d0c4')
  px(ctx, 4 * s, 14 * s, 20 * s, 2 * s, '#d8d0c4')
  px(ctx, 4 * s, 18 * s, 16 * s, 2 * s, '#d8d0c4')
  return canvas
}

function drawHeartIcon(logical: number): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas(logical)
  const s = logical / 32
  const c = '#e23b45'
  px(ctx, 10 * s, 10 * s, 4 * s, 4 * s, c)
  px(ctx, 18 * s, 10 * s, 4 * s, 4 * s, c)
  px(ctx, 8 * s, 12 * s, 16 * s, 6 * s, c)
  px(ctx, 10 * s, 18 * s, 12 * s, 4 * s, c)
  px(ctx, 12 * s, 22 * s, 8 * s, 2 * s, c)
  px(ctx, 14 * s, 24 * s, 4 * s, 2 * s, c)
  px(ctx, 12 * s, 12 * s, 2 * s, 2 * s, '#ff9eaa')
  return canvas
}

function drawCoinIcon(logical: number): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas(logical)
  const s = logical / 32
  const cx = 16 * s
  const cy = 16 * s
  for (let y = -8; y <= 8; y++) {
    for (let x = -8; x <= 8; x++) {
      if (x * x + y * y <= 64) {
        ctx.fillStyle = '#ffb703'
        ctx.fillRect(Math.round(cx + x * (s / 1.1)), Math.round(cy + y * (s / 1.1)), Math.max(1, Math.round(s)), Math.max(1, Math.round(s)))
      }
    }
  }
  px(ctx, 12 * s, 10 * s, 4 * s, 2 * s, '#ffe08a')
  drawPixelText(ctx, 'g', Math.round(14 * s), Math.round(13 * s), '#8a5a00', Math.max(1, Math.round(s)))
  return canvas
}

function drawSaveBadge(logical: number): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas(logical)
  const s = logical / 32
  px(ctx, 4 * s, 8 * s, 24 * s, 16 * s, '#ffffff')
  px(ctx, 4 * s, 8 * s, 24 * s, 5 * s, '#e23b45')
  drawPixelText(ctx, 'save', Math.round(8 * s), Math.round(9 * s), '#ffffff', Math.max(1, Math.round(s)))
  drawPixelText(ctx, '2', Math.round(13 * s), Math.round(16 * s), '#1a1420', Math.max(1, Math.round(s)))
  return canvas
}

function drawQuestBanner(logical: number): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas(logical)
  const s = logical / 32
  px(ctx, 1 * s, 8 * s, 30 * s, 16 * s, '#2a8f42')
  px(ctx, 1 * s, 8 * s, 30 * s, 3 * s, '#3db85a')
  drawPixelText(ctx, 'fresh', Math.round(6 * s), Math.round(13 * s), '#ffffff', Math.max(1, Math.round(s)))
  return canvas
}

function drawSpeechBubble(logical: number): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas(logical)
  const s = logical / 32
  px(ctx, 3 * s, 4 * s, 26 * s, 18 * s, '#ffffff')
  px(ctx, 8 * s, 22 * s, 4 * s, 4 * s, '#ffffff')
  px(ctx, 6 * s, 24 * s, 3 * s, 3 * s, '#ffffff')
  px(ctx, 6 * s, 8 * s, 20 * s, 2 * s, '#d8d0c4')
  px(ctx, 6 * s, 12 * s, 14 * s, 2 * s, '#d8d0c4')
  return canvas
}

function drawJoypadHint(logical: number): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas(logical)
  const s = logical / 32
  // D-pad
  px(ctx, 13 * s, 8 * s, 6 * s, 16 * s, '#3a4558')
  px(ctx, 8 * s, 13 * s, 16 * s, 6 * s, '#3a4558')
  px(ctx, 14 * s, 9 * s, 4 * s, 4 * s, '#8a96a8')
  px(ctx, 14 * s, 19 * s, 4 * s, 4 * s, '#8a96a8')
  px(ctx, 9 * s, 14 * s, 4 * s, 4 * s, '#8a96a8')
  px(ctx, 19 * s, 14 * s, 4 * s, 4 * s, '#8a96a8')
  return canvas
}

/** Generate a full pixel UI kit pack. */
export function generateUiKit(opts: UiGenerateOptions): UiAsset[] {
  const size = opts.size
  const logical = Math.min(32, logicalSizeFor(size))

  return [
    pack('Basket HUD', 'hud', drawBasketHud(logical), size),
    pack('Action Button', 'button', drawActionButton(logical, '#ff8a3d'), size),
    pack('Primary Button', 'button', drawPrimaryButton(logical), size),
    pack('Secondary Button', 'button', drawSecondaryButton(logical), size),
    pack('Dialog Panel', 'panel', drawDialogPanel(logical), size),
    pack('Speech Bubble', 'panel', drawSpeechBubble(logical), size),
    pack('Heart', 'icon', drawHeartIcon(logical), size),
    pack('Coin', 'icon', drawCoinIcon(logical), size),
    pack('Save Badge', 'badge', drawSaveBadge(logical), size),
    pack('Quest Banner', 'badge', drawQuestBanner(logical), size),
    pack('D-Pad Hint', 'icon', drawJoypadHint(logical), size),
  ]
}

export function packUiSheet(assets: UiAsset[], columns = 4): HTMLCanvasElement {
  if (!assets.length) return createCanvas(1, 1)
  const size = assets[0].size
  const cols = Math.min(columns, assets.length)
  const rows = Math.ceil(assets.length / cols)
  const sheet = createCanvas(cols * size, rows * size)
  const ctx = getCtx(sheet, false)
  ctx.imageSmoothingEnabled = false
  assets.forEach((a, i) => {
    ctx.drawImage(a.canvas, (i % cols) * size, Math.floor(i / cols) * size)
  })
  return sheet
}
