# BrandVibe

Marketing intelligence Chrome extension (and web app) that turns any website name or URL into a brand brief:

- **Personality** — scored traits and archetype from on-page language
- **Voice & tone** — register, mood, focus, and pace dimensions plus keywords
- **Color palette** — theme-color, CSS tokens, and inline styles
- **Social trends** — linked profiles plus inferred content / platform strategy

## Quick start

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`).

Enter a site like `stripe.com` or a brand name like `nike`.

## Load as a Chrome extension

Extension mode bypasses CORS so any public site can be analyzed.

```bash
npm run build
```

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select the `dist/` folder

Click the BrandVibe icon to open the popup.

## How it works

1. Resolves a brand name or URL (`nike` → `https://www.nike.com`)
2. Fetches the homepage (extension background worker, or CORS proxy in web mode)
3. Parses HTML for title, meta, headings, body copy, CSS colors, and social links
4. Runs heuristic personality / voice / trend models over those signals

Also analyze any website for personality, voice, palette, and social trends — then open **Content studio** to pick a voice, describe the post you want, generate engagement-focused drafts, and export **platform-sized PNG post images** (Instagram 1080×1080, LinkedIn 1200×627, TikTok/Shorts 1080×1920, X 1200×675).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production build into `dist/` |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | TypeScript only |
