# SpriteNest

Clean vector Nintendo-style sprite sheet & modular location asset studio.

## Features

- **Style references** — upload clean chibi / vector character sheets; palette (including blush tones) is extracted
- **Character animations** — generate idle, walk, run, jump, attack, hurt, celebrate in a flat Nintendo-soft vector look
- **Output sizes** — **64×64**, **128×128**, and **512×512** for character frames and location tiles
- **Modular locations** — ground, water, nature, structures, and props for overworld, forest, coast, mountain, village, dungeon
- **Export** — PNG sprite sheets / tilesets + JSON metadata

## Quick start

```bash
npm install
npm run dev
```

## Notes

Processing is client-side. Characters keep soft anti-aliased edges and flat colors (no harsh pixel crunch). Location tiles are drawn as clean rounded vector shapes that match the Nintendo-inspired character aesthetic. Not affiliated with Nintendo.
