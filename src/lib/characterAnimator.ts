import type {
  AnimationFrame,
  AnimationType,
  FrameSize,
  GeneratedAnimation,
  RGB,
  SpriteSheetMeta,
} from '../types'
import { cloneCanvas, createCanvas, getCtx, pixelateToStyle } from './pixelate'

interface AnimConfig {
  frames: number
  fps: number
  transform: (t: number, size: number) => FrameTransform
}

interface FrameTransform {
  dx?: number
  dy?: number
  sx?: number
  sy?: number
  shearX?: number
  rotate?: number
  flash?: RGB | null
  squashBottom?: number
  legPhase?: number
}

const ANIMATIONS: Record<AnimationType, AnimConfig> = {
  idle: {
    frames: 4,
    fps: 6,
    transform: (t, size) => ({
      dy: Math.sin(t * Math.PI * 2) * Math.max(1, size * 0.04),
      sy: 1 + Math.sin(t * Math.PI * 2) * 0.03,
      sx: 1 - Math.sin(t * Math.PI * 2) * 0.02,
    }),
  },
  walk: {
    frames: 6,
    fps: 10,
    transform: (t, size) => {
      const bob = Math.abs(Math.sin(t * Math.PI * 2)) * Math.max(1, size * 0.06)
      return {
        dy: -bob,
        dx: Math.sin(t * Math.PI * 2) * Math.max(1, size * 0.03),
        legPhase: t,
        sx: 1 + Math.sin(t * Math.PI * 2) * 0.02,
        sy: 1 - Math.abs(Math.sin(t * Math.PI * 2)) * 0.04,
      }
    },
  },
  run: {
    frames: 6,
    fps: 14,
    transform: (t, size) => {
      const bob = Math.abs(Math.sin(t * Math.PI * 2)) * Math.max(1, size * 0.1)
      return {
        dy: -bob,
        dx: Math.sin(t * Math.PI * 2) * Math.max(1, size * 0.05),
        shearX: 0.12,
        legPhase: t,
        sx: 1.05,
        sy: 0.92 + Math.abs(Math.sin(t * Math.PI * 2)) * 0.06,
      }
    },
  },
  jump: {
    frames: 6,
    fps: 10,
    transform: (t, size) => {
      // Anticipation → air → land
      if (t < 0.2) {
        return { sy: 0.85, sx: 1.15, dy: size * 0.05 }
      }
      if (t < 0.7) {
        const air = (t - 0.2) / 0.5
        const arc = Math.sin(air * Math.PI) * size * 0.35
        return { dy: -arc, sy: 1.08, sx: 0.92 }
      }
      return { sy: 0.88, sx: 1.12, dy: size * 0.04 }
    },
  },
  attack: {
    frames: 5,
    fps: 12,
    transform: (t, size) => {
      if (t < 0.25) return { dx: -size * 0.08, sx: 0.95 }
      if (t < 0.55) {
        return {
          dx: size * 0.18,
          shearX: 0.2,
          flash: { r: 255, g: 240, b: 180 },
        }
      }
      return { dx: size * 0.05, shearX: 0.05 }
    },
  },
  hurt: {
    frames: 4,
    fps: 10,
    transform: (t, size) => ({
      dx: Math.sin(t * Math.PI * 6) * size * 0.08,
      flash: t % 0.5 < 0.25 ? { r: 255, g: 80, b: 80 } : null,
      sy: 0.95,
    }),
  },
  celebrate: {
    frames: 6,
    fps: 10,
    transform: (t, size) => {
      const bounce = Math.abs(Math.sin(t * Math.PI * 2)) * size * 0.2
      return {
        dy: -bounce,
        rotate: Math.sin(t * Math.PI * 2) * 0.12,
        sy: 1 + Math.sin(t * Math.PI * 2) * 0.08,
        sx: 1 - Math.sin(t * Math.PI * 2) * 0.05,
      }
    },
  },
}

function applyTransform(
  base: HTMLCanvasElement,
  tf: FrameTransform,
): HTMLCanvasElement {
  const size = base.width
  const out = createCanvas(size, size)
  const ctx = getCtx(out)

  ctx.save()
  const cx = size / 2
  const cy = size / 2
  ctx.translate(cx + (tf.dx ?? 0), cy + (tf.dy ?? 0))
  if (tf.rotate) ctx.rotate(tf.rotate)
  if (tf.shearX) ctx.transform(1, 0, tf.shearX, 1, 0, 0)
  ctx.scale(tf.sx ?? 1, tf.sy ?? 1)
  ctx.translate(-cx, -cy)

  if (tf.legPhase != null) {
    // Split body: upper half static-ish, lower half alternating offset for walk cycle
    const midY = Math.floor(size * 0.55)
    const phase = Math.sin(tf.legPhase * Math.PI * 2)
    const shift = Math.round(phase * Math.max(1, size * 0.06))

    // Upper body
    ctx.drawImage(base, 0, 0, size, midY, 0, 0, size, midY)
    // Lower body with horizontal offset (fake leg swing)
    ctx.drawImage(base, 0, midY, size, size - midY, shift, midY, size, size - midY)
  } else {
    ctx.drawImage(base, 0, 0)
  }
  ctx.restore()

  if (tf.flash) {
    const img = ctx.getImageData(0, 0, size, size)
    const { data } = img
    const { r, g, b } = tf.flash
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 40) continue
      data[i] = Math.min(255, Math.round(data[i] * 0.55 + r * 0.45))
      data[i + 1] = Math.min(255, Math.round(data[i + 1] * 0.55 + g * 0.45))
      data[i + 2] = Math.min(255, Math.round(data[i + 2] * 0.55 + b * 0.45))
    }
    ctx.putImageData(img, 0, 0)
  }

  return out
}

export function generateAnimation(
  source: HTMLImageElement | HTMLCanvasElement,
  type: AnimationType,
  frameSize: FrameSize,
  palette: RGB[],
): GeneratedAnimation {
  const base = pixelateToStyle(source, frameSize, palette)
  const config = ANIMATIONS[type]
  const frames: AnimationFrame[] = []

  for (let i = 0; i < config.frames; i++) {
    const t = i / config.frames
    const tf = config.transform(t, frameSize)
    const frame = applyTransform(base, tf)
    frames.push({ canvas: frame, index: i })
  }

  const sheetCanvas = packFrames(frames, frameSize)

  return {
    type,
    frames,
    frameSize,
    sheetCanvas,
    fps: config.fps,
  }
}

export function generateAllAnimations(
  source: HTMLImageElement | HTMLCanvasElement,
  types: AnimationType[],
  frameSize: FrameSize,
  palette: RGB[],
): GeneratedAnimation[] {
  return types.map((type) => generateAnimation(source, type, frameSize, palette))
}

export function packFrames(
  frames: AnimationFrame[],
  frameSize: number,
  columns?: number,
): HTMLCanvasElement {
  const cols = columns ?? frames.length
  const rows = Math.ceil(frames.length / cols)
  const sheet = createCanvas(cols * frameSize, rows * frameSize)
  const ctx = getCtx(sheet)
  frames.forEach((f, i) => {
    const x = (i % cols) * frameSize
    const y = Math.floor(i / cols) * frameSize
    ctx.drawImage(f.canvas, x, y)
  })
  return sheet
}

export function packMultiAnimationSheet(
  animations: GeneratedAnimation[],
): { canvas: HTMLCanvasElement; meta: SpriteSheetMeta } {
  const frameSize = animations[0]?.frameSize ?? 32
  const maxFrames = Math.max(...animations.map((a) => a.frames.length), 1)
  const rowCount = animations.length
  const canvas = createCanvas(maxFrames * frameSize, rowCount * frameSize)
  const ctx = getCtx(canvas)

  animations.forEach((anim, row) => {
    anim.frames.forEach((f, col) => {
      ctx.drawImage(f.canvas, col * frameSize, row * frameSize)
    })
  })

  const meta: SpriteSheetMeta = {
    frameWidth: frameSize,
    frameHeight: frameSize,
    frameCount: animations.reduce((s, a) => s + a.frames.length, 0),
    columns: maxFrames,
    rows: rowCount,
    animations: Object.fromEntries(
      animations.map((anim, row) => [
        anim.type,
        {
          start: row * maxFrames,
          end: row * maxFrames + anim.frames.length - 1,
          fps: anim.fps,
        },
      ]),
    ),
  }

  return { canvas, meta }
}

export function getBasePixelSprite(
  source: HTMLImageElement | HTMLCanvasElement,
  frameSize: FrameSize,
  palette: RGB[],
): HTMLCanvasElement {
  return cloneCanvas(pixelateToStyle(source, frameSize, palette))
}
