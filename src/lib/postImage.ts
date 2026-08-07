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
  /** Short ratio label shown in UI */
  ratio: string;
}

/** Official-ish export sizes for feed/story creative. */
export const PLATFORM_IMAGE_SPECS: Record<ContentPlatform, PostImageSpec> = {
  instagram: { width: 1080, height: 1080, label: "Instagram feed", ratio: "1:1 · 1080×1080" },
  linkedin: { width: 1200, height: 627, label: "LinkedIn share", ratio: "1.91:1 · 1200×627" },
  tiktok: { width: 1080, height: 1920, label: "TikTok / Reels", ratio: "9:16 · 1080×1920" },
  x: { width: 1200, height: 675, label: "X / Twitter", ratio: "16:9 · 1200×675" },
  youtube: { width: 1080, height: 1920, label: "YouTube Shorts", ratio: "9:16 · 1080×1920" },
};

interface PaletteResolved {
  bg: string;
  ink: string;
  accent: string;
  muted: string;
  secondary: string;
}

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

function resolvePalette(report: BrandReport): PaletteResolved {
  const byRole = (role: string) =>
    report.palette.find((c) => c.role === role)?.hex;

  let bg =
    byRole("background") ||
    report.palette.sort((a, b) => luminance(a.hex) - luminance(b.hex))[0]?.hex ||
    "#0C1210";
  let accent =
    byRole("accent") ||
    report.palette.find((c) => luminance(c.hex) > 0.2 && luminance(c.hex) < 0.85)?.hex ||
    "#C8F542";
  let ink =
    byRole("text") ||
    (luminance(bg) < 0.45 ? "#F4F7F5" : "#0C1210");
  const secondary =
    byRole("secondary") ||
    byRole("primary") ||
    report.palette[1]?.hex ||
    accent;

  // Ensure readable contrast between bg and ink
  if (Math.abs(luminance(bg) - luminance(ink)) < 0.35) {
    ink = luminance(bg) < 0.5 ? "#F4F7F5" : "#0C1210";
  }

  // Avoid accent == bg
  if (accent.toLowerCase() === bg.toLowerCase()) {
    accent = luminance(bg) < 0.5 ? "#C8F542" : "#1A1A2E";
  }

  const muted =
    luminance(ink) > 0.5
      ? "rgba(244,247,245,0.62)"
      : "rgba(12,18,16,0.55)";

  return { bg, ink, accent, muted, secondary };
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

function drawNoise(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const image = ctx.createImageData(w, h);
  for (let i = 0; i < image.data.length; i += 4) {
    const n = Math.random() * 255;
    image.data[i] = n;
    image.data[i + 1] = n;
    image.data[i + 2] = n;
    image.data[i + 3] = 18;
  }
  ctx.putImageData(image, 0, 0);
}

async function ensureFonts(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  try {
    await document.fonts.load("700 64px Syne");
    await document.fonts.load("600 28px Figtree");
    await document.fonts.ready;
  } catch {
    /* system fonts fallback */
  }
}

export interface RenderedPostImage {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  filename: string;
  spec: PostImageSpec;
}

/** Render a platform-sized social post graphic from a draft + brand palette. */
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

  const pad = Math.round(Math.min(w, h) * 0.08);
  const isVertical = h / w > 1.3;
  const isWide = w / h > 1.4;
  const mascotId = (options?.mascotId ?? post.mascotId ?? "none") as MascotId;
  const mascotPos = options?.mascotPos ?? DEFAULT_MASCOT_POS;

  // Background
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, w, h);

  // Gradient wash
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, palette.accent + "33");
  grad.addColorStop(0.45, "transparent");
  grad.addColorStop(1, palette.secondary + "40");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Soft accent orb
  const orb = ctx.createRadialGradient(
    w * 0.85,
    h * 0.15,
    0,
    w * 0.85,
    h * 0.15,
    Math.min(w, h) * 0.45,
  );
  orb.addColorStop(0, palette.accent + "55");
  orb.addColorStop(1, "transparent");
  ctx.fillStyle = orb;
  ctx.fillRect(0, 0, w, h);

  // Light noise overlay (scaled for perf on large canvases)
  ctx.save();
  const noiseScale = 4;
  const nw = Math.ceil(w / noiseScale);
  const nh = Math.ceil(h / noiseScale);
  const noiseCanvas = document.createElement("canvas");
  noiseCanvas.width = nw;
  noiseCanvas.height = nh;
  const nctx = noiseCanvas.getContext("2d");
  if (nctx) {
    drawNoise(nctx, nw, nh);
    ctx.globalAlpha = 0.35;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(noiseCanvas, 0, 0, w, h);
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  // Top brand row
  const brandSize = Math.round(Math.min(w, h) * 0.035);
  ctx.fillStyle = palette.accent;
  ctx.font = `700 ${brandSize}px Syne, system-ui, sans-serif`;
  ctx.fillText(report.name.toUpperCase(), pad, pad + brandSize);

  ctx.fillStyle = palette.muted;
  ctx.font = `500 ${Math.round(brandSize * 0.75)}px Figtree, system-ui, sans-serif`;
  const platformTag = spec.label.toUpperCase();
  const tagWidth = ctx.measureText(platformTag).width;
  ctx.fillText(platformTag, w - pad - tagWidth, pad + brandSize);

  // Accent rule under brand
  ctx.fillStyle = palette.accent;
  ctx.fillRect(pad, pad + brandSize + Math.round(brandSize * 0.45), Math.round(w * 0.18), 4);

  // Reference badge (easy citation) — high visibility
  if (post.referenceId) {
    const badge = `REF ${post.referenceId}`;
    const badgeFont = Math.round(brandSize * 0.95);
    ctx.font = `800 ${badgeFont}px Figtree, system-ui, sans-serif`;
    const bw = ctx.measureText(badge).width + brandSize * 1.1;
    const bh = brandSize * 1.55;
    const bx = pad;
    const by = pad + brandSize * 2.15;
    ctx.fillStyle = palette.accent;
    drawRoundRect(ctx, bx, by, bw, bh, bh / 2);
    ctx.fill();
    // outline for contrast on light accents
    ctx.strokeStyle = luminance(palette.bg) < 0.5 ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = luminance(palette.accent) > 0.55 ? "#0C1210" : "#F4F7F5";
    ctx.fillText(badge, bx + brandSize * 0.55, by + bh * 0.7);
  }

  // Main hook — leave room on the side where the mascot sits
  const mascotOnRight = mascotId === "none" ? true : mascotPos.nx >= 0.5;
  const mascotRoom = mascotId !== "none" ? Math.min(w, h) * 0.28 : 0;
  const hookMaxW = w - pad * 2 - mascotRoom;
  const hookX = mascotOnRight ? pad : pad + mascotRoom;
  const hookFont = isVertical
    ? Math.round(w * 0.09)
    : isWide
      ? Math.round(h * 0.14)
      : Math.round(w * 0.085);
  ctx.fillStyle = palette.ink;
  ctx.font = `800 ${hookFont}px Syne, system-ui, sans-serif`;
  const maxHookLines = isVertical ? 7 : isWide ? 3 : 5;
  const hookLines = fitLines(ctx, post.hook, hookMaxW, maxHookLines);
  const hookLineH = hookFont * 1.12;
  const hookBlockH = hookLines.length * hookLineH;
  const hookStartY = isWide
    ? h * 0.38 - hookBlockH / 2
    : pad + brandSize * (post.referenceId ? 4.2 : 3.2);

  hookLines.forEach((line, i) => {
    ctx.fillText(line, hookX, hookStartY + (i + 1) * hookLineH);
  });

  // Supporting line (CTA or short body snippet)
  const support = post.cta || post.body.split("\n").find((l) => l.trim().length > 12) || "";
  const supportFont = Math.round(Math.min(w, h) * 0.032);
  ctx.font = `500 ${supportFont}px Figtree, system-ui, sans-serif`;
  ctx.fillStyle = palette.muted;
  const supportLines = fitLines(ctx, support, hookMaxW, isVertical ? 4 : 2);
  const supportStart = hookStartY + hookBlockH + Math.round(supportFont * 1.8);
  supportLines.forEach((line, i) => {
    ctx.fillText(line, hookX, supportStart + (i + 1) * supportFont * 1.35);
  });

  // Mascot (draggable position from studio stage)
  if (mascotId !== "none") {
    const size = Math.min(w, h) * (isWide ? 0.34 : isVertical ? 0.28 : 0.3);
    const x = Math.min(w - size * 0.35, Math.max(size * 0.35, mascotPos.nx * w));
    const y = Math.min(h - size * 0.35, Math.max(size * 0.35, mascotPos.ny * h));
    drawMascot(ctx, mascotId, {
      x,
      y,
      size,
      accent: palette.accent,
      ink: palette.ink,
      secondary: palette.secondary,
      pose: options?.mascotPose ?? "idle",
      customImage: options?.customMascot,
    });
  }

  // Bottom CTA pill
  const pillText = "Engage → " + (post.hashtags[0]?.replace(/^#/, "") || report.domain);
  const pillFont = Math.round(Math.min(w, h) * 0.028);
  ctx.font = `700 ${pillFont}px Figtree, system-ui, sans-serif`;
  const pillPadX = pillFont * 1.4;
  const pillPadY = pillFont * 0.85;
  const pillW = ctx.measureText(pillText).width + pillPadX * 2;
  const pillH = pillFont + pillPadY * 2;
  const pillX = pad;
  const pillY = h - pad - pillH;

  ctx.fillStyle = palette.accent;
  drawRoundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.fillStyle = luminance(palette.accent) > 0.55 ? "#0C1210" : "#F4F7F5";
  ctx.fillText(pillText, pillX + pillPadX, pillY + pillH - pillPadY * 0.85);

  // Size watermark (subtle, for designers)
  ctx.fillStyle = palette.muted;
  ctx.font = `500 ${Math.round(Math.min(w, h) * 0.018)}px Figtree, system-ui, sans-serif`;
  const sizeLabel = `${spec.ratio}`;
  ctx.fillText(sizeLabel, w - pad - ctx.measureText(sizeLabel).width, h - pad * 0.55);

  // Variant stripe
  const variant = options?.variantIndex ?? 0;
  ctx.fillStyle = palette.accent;
  ctx.globalAlpha = 0.9;
  ctx.fillRect(0, 0, 8, h * ((variant + 1) / 4));
  ctx.globalAlpha = 1;

  const dataUrl = canvas.toDataURL("image/png");
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to encode PNG"))),
      "image/png",
    );
  });

  const safeName = report.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const refPart = post.referenceId ? `-${post.referenceId.toLowerCase()}` : "";
  const filename = `${safeName}-${post.platform}-${w}x${h}${refPart}-v${(options?.variantIndex ?? 0) + 1}.png`;

  return { dataUrl, blob, width: w, height: h, filename, spec };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
