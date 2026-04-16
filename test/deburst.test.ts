import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { deburst } from '../src/index.js'

describe('deburst', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('fires once after burstInterval when triggered a single time', () => {
    const cb = vi.fn()
    const trigger = deburst(cb, 200, 1000)

    trigger()
    expect(cb).not.toHaveBeenCalled()

    vi.advanceTimersByTime(199)
    expect(cb).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('collapses rapid triggers into a single trailing-edge call', () => {
    const cb = vi.fn()
    const trigger = deburst(cb, 200, 1000)

    trigger()
    vi.advanceTimersByTime(100)
    trigger()
    vi.advanceTimersByTime(100)
    trigger()
    vi.advanceTimersByTime(100)
    // 300ms since first, 100ms since last — no call yet
    expect(cb).not.toHaveBeenCalled()

    // 200ms of silence after the last trigger
    vi.advanceTimersByTime(100)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('fires after burstLimit during a continuous burst', () => {
    const cb = vi.fn()
    const trigger = deburst(cb, 200, 1000)

    // A tight burst of 20 triggers every 50ms spans 1000ms total.
    for (let i = 0; i < 20; i++) {
      trigger()
      vi.advanceTimersByTime(50)
    }

    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('cancel() (both forms) aborts a pending invocation', () => {
    const cb = vi.fn()
    const trigger = deburst(cb, 200, 1000)

    trigger()
    trigger.cancel()
    vi.advanceTimersByTime(1000)
    expect(cb).not.toHaveBeenCalled()

    // and then a fresh trigger still works
    trigger()
    vi.advanceTimersByTime(200)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('starts a fresh burst window after firing', () => {
    const cb = vi.fn()
    const trigger = deburst(cb, 200, 1000)

    trigger()
    vi.advanceTimersByTime(200)
    expect(cb).toHaveBeenCalledTimes(1)

    // long quiet period, then another burst — must fire again
    vi.advanceTimersByTime(5000)
    trigger()
    vi.advanceTimersByTime(200)
    expect(cb).toHaveBeenCalledTimes(2)
  })

  it('cancel() during the burstLimit ceiling window allows retriggering', () => {
    const cb = vi.fn()
    const trigger = deburst(cb, 200, 1000)

    // continuous triggers every 100ms to reach the ceiling window at t=800
    for (let i = 0; i < 9; i++) {
      trigger()
      vi.advanceTimersByTime(100)
    }
    // t=900, ceiling timer locked to fire at t=1000

    trigger.cancel() // resets all state

    // subsequent trigger starts a fresh burst
    vi.advanceTimersByTime(50) // t=950
    trigger()
    vi.advanceTimersByTime(200) // t=1150
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('drops redundant triggers once the burstLimit timer is locked in', () => {
    const cb = vi.fn()
    const trigger = deburst(cb, 200, 1000)

    // continuous triggers every 100ms to reach the ceiling window
    for (let i = 0; i < 9; i++) {
      trigger()
      vi.advanceTimersByTime(100)
    }
    // t=900, ceiling timer locked to fire at t=1000

    // these should be silently dropped (early-return path)
    trigger() // t=900
    vi.advanceTimersByTime(10)
    trigger() // t=910

    expect(cb).not.toHaveBeenCalled()

    // fires at t=1000
    vi.advanceTimersByTime(90)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('cancel() is a no-op when no timer is pending', () => {
    const cb = vi.fn()
    const trigger = deburst(cb, 200, 1000)

    // cancel before any trigger — should not throw
    trigger.cancel()

    // still works normally afterward
    trigger()
    vi.advanceTimersByTime(200)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('separate instances do not interfere', () => {
    const cb1 = vi.fn()
    const cb2 = vi.fn()
    const trigger1 = deburst(cb1, 200, 1000)
    const trigger2 = deburst(cb2, 300, 2000)

    trigger1()
    trigger2()

    vi.advanceTimersByTime(200)
    expect(cb1).toHaveBeenCalledTimes(1)
    expect(cb2).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    expect(cb2).toHaveBeenCalledTimes(1)
  })

  it('fires at burstLimit even when burstLimit equals burstInterval', () => {
    const cb = vi.fn()
    const trigger = deburst(cb, 500, 500)

    trigger()
    vi.advanceTimersByTime(499)
    expect(cb).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(cb).toHaveBeenCalledTimes(1)
  })
})
