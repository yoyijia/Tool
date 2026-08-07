import type {
  BrandReport,
  ContentPlatform,
  GeneratedPost,
  MascotId,
  MascotPose,
  MascotPosition,
} from "../types";
import { drawMascot } from "./mascots";

export const DEFAULT_MASCOT_POS: MascotPosition = { nx: 0.78, ny: 0.42 };

export interface PostImageSpec {
  width: number;
  height: number;
  label: string;
  ratio: string;
}

export const PLATFORM_IMAGE_SPECS: Record<ContentPlatform, PostImageSpec> = {
  instagram: { width: 1080, height: 1080, label: "Instagram feed", ratio: "1:1 · 1080×1080" },
  linkedin: { width: 1200, height: 627, label: "LinkedIn share", ratio: "1.91:1 · 1200×627" },
  tiktok: { width: 1080, height: 1920, label: "TikTok / Reels", ratio: "9:16 · 1080×1920" },
  x: { width: 1200, height: 675, label: "X / Twitter", ratio: "16:9 · 1200×675" },
  youtube: { width: 1080, height: 1920, label: "YouTube Shorts", ratio: "9:16 · 1080×1920" },
};

interface EditorialPalette {
  bg: string;
  ink: string;
  accent: string;
  secondary: string;
  primary: string;
  muted: string;
  paper: string;
  /** Up to 5 swatches for palette strips */
  swatches: string[];
}

type LayoutId = "cover" | "split" | "bands";

const LAYOUTS: LayoutId[] = ["cover", "split", "bands"];

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace("#", "").trim();
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.slice(0, 6);
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;
  return (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
}

function withAlpha(hex: string, a: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`;
}

function contrastInk(bg: string): string {
  return luminance(bg) < 0.48 ? "#F7F4EF" : "#12110F";
}

function resolvePalette(report: BrandReport): EditorialPalette {
  const byRole = (role: string) => report.palette.find((c) => c.role === role)?.hex;
  const sorted = [...report.palette].sort((a, b) => luminance(a.hex) - luminance(b.hex));

  let bg = byRole("background") || sorted[0]?.hex || "#12110F";
  const primary = byRole("primary") || sorted[Math.floor(sorted.length / 2)]?.hex || "#2A4A3C";
  const secondary = byRole("secondary") || sorted[1]?.hex || primary;
  let accent =
    byRole("accent") ||
    report.palette.find((c) => luminance(c.hex) > 0.25 && luminance(c.hex) < 0.8)?.hex ||
    "#E8C547";
  let ink = byRole("text") || contrastInk(bg);

  if (Math.abs(luminance(bg) - luminance(ink)) < 0.32) ink = contrastInk(bg);
  if (accent.toLowerCase() === bg.toLowerCase()) {
    accent = luminance(bg) < 0.5 ? "#E8C547" : "#1A3A2E";
  }

  const paper = luminance(bg) < 0.4 ? "#F4F0E8" : bg;
  const muted = withAlpha(ink, 0.58);

  const swatches = [
    ...new Set(
      [
        accent,
        primary,
        secondary,
        byRole("neutral"),
        ...report.palette.map((c) => c.hex),
      ].filter(Boolean) as string[],
    ),
  ].slice(0, 5);

  return { bg, ink, accent, secondary, primary, muted, paper, swatches };
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function fitLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const lines = wrapText(ctx, text, maxWidth);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  const last = kept[maxLines - 1] ?? "";
  kept[maxLines - 1] =
    last.length > 3 ? `${last.replace(/[.,!?:;]*$/, "").slice(0, -1)}…` : `${last}…`;
  return kept;
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawPaletteStrip(
  ctx: CanvasRenderingContext2D,
  colors: string[],
  x: number,
  y: number,
  totalW: number,
  h: number,
) {
  if (!colors.length) return;
  const cell = totalW / colors.length;
  colors.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(x + i * cell, y, cell + 1, h);
  });
}

function drawHairline(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

async function ensureFonts(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  try {
    await document.fonts.load("800 72px Syne");
    await document.fonts.load("600 28px Figtree");
    await document.fonts.load("400 22px Figtree");
    await document.fonts.ready;
  } catch {
    /* system fonts */
  }
}

export interface RenderedPostImage {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  filename: string;
  spec: PostImageSpec;
  layout?: LayoutId;
}

interface DrawCtx {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  pad: number;
  isVertical: boolean;
  isWide: boolean;
  report: BrandReport;
  post: GeneratedPost;
  palette: EditorialPalette;
  mascotId: MascotId;
  mascotPos: MascotPosition;
  mascotPose: MascotPose;
  customMascot?: HTMLImageElement | null;
  variant: number;
  spec: PostImageSpec;
}

function supportCopy(post: GeneratedPost): string {
  return (
    post.cta ||
    post.body
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.length > 18 && !l.startsWith("[") && !l.startsWith("→") && !l.startsWith("Slide")) ||
    ""
  );
}

function maybeMascot(d: DrawCtx, x: number, y: number, size: number) {
  if (d.mascotId === "none") return;
  drawMascot(d.ctx, d.mascotId, {
    x,
    y,
    size,
    accent: d.palette.accent,
    ink: d.palette.ink,
    secondary: d.palette.secondary,
    pose: d.mascotPose,
    customImage: d.customMascot,
  });
}

/** Magazine cover — full accent field, oversized type, palette rail. */
function layoutCover(d: DrawCtx) {
  const { ctx, w, h, pad, report, post, palette, isVertical, isWide } = d;

  // Dominant editorial color field from brand accent
  ctx.fillStyle = palette.accent;
  ctx.fillRect(0, 0, w, h);

  // Secondary geometric plane
  ctx.fillStyle = palette.primary;
  if (isWide) {
    ctx.fillRect(0, 0, w * 0.38, h);
  } else if (isVertical) {
    ctx.fillRect(0, 0, w, h * 0.22);
    ctx.fillStyle = palette.secondary;
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
  } else {
    ctx.beginPath();
    ctx.moveTo(w * 0.55, 0);
    ctx.lineTo(w, 0);
    ctx.lineTo(w, h);
    ctx.lineTo(w * 0.35, h);
    ctx.closePath();
    ctx.fill();
  }

  // Masthead
  const mastInk = contrastInk(isWide ? palette.primary : isVertical ? palette.primary : palette.accent);
  const brandSize = Math.round(Math.min(w, h) * 0.028);
  ctx.fillStyle = mastInk;
  ctx.font = `700 ${brandSize}px Figtree, system-ui, sans-serif`;
  ctx.fillText(report.name.toUpperCase(), pad, pad + brandSize);

  ctx.font = `600 ${Math.round(brandSize * 0.85)}px Figtree, system-ui, sans-serif`;
  const issue = `VOL. ${String(d.variant + 1).padStart(2, "0")}  ·  EDITORIAL`;
  ctx.fillText(issue, pad, pad + brandSize * 2.1);

  // Giant issue number watermark
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = contrastInk(palette.accent);
  ctx.font = `800 ${Math.round(Math.min(w, h) * 0.42)}px Syne, system-ui, sans-serif`;
  ctx.fillText(String(d.variant + 1).padStart(2, "0"), pad * 0.4, h * (isWide ? 0.85 : 0.55));
  ctx.restore();

  // Headline block on contrasting panel
  const panelX = isWide ? w * 0.42 : pad;
  const panelW = isWide ? w * 0.52 : w - pad * 2;
  const hookFont = isVertical
    ? Math.round(w * 0.085)
    : isWide
      ? Math.round(h * 0.12)
      : Math.round(w * 0.078);
  const hookInk = isWide
    ? contrastInk(palette.accent)
    : isVertical
      ? contrastInk(palette.accent)
      : contrastInk(palette.primary);
  ctx.fillStyle = hookInk;
  ctx.font = `800 ${hookFont}px Syne, system-ui, sans-serif`;
  const maxLines = isWide ? 3 : isVertical ? 6 : 5;
  const hookLines = fitLines(ctx, post.hook, panelW, maxLines);
  const lineH = hookFont * 1.08;
  const startY = isWide ? h * 0.28 : isVertical ? h * 0.3 : h * 0.32;
  hookLines.forEach((line, i) => {
    ctx.fillText(line, panelX, startY + (i + 1) * lineH);
  });

  // Deck / supporting copy
  const deck = supportCopy(post);
  if (deck) {
    ctx.fillStyle = withAlpha(hookInk, 0.75);
    const deckFont = Math.round(Math.min(w, h) * 0.028);
    ctx.font = `500 ${deckFont}px Figtree, system-ui, sans-serif`;
    const deckLines = fitLines(ctx, deck, panelW * 0.92, isVertical ? 3 : 2);
    const deckY = startY + hookLines.length * lineH + deckFont * 1.6;
    deckLines.forEach((line, i) => {
      ctx.fillText(line, panelX, deckY + i * deckFont * 1.35);
    });
  }

  // Palette rail
  const railH = Math.round(Math.min(w, h) * 0.035);
  drawPaletteStrip(ctx, palette.swatches, pad, h - pad - railH, w - pad * 2, railH);

  // Hairline above rail
  drawHairline(ctx, pad, h - pad - railH - 12, w - pad, h - pad - railH - 12, withAlpha(hookInk, 0.35));

  // Mascot
  if (d.mascotId !== "none") {
    const size = Math.min(w, h) * (isWide ? 0.28 : 0.24);
    maybeMascot(
      d,
      Math.min(w - size * 0.4, Math.max(size * 0.4, d.mascotPos.nx * w)),
      Math.min(h - size * 0.55 - railH, Math.max(size * 0.4, d.mascotPos.ny * h)),
      size,
    );
  }

  if (post.referenceId) {
    ctx.fillStyle = palette.bg;
    const bf = Math.round(brandSize * 0.9);
    ctx.font = `800 ${bf}px Figtree, system-ui, sans-serif`;
    const label = `REF ${post.referenceId}`;
    const bw = ctx.measureText(label).width + bf;
    ctx.fillRect(w - pad - bw, pad, bw, bf * 1.6);
    ctx.fillStyle = contrastInk(palette.bg);
    ctx.fillText(label, w - pad - bw + bf * 0.4, pad + bf * 1.15);
  }
}

/** Split editorial — two-tone page, pull-quote rules, body column. */
function layoutSplit(d: DrawCtx) {
  const { ctx, w, h, pad, report, post, palette, isVertical, isWide } = d;

  ctx.fillStyle = palette.paper;
  ctx.fillRect(0, 0, w, h);

  // Color block
  const blockW = isWide ? w * 0.42 : isVertical ? w : w * 0.4;
  const blockH = isVertical ? h * 0.38 : h;
  ctx.fillStyle = palette.primary;
  ctx.fillRect(0, 0, blockW, blockH);

  // Accent bar
  ctx.fillStyle = palette.accent;
  if (isVertical) {
    ctx.fillRect(0, blockH, w, Math.round(h * 0.018));
  } else {
    ctx.fillRect(blockW, 0, Math.round(w * 0.012), h);
  }

  // Left/top kicker on color block
  const kickerInk = contrastInk(palette.primary);
  ctx.fillStyle = kickerInk;
  const kicker = Math.round(Math.min(w, h) * 0.024);
  ctx.font = `700 ${kicker}px Figtree, system-ui, sans-serif`;
  ctx.fillText(report.name.toUpperCase(), pad * 0.85, pad + kicker);
  ctx.font = `500 ${Math.round(kicker * 0.9)}px Figtree, system-ui, sans-serif`;
  ctx.fillText(d.spec.label.toUpperCase(), pad * 0.85, pad + kicker * 2.2);

  // Oversized quote mark
  ctx.fillStyle = withAlpha(palette.accent, 0.9);
  ctx.font = `800 ${Math.round(Math.min(w, h) * 0.2)}px Syne, system-ui, sans-serif`;
  const qx = isVertical ? pad : pad * 0.7;
  const qy = isVertical ? blockH * 0.55 : h * 0.42;
  ctx.fillText("“", qx, qy);

  // Short hook fragment on color block
  ctx.fillStyle = kickerInk;
  const sideFont = isVertical ? Math.round(w * 0.055) : Math.round(Math.min(w, h) * 0.045);
  ctx.font = `800 ${sideFont}px Syne, system-ui, sans-serif`;
  const sideW = blockW - pad * 1.5;
  const sideLines = fitLines(ctx, post.hook, sideW, isVertical ? 4 : 5);
  const sideStart = isVertical ? blockH * 0.42 : h * 0.35;
  sideLines.forEach((line, i) => {
    ctx.fillText(line, pad * 0.85, sideStart + (i + 1) * sideFont * 1.15);
  });

  // Right / lower editorial column
  const colX = isVertical ? pad : blockW + pad * 1.1;
  const colW = isVertical ? w - pad * 2 : w - blockW - pad * 2.2;
  const colY = isVertical ? blockH + pad * 1.4 : pad * 1.6;

  ctx.fillStyle = contrastInk(palette.paper);
  const titleFont = isVertical ? Math.round(w * 0.06) : Math.round(Math.min(w, h) * 0.055);
  ctx.font = `800 ${titleFont}px Syne, system-ui, sans-serif`;
  const titleLines = fitLines(ctx, post.hook, colW, isWide ? 3 : 4);
  titleLines.forEach((line, i) => {
    ctx.fillText(line, colX, colY + (i + 1) * titleFont * 1.1);
  });

  drawHairline(
    ctx,
    colX,
    colY + titleLines.length * titleFont * 1.1 + 16,
    colX + Math.min(colW, w * 0.25),
    colY + titleLines.length * titleFont * 1.1 + 16,
    palette.accent,
  );

  const deck = supportCopy(post);
  if (deck) {
    const bodyFont = Math.round(Math.min(w, h) * 0.026);
    ctx.fillStyle = withAlpha(contrastInk(palette.paper), 0.72);
    ctx.font = `400 ${bodyFont}px Figtree, system-ui, sans-serif`;
    const bodyY = colY + titleLines.length * titleFont * 1.1 + 40;
    fitLines(ctx, deck, colW, isVertical ? 4 : 3).forEach((line, i) => {
      ctx.fillText(line, colX, bodyY + i * bodyFont * 1.4);
    });
  }

  // CTA as editorial endnote
  const cta = post.hashtags[0] || report.domain;
  ctx.fillStyle = palette.accent;
  const ctaFont = Math.round(Math.min(w, h) * 0.022);
  ctx.font = `700 ${ctaFont}px Figtree, system-ui, sans-serif`;
  ctx.fillText(`— ${cta.toUpperCase()}`, colX, h - pad * 1.2);

  // Mini palette chips
  const chip = Math.round(Math.min(w, h) * 0.028);
  palette.swatches.slice(0, 4).forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(colX + i * (chip + 10) + chip / 2, h - pad * 2.2, chip / 2, 0, Math.PI * 2);
    ctx.fill();
  });

  if (d.mascotId !== "none") {
    const size = Math.min(w, h) * 0.22;
    maybeMascot(
      d,
      isVertical ? w - pad - size * 0.45 : w - pad - size * 0.4,
      isVertical ? blockH - size * 0.35 : h - pad - size * 0.45,
      size,
    );
  }
}

/** Horizontal brand bands — color story from palette, type on stacked fields. */
function layoutBands(d: DrawCtx) {
  const { ctx, w, h, pad, report, post, palette, isVertical, isWide } = d;

  const colors = [
    palette.bg,
    palette.primary,
    palette.accent,
    palette.secondary,
    palette.swatches[3] || palette.primary,
  ];

  if (isWide) {
    // Vertical bands for landscape
    const band = w / colors.length;
    colors.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(i * band, 0, band + 1, h);
    });
  } else {
    const weights = isVertical ? [0.12, 0.38, 0.28, 0.14, 0.08] : [0.14, 0.36, 0.3, 0.12, 0.08];
    let y = 0;
    colors.forEach((c, i) => {
      const bh = h * (weights[i] ?? 0.1);
      ctx.fillStyle = c;
      ctx.fillRect(0, y, w, bh + 1);
      y += bh;
    });
  }

  // Masthead on top band
  const topInk = contrastInk(colors[0]!);
  const brandSize = Math.round(Math.min(w, h) * 0.026);
  ctx.fillStyle = topInk;
  ctx.font = `700 ${brandSize}px Figtree, system-ui, sans-serif`;
  ctx.fillText(report.name.toUpperCase(), pad, pad * 0.85 + brandSize);
  ctx.font = `600 ${Math.round(brandSize * 0.8)}px Figtree, system-ui, sans-serif`;
  ctx.fillText("BRAND PALETTE  ·  CAMPAIGN FRAME", pad, pad * 0.85 + brandSize * 2);

  // Main type sits on primary band
  const typeBand = colors[1]!;
  const typeInk = contrastInk(typeBand);
  const hookFont = isVertical
    ? Math.round(w * 0.08)
    : isWide
      ? Math.round(h * 0.13)
      : Math.round(w * 0.07);
  ctx.fillStyle = typeInk;
  ctx.font = `800 ${hookFont}px Syne, system-ui, sans-serif`;
  const textX = isWide ? pad + w * 0.22 : pad;
  const textW = isWide ? w * 0.55 : w - pad * 2;
  const hookLines = fitLines(ctx, post.hook, textW, isWide ? 3 : isVertical ? 5 : 4);
  const startY = isWide ? h * 0.32 : isVertical ? h * 0.22 : h * 0.28;
  hookLines.forEach((line, i) => {
    ctx.fillText(line, textX, startY + (i + 1) * hookFont * 1.1);
  });

  // Accent band holds deck
  const deck = supportCopy(post);
  if (deck) {
    const deckInk = contrastInk(colors[2]!);
    const deckFont = Math.round(Math.min(w, h) * 0.028);
    ctx.fillStyle = withAlpha(deckInk, 0.9);
    ctx.font = `500 ${deckFont}px Figtree, system-ui, sans-serif`;
    const deckY = isWide ? h * 0.62 : isVertical ? h * 0.58 : h * 0.62;
    fitLines(ctx, deck, textW, 2).forEach((line, i) => {
      ctx.fillText(line, textX, deckY + i * deckFont * 1.35);
    });
  }

  // Hex labels for editorial color story
  ctx.font = `600 ${Math.round(Math.min(w, h) * 0.018)}px Figtree, system-ui, sans-serif`;
  if (!isWide) {
    let y = 0;
    const weights = isVertical ? [0.12, 0.38, 0.28, 0.14, 0.08] : [0.14, 0.36, 0.3, 0.12, 0.08];
    colors.slice(0, 4).forEach((c, i) => {
      const bh = h * (weights[i] ?? 0.1);
      ctx.fillStyle = withAlpha(contrastInk(c), 0.55);
      ctx.fillText(c.toUpperCase(), w - pad - ctx.measureText(c.toUpperCase()).width, y + bh - 14);
      y += bh;
    });
  }

  // Bottom CTA pill on last band
  const pillBg = palette.accent;
  const pillInk = contrastInk(pillBg);
  const pillText = (post.hashtags[0]?.replace(/^#/, "") || "FOLLOW").toUpperCase();
  const pillFont = Math.round(Math.min(w, h) * 0.024);
  ctx.font = `700 ${pillFont}px Figtree, system-ui, sans-serif`;
  const pw = ctx.measureText(pillText).width + pillFont * 2.2;
  const ph = pillFont * 2.2;
  const px = pad;
  const py = h - pad - ph;
  ctx.fillStyle = pillBg;
  drawRoundRect(ctx, px, py, pw, ph, 4);
  ctx.fill();
  ctx.fillStyle = pillInk;
  ctx.fillText(pillText, px + pillFont * 1.1, py + ph * 0.68);

  if (d.mascotId !== "none") {
    const size = Math.min(w, h) * (isWide ? 0.3 : 0.26);
    maybeMascot(
      d,
      Math.min(w - size * 0.35, Math.max(size * 0.35, d.mascotPos.nx * w)),
      Math.min(h - size * 0.4, Math.max(size * 0.35, d.mascotPos.ny * h)),
      size,
    );
  }
}

/** Render a platform-sized editorial post from draft + brand palette. */
export async function renderPostImage(
  report: BrandReport,
  post: GeneratedPost,
  options?: {
    variantIndex?: number;
    mascotId?: MascotId;
    customMascot?: HTMLImageElement | null;
    mascotPos?: MascotPosition;
    mascotPose?: MascotPose;
  },
): Promise<RenderedPostImage> {
  await ensureFonts();

  const spec = PLATFORM_IMAGE_SPECS[post.platform];
  const { width: w, height: h } = spec;
  const palette = resolvePalette(report);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported in this browser.");

  const variant = options?.variantIndex ?? 0;
  const layout = LAYOUTS[variant % LAYOUTS.length]!;
  const draw: DrawCtx = {
    ctx,
    w,
    h,
    pad: Math.round(Math.min(w, h) * 0.07),
    isVertical: h / w > 1.3,
    isWide: w / h > 1.4,
    report,
    post,
    palette,
    mascotId: (options?.mascotId ?? post.mascotId ?? "none") as MascotId,
    mascotPos: options?.mascotPos ?? DEFAULT_MASCOT_POS,
    mascotPose: options?.mascotPose ?? "idle",
    customMascot: options?.customMascot,
    variant,
    spec,
  };

  if (layout === "cover") layoutCover(draw);
  else if (layout === "split") layoutSplit(draw);
  else layoutBands(draw);

  // Tiny layout tag (for designers)
  ctx.fillStyle = withAlpha(contrastInk(palette.bg), 0.35);
  ctx.font = `500 ${Math.round(Math.min(w, h) * 0.016)}px Figtree, system-ui, sans-serif`;
  const tag = `${layout.toUpperCase()} · ${spec.ratio}`;
  ctx.fillText(tag, w - draw.pad - ctx.measureText(tag).width, h - draw.pad * 0.35);

  const dataUrl = canvas.toDataURL("image/png");
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to encode PNG"))),
      "image/png",
    );
  });

  const safeName = report.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const refPart = post.referenceId ? `-${post.referenceId.toLowerCase()}` : "";
  const filename = `${safeName}-${post.platform}-${layout}-${w}x${h}${refPart}-v${variant + 1}.png`;

  return { dataUrl, blob, width: w, height: h, filename, spec, layout };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
