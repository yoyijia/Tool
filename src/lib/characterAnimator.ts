import type {
  AnimationFrame,
  AnimationType,
  CharacterLoadoutData,
  FrameSize,
  GeneratedAnimation,
  RGB,
  SpriteSheetMeta,
} from '../types'
import { cloneCanvas, createCanvas, getCtx, renderCleanVectorFrame } from './pixelate'
import { generateSideCycleFrames } from './walkCycle'
import type { CharacterLoadout } from './characterParts'
import { DEFAULT_LOADOUT } from './characterParts'

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
  legPhase?: number
}

const ANIMATIONS: Record<AnimationType, AnimConfig> = {
  idle: {
    frames: 4,
    fps: 6,
    transform: (t, size) => ({
      dy: Math.sin(t * Math.PI * 2) * Math.max(2, size * 0.025),
      sy: 1 + Math.sin(t * Math.PI * 2) * 0.025,
      sx: 1 - Math.sin(t * Math.PI * 2) * 0.015,
    }),
  },
  walk: {
    frames: 6,
    fps: 10,
    transform: (t, size) => {
      const bob = Math.abs(Math.sin(t * Math.PI * 2)) * Math.max(2, size * 0.04)
      return {
        dy: -bob,
        dx: Math.sin(t * Math.PI * 2) * Math.max(1, size * 0.02),
        legPhase: t,
        sx: 1 + Math.sin(t * Math.PI * 2) * 0.015,
        sy: 1 - Math.abs(Math.sin(t * Math.PI * 2)) * 0.03,
      }
    },
  },
  run: {
    frames: 6,
    fps: 14,
    transform: (t, size) => {
      const bob = Math.abs(Math.sin(t * Math.PI * 2)) * Math.max(3, size * 0.07)
      return {
        dy: -bob,
        dx: Math.sin(t * Math.PI * 2) * Math.max(2, size * 0.035),
        shearX: 0.1,
        legPhase: t,
        sx: 1.04,
        sy: 0.94 + Math.abs(Math.sin(t * Math.PI * 2)) * 0.05,
      }
    },
  },
  jump: {
    frames: 6,
    fps: 10,
    transform: (t, size) => {
      if (t < 0.2) {
        return { sy: 0.88, sx: 1.12, dy: size * 0.04 }
      }
      if (t < 0.7) {
        const air = (t - 0.2) / 0.5
        const arc = Math.sin(air * Math.PI) * size * 0.28
        return { dy: -arc, sy: 1.06, sx: 0.94 }
      }
      return { sy: 0.9, sx: 1.1, dy: size * 0.03 }
    },
  },
  attack: {
    frames: 5,
    fps: 12,
    transform: (t, size) => {
      if (t < 0.25) return { dx: -size * 0.06, sx: 0.96 }
      if (t < 0.55) {
        return {
          dx: size * 0.14,
          shearX: 0.16,
          flash: { r: 255, g: 240, b: 200 },
        }
      }
      return { dx: size * 0.04, shearX: 0.04 }
    },
  },
  hurt: {
    frames: 4,
    fps: 10,
    transform: (t, size) => ({
      dx: Math.sin(t * Math.PI * 6) * size * 0.06,
      flash: t % 0.5 < 0.25 ? { r: 255, g: 120, b: 130 } : null,
      sy: 0.96,
    }),
  },
  celebrate: {
    frames: 6,
    fps: 10,
    transform: (t, size) => {
      const bounce = Math.abs(Math.sin(t * Math.PI * 2)) * size * 0.16
      return {
        dy: -bounce,
        rotate: Math.sin(t * Math.PI * 2) * 0.1,
        sy: 1 + Math.sin(t * Math.PI * 2) * 0.06,
        sx: 1 - Math.sin(t * Math.PI * 2) * 0.04,
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
  const ctx = getCtx(out, true)

  ctx.save()
  const cx = size / 2
  const cy = size / 2
  ctx.translate(cx + (tf.dx ?? 0), cy + (tf.dy ?? 0))
  if (tf.rotate) ctx.rotate(tf.rotate)
  if (tf.shearX) ctx.transform(1, 0, tf.shearX, 1, 0, 0)
  ctx.scale(tf.sx ?? 1, tf.sy ?? 1)
  ctx.translate(-cx, -cy)

  if (tf.legPhase != null) {
    const midY = Math.floor(size * 0.58)
    const phase = Math.sin(tf.legPhase * Math.PI * 2)
    const shift = Math.round(phase * Math.max(2, size * 0.045))

    ctx.drawImage(base, 0, 0, size, midY, 0, 0, size, midY)
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
      if (data[i + 3] < 20) continue
      data[i] = Math.min(255, Math.round(data[i] * 0.6 + r * 0.4))
      data[i + 1] = Math.min(255, Math.round(data[i + 1] * 0.6 + g * 0.4))
      data[i + 2] = Math.min(255, Math.round(data[i + 2] * 0.6 + b * 0.4))
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
  poseSources?: Partial<Record<string, HTMLImageElement | HTMLCanvasElement>>,
  frameCountOverride?: number,
  loadout?: CharacterLoadoutData,
): GeneratedAnimation {
  const config = ANIMATIONS[type]
  const frameCount = Math.max(
    2,
    Math.min(64, frameCountOverride ?? config.frames),
  )

  // Proper side-view limb cycles for walk / run / idle (reference walk-sheet style)
  if (type === 'walk' || type === 'run' || type === 'idle') {
    const kind = type === 'run' ? 'run' : type === 'idle' ? 'idle' : 'walk'
    const lo = (loadout ?? DEFAULT_LOADOUT) as CharacterLoadout
    const cycleFrames = generateSideCycleFrames(
      frameSize,
      frameCount,
      kind,
      lo,
      'right',
    )
    const frames: AnimationFrame[] = cycleFrames.map((canvas, index) => ({
      canvas,
      index,
    }))
    const fpsScale = frameCount / config.frames
    const fps = Math.max(
      4,
      Math.round(config.fps * Math.min(2, Math.max(0.75, fpsScale))),
    )
    return {
      type,
      frames,
      frameSize,
      sheetCanvas: packFrames(frames, frameSize),
      fps,
    }
  }

  const base = renderCleanVectorFrame(source, frameSize, palette, {
    snapPalette: true,
    softOutline: false,
    anchor: 'center',
  })
  const frames: AnimationFrame[] = []

  const downPose = poseSources?.down
    ? renderCleanVectorFrame(poseSources.down, frameSize, palette, {
        anchor: 'center',
      })
    : base
  const wavePose = poseSources?.wave
    ? renderCleanVectorFrame(poseSources.wave, frameSize, palette, {
        anchor: 'center',
      })
    : null

  for (let i = 0; i < frameCount; i++) {
    const t = i / frameCount
    let frameBase = base
    if (type === 'celebrate' && wavePose) frameBase = wavePose
    else if (downPose) frameBase = downPose

    const tf = config.transform(t, frameSize)
    frames.push({ canvas: applyTransform(frameBase, tf), index: i })
  }

  const fpsScale = frameCount / config.frames
  const fps = Math.max(
    4,
    Math.round(config.fps * Math.min(2, Math.max(0.75, fpsScale))),
  )

  return {
    type,
    frames,
    frameSize,
    sheetCanvas: packFrames(frames, frameSize),
    fps,
  }
}

export function generateAllAnimations(
  source: HTMLImageElement | HTMLCanvasElement,
  types: AnimationType[],
  frameSize: FrameSize,
  palette: RGB[],
  poseSources?: Partial<Record<string, HTMLImageElement | HTMLCanvasElement>>,
  frameCountOverride?: number,
  loadout?: CharacterLoadoutData,
): GeneratedAnimation[] {
  return types.map((type) =>
    generateAnimation(
      source,
      type,
      frameSize,
      palette,
      poseSources,
      frameCountOverride,
      loadout,
    ),
  )
}

export function packFrames(
  frames: AnimationFrame[],
  frameSize: number,
  columns?: number,
): HTMLCanvasElement {
  const cols = columns ?? frames.length
  const rows = Math.ceil(frames.length / cols)
  const sheet = createCanvas(cols * frameSize, rows * frameSize)
  const ctx = getCtx(sheet, true)
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
  const frameSize = animations[0]?.frameSize ?? 128
  const maxFrames = Math.max(...animations.map((a) => a.frames.length), 1)
  const rowCount = animations.length
  const canvas = createCanvas(maxFrames * frameSize, rowCount * frameSize)
  const ctx = getCtx(canvas, true)

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

export function getBaseVectorSprite(
  source: HTMLImageElement | HTMLCanvasElement,
  frameSize: FrameSize,
  palette: RGB[],
): HTMLCanvasElement {
  return cloneCanvas(
    renderCleanVectorFrame(source, frameSize, palette, {
      snapPalette: true,
      anchor: 'center',
    }),
  )
}
