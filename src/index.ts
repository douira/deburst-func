/**
 * Debursts a function call. The callback is not triggered immediately after the
 * returned function is called (a trigger event). Instead, the callback is
 * delayed until either the time since the last trigger is greater than
 * burstInterval or the time since the first trigger (not yet responded to) is
 * greater than burstLimit.
 *
 * @param callback       The function to be throttled.
 * @param burstInterval  Time between two triggers above which the callback
 *                       is called immediately.
 * @param burstLimit     Maximum time the callback is delayed from the first
 *                       call after which the callback has not yet been
 *                       called.
 */
export const deburst = (
  callback: () => void,
  burstInterval: number,
  burstLimit: number
): { (): void; cancel: () => void } => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let firstUnsatisfiedTrigger = Infinity
  let timeoutSetForBurstLimit = false

  const clearTimer = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  const cancel = () => {
    clearTimer()
    firstUnsatisfiedTrigger = Infinity
    timeoutSetForBurstLimit = false
  }

  const trigger = () => {
    const burstLimitTimeout =
      burstLimit - (Date.now() - firstUnsatisfiedTrigger)
    if (burstLimitTimeout <= burstInterval) {
      // if a timeout was already set for the burst limit,
      // all following timeouts will be targeting the same callback time
      if (timeoutSetForBurstLimit) {
        return
      }
      timeoutSetForBurstLimit = true
    } else {
      timeoutSetForBurstLimit = false
    }

    // clear the previous timeout to reschedule it
    clearTimer()
    if (firstUnsatisfiedTrigger === Infinity) {
      firstUnsatisfiedTrigger = Date.now()
    }
    timeoutId = setTimeout(
      () => {
        callback()
        firstUnsatisfiedTrigger = Infinity
      },
      Math.min(burstInterval, burstLimitTimeout)
    )
  }

  trigger.cancel = cancel
  return trigger
}
