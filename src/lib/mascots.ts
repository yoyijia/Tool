import type { ContentPlatform, MascotId, MascotOption, MascotPose } from "../types";

export const MASCOT_OPTIONS: MascotOption[] = [
  { id: "none", label: "No mascot", blurb: "Typography-only post." },
  { id: "orb", label: "Orb buddy", blurb: "Friendly glowing sphere." },
  { id: "fox", label: "Bolt fox", blurb: "Cheeky pointed mascot." },
  { id: "sprout", label: "Sprout", blurb: "Soft plant character." },
  { id: "bolt", label: "Spark bolt", blurb: "Energetic brand spark." },
  { id: "custom", label: "Custom upload", blurb: "Use your own mascot PNG." },
];

export interface MascotPoseOption {
  id: MascotPose;
  label: string;
  blurb: string;
  /** Content cues that auto-select this pose */
  cues: RegExp;
}

export const MASCOT_POSES: MascotPoseOption[] = [
  {
    id: "idle",
    label: "Idle",
    blurb: "Neutral brand presence.",
    cues: /^$/,
  },
  {
    id: "wave",
    label: "Wave",
    blurb: "Friendly hello / intro.",
    cues: /\b(hello|hi |intro|welcome|meet|launch|new)\b/i,
  },
  {
    id: "point",
    label: "Point",
    blurb: "Callout, tip, CTA.",
    cues: /\b(tip|cta|look|point|here|watch|click|learn)\b/i,
  },
  {
    id: "present",
    label: "Present",
    blurb: "Explainer / showcase.",
    cues: /\b(explain|present|showcase|demo|service|seo|sem|geo|website|am-track|framework)\b/i,
  },
  {
    id: "celebrate",
    label: "Celebrate",
    blurb: "Wins, launches, results.",
    cues: /\b(win|result|celebrate|success|growth|lead|award|case study)\b/i,
  },
  {
    id: "think",
    label: "Think",
    blurb: "Myth-bust, strategy, FAQ.",
    cues: /\b(myth|faq|strategy|think|why|how |question|insight)\b/i,
  },
  {
    id: "shield",
    label: "Shield",
    blurb: "Trust / ORM / reputation.",
    cues: /\b(trust|orm|reputation|review|safe|privacy|protect|compliance)\b/i,
  },
  {
    id: "boost",
    label: "Boost",
    blurb: "Ads, SEM, paid social.",
    cues: /\b(ads?|sem|ppc|paid|boost|advertis|campaign|tiktok ad|meta)\b/i,
  },
];

export interface MascotDrawOptions {
  x: number;
  y: number;
  size: number;
  accent: string;
  ink: string;
  secondary: string;
  pose?: MascotPose;
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

const POSE_PRIORITY: MascotPose[] = [
  "shield",
  "boost",
  "celebrate",
  "think",
  "present",
  "point",
  "wave",
];

/** Pick a pose from the brief first; services/platform are soft fallbacks. */
export function suggestMascotPose(
  topic: string,
  platform: ContentPlatform,
  services: string[] = [],
): MascotPose {
  const topicHay = topic.trim();
  if (topicHay) {
    for (const id of POSE_PRIORITY) {
      const pose = MASCOT_POSES.find((p) => p.id === id);
      if (pose?.cues.test(topicHay)) return id;
    }
  }

  const svc = services.join(" ").toLowerCase();
  if (/reputation|orm/.test(svc) && /orm|reputation|review/.test(topicHay || "orm")) {
    return "shield";
  }
  if (!topicHay) {
    if (/reputation|orm/.test(svc)) return "shield";
    if (/\bsem\b|advertis|paid/.test(svc)) return "boost";
    if (/seo|geo|website|am-track/.test(svc)) return "present";
    if (/healthcare|medical/.test(svc)) return "wave";
  }

  if (platform === "tiktok" || platform === "youtube") return "wave";
  if (platform === "linkedin") return "present";
  return "idle";
}

function drawProp(
  ctx: CanvasRenderingContext2D,
  pose: MascotPose,
  size: number,
  accent: string,
  ink: string,
) {
  ctx.save();
  if (pose === "point") {
    ctx.strokeStyle = accent;
    ctx.lineWidth = size * 0.07;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(size * 0.22, size * 0.05);
    ctx.lineTo(size * 0.48, -size * 0.08);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(size * 0.48, -size * 0.08);
    ctx.lineTo(size * 0.38, -size * 0.18);
    ctx.lineTo(size * 0.55, -size * 0.02);
    ctx.closePath();
    ctx.fill();
  } else if (pose === "wave") {
    ctx.strokeStyle = accent;
    ctx.lineWidth = size * 0.07;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(size * 0.2, 0);
    ctx.quadraticCurveTo(size * 0.38, -size * 0.28, size * 0.22, -size * 0.42);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(size * 0.18, -size * 0.48, size * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();
  } else if (pose === "present") {
    ctx.fillStyle = accent;
    roundRect(ctx, size * 0.22, -size * 0.22, size * 0.32, size * 0.24, size * 0.04);
    ctx.fill();
    ctx.fillStyle = ink;
    ctx.fillRect(size * 0.28, -size * 0.14, size * 0.2, size * 0.03);
    ctx.fillRect(size * 0.28, -size * 0.06, size * 0.14, size * 0.03);
  } else if (pose === "celebrate") {
    ctx.fillStyle = accent;
    for (const [dx, dy] of [
      [0.35, -0.4],
      [0.42, -0.22],
      [0.28, -0.28],
      [-0.38, -0.35],
    ] as const) {
      ctx.beginPath();
      ctx.arc(size * dx, size * dy, size * 0.045, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = accent;
    ctx.lineWidth = size * 0.04;
    ctx.beginPath();
    ctx.moveTo(-size * 0.2, -size * 0.1);
    ctx.lineTo(-size * 0.35, -size * 0.35);
    ctx.moveTo(size * 0.2, -size * 0.05);
    ctx.lineTo(size * 0.4, -size * 0.32);
    ctx.stroke();
  } else if (pose === "think") {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(size * 0.32, -size * 0.38, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size * 0.22, -size * 0.22, size * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ink;
    ctx.font = `800 ${Math.round(size * 0.12)}px Figtree, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", size * 0.32, -size * 0.38);
  } else if (pose === "shield") {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(size * 0.28, -size * 0.28);
    ctx.lineTo(size * 0.48, -size * 0.18);
    ctx.lineTo(size * 0.48, size * 0.05);
    ctx.quadraticCurveTo(size * 0.38, size * 0.22, size * 0.28, size * 0.28);
    ctx.quadraticCurveTo(size * 0.18, size * 0.22, size * 0.08, size * 0.05);
    ctx.lineTo(size * 0.08, -size * 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = size * 0.03;
    ctx.beginPath();
    ctx.moveTo(size * 0.2, -size * 0.02);
    ctx.lineTo(size * 0.27, size * 0.08);
    ctx.lineTo(size * 0.4, -size * 0.1);
    ctx.stroke();
  } else if (pose === "boost") {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(size * 0.18, size * 0.15);
    ctx.lineTo(size * 0.18, -size * 0.05);
    ctx.lineTo(size * 0.28, -size * 0.05);
    ctx.lineTo(size * 0.28, -size * 0.2);
    ctx.lineTo(size * 0.38, -size * 0.2);
    ctx.lineTo(size * 0.38, -size * 0.38);
    ctx.lineTo(size * 0.48, -size * 0.38);
    ctx.lineTo(size * 0.48, size * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.moveTo(size * 0.42, -size * 0.48);
    ctx.lineTo(size * 0.52, -size * 0.32);
    ctx.lineTo(size * 0.32, -size * 0.32);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function poseTransform(pose: MascotPose): {
  rotate: number;
  scaleX: number;
  scaleY: number;
  bounceY: number;
} {
  switch (pose) {
    case "wave":
      return { rotate: -0.12, scaleX: 1, scaleY: 1.02, bounceY: -0.04 };
    case "point":
      return { rotate: 0.08, scaleX: 1.05, scaleY: 1, bounceY: 0 };
    case "present":
      return { rotate: -0.04, scaleX: 1, scaleY: 1, bounceY: 0 };
    case "celebrate":
      return { rotate: -0.06, scaleX: 1.08, scaleY: 1.08, bounceY: -0.06 };
    case "think":
      return { rotate: 0.1, scaleX: 0.98, scaleY: 1, bounceY: 0.02 };
    case "shield":
      return { rotate: 0, scaleX: 1.02, scaleY: 1.02, bounceY: 0 };
    case "boost":
      return { rotate: -0.08, scaleX: 1.06, scaleY: 1.1, bounceY: -0.05 };
    default:
      return { rotate: 0, scaleX: 1, scaleY: 1, bounceY: 0 };
  }
}

function drawFace(
  ctx: CanvasRenderingContext2D,
  size: number,
  ink: string,
  pose: MascotPose,
) {
  ctx.fillStyle = ink;
  const eyeY = pose === "think" ? -size * 0.02 : -size * 0.06;
  ctx.beginPath();
  ctx.arc(-size * 0.14, eyeY, size * 0.055, 0, Math.PI * 2);
  ctx.arc(size * 0.14, eyeY, size * 0.055, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = ink;
  ctx.lineWidth = size * 0.04;
  ctx.lineCap = "round";
  ctx.beginPath();
  if (pose === "celebrate" || pose === "wave") {
    ctx.arc(0, size * 0.08, size * 0.16, 0.1 * Math.PI, 0.9 * Math.PI);
  } else if (pose === "think") {
    ctx.moveTo(-size * 0.08, size * 0.14);
    ctx.quadraticCurveTo(0, size * 0.08, size * 0.1, size * 0.14);
  } else if (pose === "shield") {
    ctx.moveTo(-size * 0.1, size * 0.12);
    ctx.lineTo(size * 0.1, size * 0.12);
  } else {
    ctx.arc(0, size * 0.06, size * 0.14, 0.15 * Math.PI, 0.85 * Math.PI);
  }
  ctx.stroke();
}

export function drawMascot(
  ctx: CanvasRenderingContext2D,
  id: MascotId,
  opts: MascotDrawOptions,
) {
  const { x, y, size, accent, ink, secondary, customImage } = opts;
  const pose: MascotPose = opts.pose ?? "idle";
  if (id === "none") return;

  const tf = poseTransform(pose);

  if (id === "custom" && customImage) {
    const w = size * tf.scaleX;
    const h = size * tf.scaleY;
    ctx.save();
    ctx.translate(x, y + size * tf.bounceY);
    ctx.rotate(tf.rotate);
    roundRect(ctx, -w / 2, -h / 2, w, h, size * 0.18);
    ctx.clip();
    ctx.drawImage(customImage, -w / 2, -h / 2, w, h);
    ctx.restore();
    // Props outside clip
    ctx.save();
    ctx.translate(x, y + size * tf.bounceY);
    ctx.rotate(tf.rotate);
    drawProp(ctx, pose, size, accent, ink);
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.translate(x, y + size * tf.bounceY);
  ctx.rotate(tf.rotate);
  ctx.scale(tf.scaleX, tf.scaleY);

  if (id === "orb") {
    const g = ctx.createRadialGradient(0, -size * 0.1, size * 0.1, 0, 0, size * 0.5);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.35, accent);
    g.addColorStop(1, secondary);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.48, 0, Math.PI * 2);
    ctx.fill();
    drawFace(ctx, size, ink, pose);
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
    ctx.fillStyle = accent + "55";
    roundRect(ctx, -size * 0.45, -size * 0.45, size * 0.9, size * 0.9, size * 0.16);
    ctx.fill();
    ctx.fillStyle = ink;
    ctx.font = `700 ${Math.round(size * 0.14)}px Figtree, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("MASCOT", 0, size * 0.05);
  }

  drawProp(ctx, pose, size, accent, ink);
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
      const direct = new Image();
      direct.crossOrigin = "anonymous";
      direct.onload = () => resolve(direct);
      direct.onerror = () => reject(new Error("Thumbnail blocked by CORS."));
      direct.src = url;
    };
    img.src = proxied;
  });
}
