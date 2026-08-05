# SpriteNest

Nintendo-style sprite sheet & modular location asset studio.

## Features

- **Style references** — upload Nintendo-inspired art; the app extracts a shared palette
- **Character animations** — upload characters and generate idle, walk, run, jump, attack, hurt, and celebrate sprite sheets
- **Modular locations** — generate ground, water, nature, structure, and prop tiles for overworld, forest, coast, mountain, village, and dungeon themes
- **Export** — PNG sprite sheets / tilesets plus JSON metadata for game engines

## Quick start

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## Notes

Art is processed client-side with pixelation, palette quantization, and procedural animation / tile drawing. The look is **Nintendo-inspired** (classic console pixel art), not affiliated with Nintendo.
