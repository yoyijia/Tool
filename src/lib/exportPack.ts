import type { GeneratedAnimation, SpriteSheetMeta } from '../types'
import { createCanvas, getCtx } from './pixelate'

/** TexturePacker-compatible JSON (hash format) for Unity / Godot / GameMaker. */
export function buildTexturePackerAtlas(
  animations: GeneratedAnimation[],
  imageName: string,
): Record<string, unknown> {
  const frameSize = animations[0]?.frameSize ?? 128
  const maxFrames = Math.max(...animations.map((a) => a.frames.length), 1)
  const frames: Record<string, unknown> = {}

  animations.forEach((anim, row) => {
    anim.frames.forEach((f, col) => {
      const name = `${anim.type}_${String(f.index).padStart(3, '0')}.png`
      frames[name] = {
        frame: {
          x: col * frameSize,
          y: row * frameSize,
          w: frameSize,
          h: frameSize,
        },
        rotated: false,
        trimmed: false,
        spriteSourceSize: { x: 0, y: 0, w: frameSize, h: frameSize },
        sourceSize: { w: frameSize, h: frameSize },
      }
    })
  })

  return {
    frames,
    meta: {
      app: 'SpriteNest (Ludo.ai-inspired)',
      version: '1.0',
      image: imageName,
      format: 'RGBA8888',
      size: {
        w: maxFrames * frameSize,
        h: animations.length * frameSize,
      },
      scale: '1',
      smartupdate: '',
    },
    animations: Object.fromEntries(
      animations.map((anim, row) => [
        anim.type,
        {
          row,
          frameCount: anim.frames.length,
          fps: anim.fps,
          loop: ['idle', 'walk', 'run'].includes(anim.type),
        },
      ]),
    ),
  }
}

export function buildEngineMeta(
  animations: GeneratedAnimation[],
): SpriteSheetMeta & { style: string; engineHints: string[] } {
  const frameSize = animations[0]?.frameSize ?? 128
  const maxFrames = Math.max(...animations.map((a) => a.frames.length), 1)
  return {
    frameWidth: frameSize,
    frameHeight: frameSize,
    frameCount: animations.reduce((s, a) => s + a.frames.length, 0),
    columns: maxFrames,
    rows: animations.length,
    style: 'pixel-art',
    engineHints: ['Unity', 'Godot', 'GameMaker'],
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
}

function downloadBlob(blob: Blob, filename: string): void {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

/** Minimal GIF89a encoder (256-color, looping). */
export async function exportAnimationGif(
  animation: GeneratedAnimation,
  filename: string,
): Promise<void> {
  const size = animation.frameSize
  const delayCs = Math.max(2, Math.round(100 / animation.fps)) // centiseconds
  const indexedFrames: { pixels: Uint8Array; delay: number }[] = []

  // Build global palette from first frame + accumulate
  const palette: number[] = []
  const colorIndex = new Map<string, number>()

  const addColor = (r: number, g: number, b: number) => {
    const key = `${r >> 3},${g >> 3},${b >> 3}`
    let idx = colorIndex.get(key)
    if (idx != null) return idx
    if (palette.length >= 255) return 0
    idx = palette.length
    palette.push(((r >> 3) << 3) | (((g >> 3) << 3) << 8) | (((b >> 3) << 3) << 16))
    // store as r,g,b triples separately
    colorIndex.set(key, idx)
    return idx
  }

  // transparent index 0
  palette.push(0)
  colorIndex.set('0,0,0-t', 0)

  const tmp = createCanvas(size, size)
  const ctx = getCtx(tmp, true)

  for (const frame of animation.frames) {
    ctx.clearRect(0, 0, size, size)
    ctx.drawImage(frame.canvas, 0, 0)
    const { data } = ctx.getImageData(0, 0, size, size)
    const pixels = new Uint8Array(size * size)
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      if (data[i + 3] < 40) {
        pixels[p] = 0
        continue
      }
      // rebuild palette map with actual RGB storage
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const key = `${r >> 3},${g >> 3},${b >> 3}`
      let idx = colorIndex.get(key)
      if (idx == null) {
        if (colorIndex.size >= 256) idx = 1
        else {
          idx = colorIndex.size
          colorIndex.set(key, idx)
        }
      }
      pixels[p] = idx
    }
    indexedFrames.push({ pixels, delay: delayCs })
  }

  // Materialize palette RGB table
  const rgbPalette = new Uint8Array(256 * 3)
  const entries = [...colorIndex.entries()].sort((a, b) => a[1] - b[1])
  for (const [key, idx] of entries) {
    if (key.endsWith('-t') || idx === 0) {
      rgbPalette[0] = 0
      rgbPalette[1] = 0
      rgbPalette[2] = 0
      continue
    }
    const [rq, gq, bq] = key.split(',').map((n) => Number(n) << 3)
    rgbPalette[idx * 3] = rq
    rgbPalette[idx * 3 + 1] = gq
    rgbPalette[idx * 3 + 2] = bq
  }

  void addColor
  const gif = encodeGif(size, size, rgbPalette, indexedFrames)
  downloadBlob(new Blob([gif.buffer as ArrayBuffer], { type: 'image/gif' }), filename)
}

function encodeGif(
  w: number,
  h: number,
  palette: Uint8Array,
  frames: { pixels: Uint8Array; delay: number }[],
): Uint8Array {
  const parts: number[] = []
  const pushBytes = (...bytes: number[]) => parts.push(...bytes)
  const pushStr = (s: string) => {
    for (let i = 0; i < s.length; i++) parts.push(s.charCodeAt(i))
  }

  pushStr('GIF89a')
  pushBytes(w & 255, w >> 8, h & 255, h >> 8)
  pushBytes(0xf7, 0, 0) // GCT 256 colors
  for (let i = 0; i < 256 * 3; i++) pushBytes(palette[i] ?? 0)

  // Netscape loop
  pushBytes(0x21, 0xff, 0x0b)
  pushStr('NETSCAPE2.0')
  pushBytes(0x03, 0x01, 0x00, 0x00, 0x00)

  for (const frame of frames) {
    // Graphic control — transparent index 0
    pushBytes(0x21, 0xf9, 0x04, 0x09, frame.delay & 255, frame.delay >> 8, 0x00, 0x00)
    // Image descriptor
    pushBytes(0x2c, 0, 0, 0, 0, w & 255, w >> 8, h & 255, h >> 8, 0)
    // LZW min code size
    pushBytes(8)
    const compressed = lzwEncode(frame.pixels, 8)
    for (let i = 0; i < compressed.length; i += 255) {
      const chunk = compressed.subarray(i, Math.min(i + 255, compressed.length))
      pushBytes(chunk.length)
      for (let j = 0; j < chunk.length; j++) pushBytes(chunk[j])
    }
    pushBytes(0)
  }
  pushBytes(0x3b)

  return new Uint8Array(parts)
}

function lzwEncode(indexStream: Uint8Array, minCodeSize: number): Uint8Array {
  const clearCode = 1 << minCodeSize
  const eoiCode = clearCode + 1
  let codeSize = minCodeSize + 1
  let nextCode = eoiCode + 1
  const maxCode = () => 1 << codeSize

  type Dict = Map<string, number>
  let dict: Dict = new Map()
  const resetDict = () => {
    dict = new Map()
    for (let i = 0; i < clearCode; i++) dict.set(String.fromCharCode(i), i)
    nextCode = eoiCode + 1
    codeSize = minCodeSize + 1
  }
  resetDict()

  const outBits: number[] = []
  let cur = 0
  let curBits = 0
  const writeCode = (code: number) => {
    cur |= code << curBits
    curBits += codeSize
    while (curBits >= 8) {
      outBits.push(cur & 255)
      cur >>= 8
      curBits -= 8
    }
  }

  writeCode(clearCode)
  let w = String.fromCharCode(indexStream[0])
  for (let i = 1; i < indexStream.length; i++) {
    const k = String.fromCharCode(indexStream[i])
    const wk = w + k
    if (dict.has(wk)) {
      w = wk
    } else {
      writeCode(dict.get(w)!)
      if (nextCode < 4096) {
        dict.set(wk, nextCode++)
        if (nextCode === maxCode() && codeSize < 12) codeSize++
      } else {
        writeCode(clearCode)
        resetDict()
      }
      w = k
    }
  }
  writeCode(dict.get(w)!)
  writeCode(eoiCode)
  if (curBits > 0) outBits.push(cur & 255)
  return new Uint8Array(outBits)
}

export function downloadText(text: string, filename: string, type = 'application/json'): void {
  downloadBlob(new Blob([text], { type }), filename)
}
