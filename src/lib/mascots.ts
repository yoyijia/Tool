import type { MascotId, MascotOption } from "../types";

export const MASCOT_OPTIONS: MascotOption[] = [
  { id: "none", label: "No mascot", blurb: "Typography-only post." },
  { id: "orb", label: "Orb buddy", blurb: "Friendly glowing sphere." },
  { id: "fox", label: "Bolt fox", blurb: "Cheeky pointed mascot." },
  { id: "sprout", label: "Sprout", blurb: "Soft plant character." },
  { id: "bolt", label: "Spark bolt", blurb: "Energetic brand spark." },
  { id: "custom", label: "Custom upload", blurb: "Use your own mascot PNG." },
];

export interface MascotDrawOptions {
  x: number;
  y: number;
  size: number;
  accent: string;
  ink: string;
  secondary: string;
  customImage?: HTMLImageElement | null;
}

function roundRect(
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

export function drawMascot(
  ctx: CanvasRenderingContext2D,
  id: MascotId,
  opts: MascotDrawOptions,
) {
  const { x, y, size, accent, ink, secondary, customImage } = opts;
  if (id === "none") return;

  if (id === "custom" && customImage) {
    const w = size;
    const h = size;
    ctx.save();
    roundRect(ctx, x - w / 2, y - h / 2, w, h, size * 0.18);
    ctx.clip();
    ctx.drawImage(customImage, x - w / 2, y - h / 2, w, h);
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.translate(x, y);

  if (id === "orb") {
    const g = ctx.createRadialGradient(0, -size * 0.1, size * 0.1, 0, 0, size * 0.5);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.35, accent);
    g.addColorStop(1, secondary);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.48, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.arc(-size * 0.14, -size * 0.06, size * 0.06, 0, Math.PI * 2);
    ctx.arc(size * 0.14, -size * 0.06, size * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = size * 0.04;
    ctx.beginPath();
    ctx.arc(0, size * 0.06, size * 0.14, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  } else if (id === "fox") {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(0, size * 0.42);
    ctx.lineTo(-size * 0.42, -size * 0.1);
    ctx.lineTo(-size * 0.18, -size * 0.45);
    ctx.lineTo(0, -size * 0.2);
    ctx.lineTo(size * 0.18, -size * 0.45);
    ctx.lineTo(size * 0.42, -size * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.arc(-size * 0.12, -size * 0.02, size * 0.05, 0, Math.PI * 2);
    ctx.arc(size * 0.12, -size * 0.02, size * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = secondary;
    ctx.beginPath();
    ctx.moveTo(0, size * 0.08);
    ctx.lineTo(-size * 0.08, size * 0.22);
    ctx.lineTo(size * 0.08, size * 0.22);
    ctx.closePath();
    ctx.fill();
  } else if (id === "sprout") {
    ctx.fillStyle = secondary;
    ctx.beginPath();
    ctx.ellipse(0, size * 0.18, size * 0.28, size * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = size * 0.06;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, size * 0.05);
    ctx.quadraticCurveTo(size * 0.05, -size * 0.2, 0, -size * 0.42);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.ellipse(-size * 0.16, -size * 0.28, size * 0.14, size * 0.09, -0.6, 0, Math.PI * 2);
    ctx.ellipse(size * 0.16, -size * 0.22, size * 0.14, size * 0.09, 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.arc(-size * 0.1, size * 0.12, size * 0.045, 0, Math.PI * 2);
    ctx.arc(size * 0.1, size * 0.12, size * 0.045, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === "bolt") {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(size * 0.08, -size * 0.48);
    ctx.lineTo(-size * 0.22, size * 0.02);
    ctx.lineTo(size * 0.02, size * 0.02);
    ctx.lineTo(-size * 0.08, size * 0.48);
    ctx.lineTo(size * 0.28, -size * 0.05);
    ctx.lineTo(size * 0.02, -size * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = size * 0.03;
    ctx.stroke();
  } else if (id === "custom") {
    // Placeholder when no upload yet
    ctx.fillStyle = accent + "55";
    roundRect(ctx, -size * 0.45, -size * 0.45, size * 0.9, size * 0.9, size * 0.16);
    ctx.fill();
    ctx.fillStyle = ink;
    ctx.font = `700 ${Math.round(size * 0.14)}px Figtree, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("MASCOT", 0, size * 0.05);
  }

  ctx.restore();
}

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load mascot image."));
    };
    img.src = url;
  });
}

/** Proxy-friendly image loader for Instagram thumbnails drawn onto canvas. */
export function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const proxied =
      typeof window !== "undefined"
        ? `/api/fetch-image?url=${encodeURIComponent(url)}`
        : url;
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Fallback: try direct (may taint canvas)
      const direct = new Image();
      direct.crossOrigin = "anonymous";
      direct.onload = () => resolve(direct);
      direct.onerror = () => reject(new Error("Thumbnail blocked by CORS."));
      direct.src = url;
    };
    img.src = proxied;
  });
}
