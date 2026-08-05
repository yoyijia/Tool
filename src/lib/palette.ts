import type { ColorSwatch } from "../types";

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function clamp(n: number, min = 0, max = 255): number {
  return Math.max(min, Math.min(max, n));
}

export function parseColor(input: string): Rgb | null {
  const s = input.trim().toLowerCase();

  if (s.startsWith("#")) {
    let hex = s.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      hex = hex
        .slice(0, 3)
        .split("")
        .map((c) => c + c)
        .join("");
    } else if (hex.length === 8) {
      hex = hex.slice(0, 6);
    }
    if (hex.length !== 6 || !/^[0-9a-f]+$/.test(hex)) return null;
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  const rgbMatch = s.match(
    /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/,
  );
  if (rgbMatch) {
    return {
      r: clamp(+rgbMatch[1]),
      g: clamp(+rgbMatch[2]),
      b: clamp(+rgbMatch[3]),
    };
  }

  const hslMatch = s.match(
    /hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/,
  );
  if (hslMatch) {
    return hslToRgb(+hslMatch[1], +hslMatch[2] / 100, +hslMatch[3] / 100);
  }

  return null;
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = ((h % 360) + 360) % 360;
  const x = c * (1 - Math.abs(((hp / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (hp < 60) [r, g, b] = [c, x, 0];
  else if (hp < 120) [r, g, b] = [x, c, 0];
  else if (hp < 180) [r, g, b] = [0, c, x];
  else if (hp < 240) [r, g, b] = [0, x, c];
  else if (hp < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => clamp(Math.round(v)).toString(16).padStart(2, "0"))
      .join("")
  );
}

function luminance({ r, g, b }: Rgb): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function saturation({ r, g, b }: Rgb): number {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  if (max === min) return 0;
  const l = (max + min) / 2;
  return (max - min) / (1 - Math.abs(2 * l - 1));
}

function colorDistance(a: Rgb, b: Rgb): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

const NAME_MAP: { name: string; rgb: Rgb }[] = [
  { name: "Ink", rgb: { r: 12, g: 18, b: 16 } },
  { name: "Charcoal", rgb: { r: 40, g: 44, b: 48 } },
  { name: "Slate", rgb: { r: 90, g: 100, b: 110 } },
  { name: "Stone", rgb: { r: 160, g: 160, b: 155 } },
  { name: "Ivory", rgb: { r: 245, g: 242, b: 235 } },
  { name: "White", rgb: { r: 255, g: 255, b: 255 } },
  { name: "Crimson", rgb: { r: 180, g: 30, b: 40 } },
  { name: "Coral", rgb: { r: 240, g: 100, b: 80 } },
  { name: "Amber", rgb: { r: 230, g: 160, b: 40 } },
  { name: "Gold", rgb: { r: 200, g: 170, b: 60 } },
  { name: "Chartreuse", rgb: { r: 180, g: 220, b: 50 } },
  { name: "Forest", rgb: { r: 30, g: 90, b: 50 } },
  { name: "Teal", rgb: { r: 30, g: 140, b: 140 } },
  { name: "Ocean", rgb: { r: 20, g: 90, b: 160 } },
  { name: "Sky", rgb: { r: 100, g: 180, b: 230 } },
  { name: "Indigo", rgb: { r: 60, g: 50, b: 140 } },
  { name: "Violet", rgb: { r: 120, g: 60, b: 160 } },
  { name: "Magenta", rgb: { r: 180, g: 40, b: 120 } },
  { name: "Rose", rgb: { r: 220, g: 120, b: 140 } },
  { name: "Sand", rgb: { r: 210, g: 190, b: 150 } },
];

function nearestName(rgb: Rgb): string {
  let best = NAME_MAP[0];
  let bestDist = Infinity;
  for (const entry of NAME_MAP) {
    const d = colorDistance(rgb, entry.rgb);
    if (d < bestDist) {
      bestDist = d;
      best = entry;
    }
  }
  return best.name;
}

function quantize(rgb: Rgb, step = 24): string {
  const q = (v: number) => Math.round(v / step) * step;
  return rgbToHex({ r: q(rgb.r), g: q(rgb.g), b: q(rgb.b) });
}

export function buildPalette(
  rawColors: string[],
  themeColor?: string,
): ColorSwatch[] {
  const counts = new Map<string, { rgb: Rgb; count: number }>();

  const consider = (raw: string, weight = 1) => {
    const rgb = parseColor(raw);
    if (!rgb) return;
    // Skip near-transparent-looking greys that are pure black/white extremes unless frequent
    const key = quantize(rgb);
    const existing = counts.get(key);
    if (existing) existing.count += weight;
    else counts.set(key, { rgb, count: weight });
  };

  for (const c of rawColors) consider(c, 1);
  if (themeColor) consider(themeColor, 8);

  const ranked = [...counts.entries()]
    .map(([hex, { rgb, count }]) => ({ hex, rgb, count }))
    .filter(({ rgb }) => {
      // Drop near-invisible near-white/near-black unless they're dominant
      const lum = luminance(rgb);
      return lum > 0.04 && lum < 0.97;
    })
    .sort((a, b) => b.count - a.count);

  // Deduplicate similar colors
  const unique: { hex: string; rgb: Rgb; count: number }[] = [];
  for (const item of ranked) {
    if (unique.some((u) => colorDistance(u.rgb, item.rgb) < 40)) continue;
    unique.push(item);
    if (unique.length >= 8) break;
  }

  if (unique.length === 0) {
    return [
      {
        hex: "#0c1210",
        role: "background",
        frequency: 1,
        name: "Ink",
      },
      {
        hex: "#c8f542",
        role: "accent",
        frequency: 0.8,
        name: "Chartreuse",
      },
      {
        hex: "#e8f0ea",
        role: "text",
        frequency: 0.6,
        name: "Ivory",
      },
    ];
  }

  const total = unique.reduce((s, u) => s + u.count, 0) || 1;
  const bySat = [...unique].sort(
    (a, b) => saturation(b.rgb) - saturation(a.rgb),
  );
  const byLum = [...unique].sort(
    (a, b) => luminance(a.rgb) - luminance(b.rgb),
  );

  const roles: ColorSwatch["role"][] = [
    "primary",
    "secondary",
    "accent",
    "neutral",
    "background",
    "text",
  ];

  return unique.map((item, i) => {
    let role: ColorSwatch["role"] = roles[Math.min(i, roles.length - 1)];
    if (item === byLum[0]) role = "background";
    else if (item === byLum[byLum.length - 1]) role = "text";
    else if (item === bySat[0] && saturation(item.rgb) > 0.35) role = "accent";
    else if (i === 0) role = "primary";
    else if (i === 1) role = "secondary";

    return {
      hex: rgbToHex(item.rgb).toUpperCase(),
      role,
      frequency: Math.round((item.count / total) * 100) / 100,
      name: nearestName(item.rgb),
    };
  });
}
