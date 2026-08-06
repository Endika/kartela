import type { Side } from '../core/match'

export interface DragHandlers {
  /** Called on every pointer move: ratio is -1 (fully left) … 1 (fully right). */
  onProgress: (ratio: number) => void
  onCommit: (side: Side) => void
  onCancel: () => void
}

export interface DragLimits {
  /** Fraction of the surface width the finger has to travel to commit. */
  threshold: number
  /** A flick this fast commits even if it never reached the threshold (px per ms). */
  velocity: number
}

export const DEFAULT_LIMITS: DragLimits = { threshold: 0.25, velocity: 0.6 }

export interface DragOptions {
  limits?: DragLimits
  now?: () => number
  /** Overridable so a test can drag across a surface that has no layout. */
  width?: () => number
}

interface PointerLike {
  clientX: number
  pointerId?: number
  preventDefault?: () => void
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

/**
 * Horizontal drag over the duel area. Only the ratio is published while dragging so the
 * caller can animate with transforms alone and never touch layout mid-gesture.
 */
export function attachDrag(
  surface: HTMLElement,
  handlers: DragHandlers,
  options: DragOptions = {},
): () => void {
  const limits = options.limits ?? DEFAULT_LIMITS
  const now = options.now ?? (() => performance.now())
  const width =
    options.width ?? (() => surface.getBoundingClientRect().width || surface.clientWidth || 1)

  let startX: number | null = null
  let startTime = 0
  let pointerId: number | undefined

  function down(event: Event): void {
    const pointer = event as unknown as PointerLike
    startX = pointer.clientX
    startTime = now()
    pointerId = pointer.pointerId
    if (pointerId !== undefined) {
      surface.setPointerCapture?.(pointerId)
    }
  }

  function move(event: Event): void {
    if (startX === null) {
      return
    }
    const pointer = event as unknown as PointerLike
    pointer.preventDefault?.()
    handlers.onProgress(clamp((pointer.clientX - startX) / (width() * limits.threshold), -1, 1))
  }

  function up(event: Event): void {
    if (startX === null) {
      return
    }
    const pointer = event as unknown as PointerLike
    const dx = pointer.clientX - startX
    const elapsed = Math.max(now() - startTime, 1)
    startX = null
    if (pointerId !== undefined) {
      surface.releasePointerCapture?.(pointerId)
      pointerId = undefined
    }
    const far = Math.abs(dx) >= width() * limits.threshold
    const fast = Math.abs(dx) / elapsed >= limits.velocity && Math.abs(dx) > 8
    if (far || fast) {
      handlers.onCommit(dx > 0 ? 'right' : 'left')
    } else {
      handlers.onCancel()
    }
  }

  function cancel(): void {
    if (startX === null) {
      return
    }
    startX = null
    pointerId = undefined
    handlers.onCancel()
  }

  surface.addEventListener('pointerdown', down)
  surface.addEventListener('pointermove', move)
  surface.addEventListener('pointerup', up)
  surface.addEventListener('pointercancel', cancel)

  return () => {
    surface.removeEventListener('pointerdown', down)
    surface.removeEventListener('pointermove', move)
    surface.removeEventListener('pointerup', up)
    surface.removeEventListener('pointercancel', cancel)
  }
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}
