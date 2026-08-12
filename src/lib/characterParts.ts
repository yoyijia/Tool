import {
  createPixelCanvas,
  outlineCanvas,
  pixelCircle,
  px,
  shadeHex,
  upscalePixel,
} from './pixelArt'

export type PartSlot =
  | 'hair'
  | 'eyes'
  | 'hands'
  | 'legs'
  | 'shirt'
  | 'pants'
  | 'accessory'

export interface PartOption {
  id: string
  label: string
  slot: PartSlot
  /** Preview swatch color hint */
  swatch?: string
}

export interface CharacterLoadout {
  hair: string
  eyes: string
  hands: string
  legs: string
  shirt: string
  pants: string
  accessory: string
  skin: string
  hairColor: string
  shirtColor: string
  pantsColor: string
  accessoryColor: string
}

export const DEFAULT_LOADOUT: CharacterLoadout = {
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
}

export const PART_OPTIONS: Record<PartSlot, PartOption[]> = {
  hair: [
    { id: 'curly', label: 'Curly', slot: 'hair', swatch: '#3a3338' },
    { id: 'short', label: 'Short', slot: 'hair', swatch: '#3a3338' },
    { id: 'bun', label: 'Bun', slot: 'hair', swatch: '#3a3338' },
    { id: 'spiky', label: 'Spiky', slot: 'hair', swatch: '#e85a20' },
    { id: 'explorer', label: 'Explorer Hat', slot: 'hair', swatch: '#c4a574' },
    { id: 'cap', label: 'Front Cap', slot: 'hair', swatch: '#e23b45' },
    { id: 'backwards', label: 'Backwards Cap', slot: 'hair', swatch: '#2a262e' },
    { id: 'none', label: 'Bald', slot: 'hair' },
  ],
  eyes: [
    { id: 'dots', label: 'Dot Eyes', slot: 'eyes' },
    { id: 'oval', label: 'Oval Eyes', slot: 'eyes' },
    { id: 'happy', label: 'Happy', slot: 'eyes' },
    { id: 'wink', label: 'Wink', slot: 'eyes' },
    { id: 'wide', label: 'Wide', slot: 'eyes' },
    { id: 'tired', label: 'Tired', slot: 'eyes' },
  ],
  hands: [
    { id: 'relaxed', label: 'Relaxed', slot: 'hands' },
    { id: 'wave', label: 'Wave', slot: 'hands' },
    { id: 'akimbo', label: 'On Hips', slot: 'hands' },
    { id: 'out', label: 'Arms Out', slot: 'hands' },
  ],
  legs: [
    { id: 'straight', label: 'Straight', slot: 'legs' },
    { id: 'stride', label: 'Stride', slot: 'legs' },
    { id: 'together', label: 'Together', slot: 'legs' },
  ],
  shirt: [
    { id: 'tee', label: 'T-Shirt', slot: 'shirt' },
    { id: 'hoodie', label: 'Hoodie', slot: 'shirt' },
    { id: 'tank', label: 'Tank', slot: 'shirt' },
    { id: 'overalls', label: 'Overall Top', slot: 'shirt' },
  ],
  pants: [
    { id: 'shorts', label: 'Shorts', slot: 'pants' },
    { id: 'jeans', label: 'Jeans', slot: 'pants' },
    { id: 'overalls', label: 'Overalls', slot: 'pants' },
    { id: 'skirt', label: 'Skirt', slot: 'pants' },
  ],
  accessory: [
    { id: 'none', label: 'None', slot: 'accessory' },
    { id: 'satchel', label: 'Satchel', slot: 'accessory', swatch: '#a0dc50' },
    { id: 'backpack', label: 'Backpack', slot: 'accessory', swatch: '#3f78c8' },
    { id: 'scarf', label: 'Scarf', slot: 'accessory', swatch: '#ffb703' },
  ],
}

export const COLOR_PRESETS = {
  skin: ['#ffd6ba', '#f2c9a0', '#d4a574', '#c68642', '#8d5524'],
  hair: ['#3a3338', '#5a4030', '#c9a06c', '#f0e6d8', '#e23b45', '#4696e6'],
  shirt: ['#e85a64', '#e23b45', '#4696e6', '#f5f5f8', '#3db85a', '#ffb703', '#8e6cff'],
  pants: ['#4696e6', '#3f78c8', '#2a262e', '#e85a64', '#3db85a', '#f5f5f8'],
  accessory: ['#a0dc50', '#3f78c8', '#ffb703', '#e85a64', '#2a262e'],
}

/**
 * Compose a classic chibi pixel character from modular parts,
 * then nearest-neighbor upscale into the output frame.
 */
export function composeCharacter(
  loadout: CharacterLoadout,
  size = 256,
): HTMLCanvasElement {
  const LOGICAL = 32
  const { canvas, ctx } = createPixelCanvas(LOGICAL)
  const cx = 16
  const skin = loadout.skin
  const skinShade = shadeHex(skin, -28)
  const shirt = loadout.shirtColor
  const shirtShade = shadeHex(shirt, -28)
  const pants = loadout.pantsColor
  const pantsShade = shadeHex(pants, -28)
  const hair = loadout.hairColor
  const bag = loadout.accessoryColor
  const shoe = '#000000'

  px(ctx, cx - 5, 29, 10, 2, 'rgba(0,0,0,0.15)')

  const stride = loadout.legs === 'stride' ? 1 : 0
  const gap = loadout.legs === 'together' ? 0 : 1
  if (loadout.pants === 'skirt') {
    px(ctx, cx - 5, 20, 10, 5, pants)
    px(ctx, cx - 4, 24, 3, 4, skin)
    px(ctx, cx + 1, 24, 3, 4, skin)
    px(ctx, cx - 5, 27, 4, 2, shoe)
    px(ctx, cx + 1, 27, 4, 2, shoe)
  } else {
    px(ctx, cx - 4 - stride, 22, 3, 6, pants)
    px(ctx, cx + gap + stride, 22, 3, 6, pants)
    px(ctx, cx - 4 - stride, 25, 3, 3, pantsShade)
    px(ctx, cx + gap + stride, 25, 3, 3, pantsShade)
    px(ctx, cx - 5 - stride, 27, 4, 2, shoe)
    px(ctx, cx + gap + stride, 27, 4, 2, shoe)
  }

  if (loadout.pants === 'overalls') {
    px(ctx, cx - 4, 14, 8, 9, pants)
    px(ctx, cx - 3, 12, 2, 3, pants)
    px(ctx, cx + 1, 12, 2, 3, pants)
  }

  if (loadout.shirt === 'tank') {
    px(ctx, cx - 3, 14, 6, 8, shirt)
  } else if (loadout.shirt === 'hoodie') {
    px(ctx, cx - 5, 13, 10, 10, shirt)
    px(ctx, cx - 4, 12, 8, 3, shirtShade)
  } else {
    px(ctx, cx - 4, 14, 8, 9, shirt)
    px(ctx, cx - 4, 20, 8, 3, shirtShade)
  }

  if (loadout.hands === 'wave') {
    px(ctx, cx - 7, 15, 3, 6, skin)
    px(ctx, cx + 5, 8, 3, 7, skin)
  } else if (loadout.hands === 'akimbo') {
    px(ctx, cx - 7, 16, 3, 5, skin)
    px(ctx, cx + 4, 16, 3, 5, skin)
  } else if (loadout.hands === 'out') {
    px(ctx, cx - 9, 17, 5, 3, skin)
    px(ctx, cx + 4, 17, 5, 3, skin)
  } else {
    px(ctx, cx - 7, 15, 3, 6, skin)
    px(ctx, cx + 4, 15, 3, 6, skin)
  }

  if (loadout.accessory === 'satchel') {
    px(ctx, cx + 5, 18, 4, 5, bag)
  } else if (loadout.accessory === 'backpack') {
    px(ctx, cx - 3, 15, 6, 6, bag)
  } else if (loadout.accessory === 'scarf') {
    px(ctx, cx - 4, 13, 8, 2, bag)
    px(ctx, cx + 3, 14, 2, 5, bag)
  }

  pixelCircle(ctx, cx, 8, 7, skin)
  px(ctx, cx - 3, 11, 6, 2, skinShade)
  px(ctx, cx - 5, 9, 2, 1, '#ff9eaa')
  px(ctx, cx + 3, 9, 2, 1, '#ff9eaa')

  if (loadout.eyes === 'happy') {
    px(ctx, cx - 3, 7, 2, 1, '#000000')
    px(ctx, cx + 1, 7, 2, 1, '#000000')
  } else if (loadout.eyes === 'wink') {
    px(ctx, cx - 3, 6, 1, 2, '#000000')
    px(ctx, cx + 1, 7, 2, 1, '#000000')
  } else if (loadout.eyes === 'wide' || loadout.eyes === 'oval') {
    px(ctx, cx - 3, 6, 2, 3, '#000000')
    px(ctx, cx + 1, 6, 2, 3, '#000000')
  } else if (loadout.eyes === 'tired') {
    px(ctx, cx - 3, 7, 1, 1, '#000000')
    px(ctx, cx + 2, 7, 1, 1, '#000000')
  } else {
    px(ctx, cx - 3, 6, 1, 2, '#000000')
    px(ctx, cx + 2, 6, 1, 2, '#000000')
  }
  px(ctx, cx - 1, 10, 3, 1, '#000000')

  drawPixelHair(ctx, cx, 8, loadout.hair, hair, shirt)

  outlineCanvas(canvas)
  return upscalePixel(canvas, size)
}

function drawPixelHair(
  ctx: CanvasRenderingContext2D,
  cx: number,
  hy: number,
  style: string,
  color: string,
  accent: string,
): void {
  if (style === 'none') return
  if (style === 'curly') {
    for (const [x, y, r] of [
      [0, -5, 5],
      [-5, -3, 4],
      [5, -3, 4],
      [-6, 1, 3],
      [6, 1, 3],
      [0, -8, 3],
      [-4, 3, 3],
      [4, 3, 3],
    ] as const) {
      pixelCircle(ctx, cx + x, hy + y, r, color)
    }
    return
  }
  if (style === 'cap') {
    pixelCircle(ctx, cx, hy - 8, 3, color)
    px(ctx, cx - 6, hy - 5, 12, 4, accent)
    px(ctx, cx + 1, hy - 3, 7, 2, accent)
    return
  }
  if (style === 'backwards') {
    px(ctx, cx - 6, hy - 6, 12, 4, '#2a262e')
    px(ctx, cx - 8, hy - 4, 5, 2, '#2a262e')
    px(ctx, cx - 1, hy - 5, 3, 1, '#9aa3ad')
    return
  }
  if (style === 'explorer') {
    px(ctx, cx - 7, hy - 6, 14, 4, '#c4a574')
    px(ctx, cx - 8, hy - 4, 16, 2, '#c4a574')
    px(ctx, cx - 5, hy - 5, 10, 1, '#6b4a2a')
    return
  }
  if (style === 'spiky') {
    px(ctx, cx - 4, hy - 8, 3, 6, color)
    px(ctx, cx - 1, hy - 9, 3, 7, color)
    px(ctx, cx + 3, hy - 7, 3, 5, color)
    return
  }
  if (style === 'bun') {
    px(ctx, cx - 6, hy - 5, 12, 5, color)
    pixelCircle(ctx, cx, hy - 8, 3, color)
    return
  }
  px(ctx, cx - 6, hy - 5, 12, 5, color)
}

/** Tiny part preview icon for picker UI. */
export function composePartPreview(
  slot: PartSlot,
  optionId: string,
  loadout: CharacterLoadout,
  size = 72,
): HTMLCanvasElement {
  const partial: CharacterLoadout = {
    ...DEFAULT_LOADOUT,
    ...loadout,
    [slot]: optionId,
  }
  return composeCharacter(partial, size)
}
