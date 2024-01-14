import { markReactive } from './markReactive.js'
import { memo, signal } from './primitives/solid.js'

/**
 * Lazy and writable version of `memo`, its writable and will run the
 * function only when used
 *
 * @author ryansolid
 * @param {Function} fn - Function to re-run when dependencies change
 * @returns {((...args) => any) | (() => any)}
 */
export function writableMemo(fn) {
  const result = memo(() => signal(fn()))

  return markReactive((...args) => {
    return args.length ? result()[1](args[0]) : result()[0]()
  })
}
