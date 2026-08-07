import { useCallback, useEffect, useRef, useState, type DragEvent, type PointerEvent as ReactPointerEvent } from "react";
import type { BrandReport, ContentPlatform, MascotId, MascotPosition } from "../types";
import { drawMascot } from "../lib/mascots";
import { DEFAULT_MASCOT_POS, PLATFORM_IMAGE_SPECS } from "../lib/postImage";

interface Props {
  report: BrandReport;
  platform: ContentPlatform;
  mascotId: MascotId;
  customMascot: HTMLImageElement | null;
  position: MascotPosition;
  onPositionChange: (pos: MascotPosition) => void;
  onCustomFile: (file: File) => void;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function MascotStage({
  report,
  platform,
  mascotId,
  customMascot,
  position,
  onPositionChange,
  onCustomFile,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);
  const [dropActive, setDropActive] = useState(false);
  const spec = PLATFORM_IMAGE_SPECS[platform];
  const isReel = spec.height / spec.width > 1.3;

  // Paint a small live mascot thumb on the draggable handle
  useEffect(() => {
    const canvas = thumbRef.current;
    if (!canvas || mascotId === "none") return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = 96;
    canvas.width = size;
    canvas.height = size;
    ctx.clearRect(0, 0, size, size);
    const accent =
      report.palette.find((c) => c.role === "accent")?.hex ||
      report.palette[0]?.hex ||
      "#C8F542";
    const secondary =
      report.palette.find((c) => c.role === "secondary")?.hex || accent;
    drawMascot(ctx, mascotId, {
      x: size / 2,
      y: size / 2,
      size: size * 0.9,
      accent,
      ink: "#0C1210",
      secondary,
      customImage: customMascot,
    });
  }, [mascotId, customMascot, report.palette]);

  const setFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const el = stageRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const nx = clamp((clientX - rect.left) / rect.width, 0.12, 0.88);
      const ny = clamp((clientY - rect.top) / rect.height, 0.12, 0.88);
      onPositionChange({ nx, ny });
    },
    [onPositionChange],
  );

  function onPointerDown(e: ReactPointerEvent) {
    if (mascotId === "none") return;
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setFromClient(e.clientX, e.clientY);
  }

  function onPointerMove(e: ReactPointerEvent) {
    if (!dragging.current) return;
    setFromClient(e.clientX, e.clientY);
  }

  function onPointerUp() {
    dragging.current = false;
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDropActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onCustomFile(file);
    }
  }

  if (mascotId === "none") {
    return (
      <fieldset className="studio-field">
        <legend>Mascot stage · posts & Reels</legend>
        <p className="platform-tip">
          Pick a mascot above to drag it onto feed (1:1) and Reel/TikTok (9:16) layouts.
        </p>
      </fieldset>
    );
  }

  return (
    <fieldset className="studio-field">
      <legend>Mascot stage · drag onto posts & Reels</legend>
      <p className="platform-tip">
        Drag the mascot on the {isReel ? "9:16 Reel / TikTok" : "feed"} stage — or drop a
        custom PNG onto it. Position is used when you generate post images.
      </p>

      <div className="mascot-stage-toolbar">
        <span className="voice-hint">
          {spec.label} · {spec.ratio}
        </span>
        <button
          type="button"
          className="chip-btn"
          onClick={() => onPositionChange({ ...DEFAULT_MASCOT_POS })}
        >
          Reset position
        </button>
      </div>

      <div
        ref={stageRef}
        className={`mascot-stage${dropActive ? " drop-active" : ""}${isReel ? " reel" : ""}`}
        style={{ aspectRatio: `${spec.width} / ${spec.height}` }}
        onDragOver={(e) => {
          e.preventDefault();
          setDropActive(true);
        }}
        onDragLeave={() => setDropActive(false)}
        onDrop={onDrop}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="mascot-stage-art">
          <strong>{report.name}</strong>
          <span>{isReel ? "Reel / TikTok frame" : "Feed post frame"}</span>
          <em>Hook copy sits here · drag mascot freely</em>
        </div>

        <div
          className="mascot-handle"
          style={{
            left: `${position.nx * 100}%`,
            top: `${position.ny * 100}%`,
          }}
          role="slider"
          aria-label="Mascot position"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(position.nx * 100)}
        >
          <canvas ref={thumbRef} width={96} height={96} />
          <span>Drag</span>
        </div>

        {dropActive && <div className="mascot-drop-hint">Drop mascot image</div>}
      </div>
    </fieldset>
  );
}
