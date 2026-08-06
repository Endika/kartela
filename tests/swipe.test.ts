import { beforeEach, describe, expect, it, vi } from 'vitest'
import { attachDrag, type DragHandlers } from '../src/ui/swipe'
import type { Side } from '../src/domain/match'

const WIDTH = 400

function surfaceWithSpies() {
  const surface = document.createElement('div')
  document.body.append(surface)
  const committed: Side[] = []
  const progress: number[] = []
  let cancels = 0
  const handlers: DragHandlers = {
    onProgress: (ratio) => progress.push(ratio),
    onCommit: (side) => committed.push(side),
    onCancel: () => {
      cancels += 1
    },
  }
  let clock = 0
  const detach = attachDrag(surface, handlers, {
    width: () => WIDTH,
    now: () => clock,
  })
  return {
    surface,
    committed,
    progress,
    cancels: () => cancels,
    detach,
    advance: (ms: number) => {
      clock += ms
    },
  }
}

function pointer(surface: HTMLElement, type: string, clientX: number): void {
  surface.dispatchEvent(new MouseEvent(type, { clientX, bubbles: true }))
}

/** One gesture: press, move, release — taking `ms` of the fake clock. */
function drag(
  target: ReturnType<typeof surfaceWithSpies>,
  from: number,
  to: number,
  ms = 500,
): void {
  pointer(target.surface, 'pointerdown', from)
  target.advance(ms)
  pointer(target.surface, 'pointermove', to)
  pointer(target.surface, 'pointerup', to)
}

describe('attachDrag', () => {
  beforeEach(() => {
    document.body.replaceChildren()
  })

  it('commits right when the finger travels past the threshold', () => {
    const target = surfaceWithSpies()
    drag(target, 100, 100 + WIDTH * 0.3)
    expect(target.committed).toEqual(['right'])
  })

  it('commits left when the finger travels the other way', () => {
    const target = surfaceWithSpies()
    drag(target, 300, 300 - WIDTH * 0.3)
    expect(target.committed).toEqual(['left'])
  })

  it('cancels a short drag instead of choosing', () => {
    const target = surfaceWithSpies()
    drag(target, 100, 110)
    expect(target.committed).toEqual([])
    expect(target.cancels()).toBe(1)
  })

  it('commits a fast flick that never reaches the threshold', () => {
    const target = surfaceWithSpies()
    drag(target, 100, 130, 10)
    expect(target.committed).toEqual(['right'])
  })

  it('reports progress as a ratio capped at one', () => {
    const target = surfaceWithSpies()
    pointer(target.surface, 'pointerdown', 100)
    pointer(target.surface, 'pointermove', 100 + WIDTH * 0.125)
    pointer(target.surface, 'pointermove', 100 + WIDTH * 0.9)
    expect(target.progress[0]).toBeCloseTo(0.5, 5)
    expect(target.progress[1]).toBe(1)
  })

  it('ignores moves that did not start with a press', () => {
    const target = surfaceWithSpies()
    pointer(target.surface, 'pointermove', 300)
    pointer(target.surface, 'pointerup', 300)
    expect(target.progress).toEqual([])
    expect(target.committed).toEqual([])
    expect(target.cancels()).toBe(0)
  })

  it('treats a cancelled pointer as no choice', () => {
    const target = surfaceWithSpies()
    pointer(target.surface, 'pointerdown', 100)
    pointer(target.surface, 'pointercancel', 260)
    expect(target.committed).toEqual([])
    expect(target.cancels()).toBe(1)
  })

  it('stops listening once detached', () => {
    const target = surfaceWithSpies()
    target.detach()
    drag(target, 100, 300)
    expect(target.committed).toEqual([])
  })

  it('falls back to a usable width when the surface has no layout', () => {
    const surface = document.createElement('div')
    document.body.append(surface)
    const onCommit = vi.fn()
    attachDrag(surface, { onProgress: () => {}, onCommit, onCancel: () => {} })
    pointer(surface, 'pointerdown', 0)
    pointer(surface, 'pointerup', 50)
    expect(onCommit).toHaveBeenCalledWith('right')
  })
})
