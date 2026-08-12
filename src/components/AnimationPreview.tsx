import { useEffect, useRef } from 'react'
import type { GeneratedAnimation } from '../types'

interface AnimationPreviewProps {
  animation: GeneratedAnimation | null
  scale?: number
}

export function AnimationPreview({ animation, scale = 4 }: AnimationPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef(0)
  const lastRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !animation?.frames.length) return

    const size = animation.frameSize
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'low'

    frameRef.current = 0
    lastRef.current = performance.now()
    let raf = 0

    const tick = (now: number) => {
      const interval = 1000 / animation.fps
      if (now - lastRef.current >= interval) {
        lastRef.current = now
        frameRef.current = (frameRef.current + 1) % animation.frames.length
        ctx.clearRect(0, 0, size, size)
        ctx.drawImage(animation.frames[frameRef.current].canvas, 0, 0)
      }
      raf = requestAnimationFrame(tick)
    }

    ctx.clearRect(0, 0, size, size)
    ctx.drawImage(animation.frames[0].canvas, 0, 0)
    raf = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(raf)
  }, [animation])

  if (!animation) {
    return (
      <div className="preview-empty">
        <span>Generate an animation to preview</span>
      </div>
    )
  }

  return (
    <div className="preview-stage">
      <canvas
        ref={canvasRef}
        className="preview-canvas"
        style={{ width: animation.frameSize * scale, height: animation.frameSize * scale }}
      />
      <div className="preview-meta">
        {animation.type} · {animation.frames.length} frames · {animation.fps} fps
      </div>
    </div>
  )
}
