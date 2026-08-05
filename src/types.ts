export type AnimationType =
  | 'idle'
  | 'walk'
  | 'run'
  | 'jump'
  | 'attack'
  | 'hurt'
  | 'celebrate'

/** Output sizes for character frames and location tiles. */
export type FrameSize = 64 | 128 | 512
export type TileSize = 64 | 128 | 512

export type ArtStyle = 'clean-vector'

export type LocationCategory =
  | 'ground'
  | 'nature'
  | 'structure'
  | 'props'
  | 'water'
  | 'decor'

export type LocationTheme =
  | 'overworld'
  | 'forest'
  | 'coast'
  | 'mountain'
  | 'village'
  | 'dungeon'

export interface RGB {
  r: number
  g: number
  b: number
}

export interface StyleReference {
  id: string
  name: string
  dataUrl: string
  palette: RGB[]
}

export interface CharacterAsset {
  id: string
  name: string
  dataUrl: string
  image: HTMLImageElement
}

export interface AnimationFrame {
  canvas: HTMLCanvasElement
  index: number
}

export interface GeneratedAnimation {
  type: AnimationType
  frames: AnimationFrame[]
  frameSize: FrameSize
  sheetCanvas: HTMLCanvasElement
  fps: number
}

export interface LocationAsset {
  id: string
  name: string
  category: LocationCategory
  theme: LocationTheme
  canvas: HTMLCanvasElement
  tileSize: number
  modular: boolean
}

export interface SpriteSheetMeta {
  frameWidth: number
  frameHeight: number
  frameCount: number
  columns: number
  rows: number
  animations: Record<
    string,
    { start: number; end: number; fps: number }
  >
}

export const FRAME_SIZES: FrameSize[] = [64, 128, 512]
export const TILE_SIZES: TileSize[] = [64, 128, 512]

export const ANIMATION_LABELS: Record<AnimationType, string> = {
  idle: 'Idle',
  walk: 'Walk',
  run: 'Run',
  jump: 'Jump',
  attack: 'Attack',
  hurt: 'Hurt',
  celebrate: 'Celebrate',
}

export const LOCATION_THEMES: { id: LocationTheme; label: string; blurb: string }[] = [
  { id: 'overworld', label: 'Overworld', blurb: 'Sunny plains & soft hills' },
  { id: 'forest', label: 'Forest', blurb: 'Dense trees & mossy ground' },
  { id: 'coast', label: 'Coast', blurb: 'Sand, docks & blue water' },
  { id: 'mountain', label: 'Mountain', blurb: 'Rocky paths & cliffs' },
  { id: 'village', label: 'Village', blurb: 'Homes, roofs & cobble' },
  { id: 'dungeon', label: 'Dungeon', blurb: 'Stone floors & torches' },
]
