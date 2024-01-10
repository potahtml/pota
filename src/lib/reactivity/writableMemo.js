import { markReactive } from './markReactive.js'
import {
  cleanup,
  effect,
  memo,
  signal,
  untrack,
} from './primitives/solid.js'

/**
 * Lazy and writable version of `memo`, its writable and will run the
 * function only when used
 *
 * @param {Function} fn - Function to re-run when dependencies change
 * @returns {Signal}
 */
export function writableMemo(fn) {
  const [sleeping, setSleeping] = signal(true)

  const [value, setValue] = signal()

  const memoValue = memo(() => {
    if (sleeping()) return untrack(value)
    return fn()
  })

  effect(() => {
    if (sleeping()) return
    setValue(memoValue())
  })

  let read = () => {
    setSleeping(false)
    read = value
    return value()
  }

  return markReactive((...args) => {
    return args.length ? setValue(args[0]) : read()
  })
}
