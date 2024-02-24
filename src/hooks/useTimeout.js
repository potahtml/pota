import { withValue, cleanup } from '../exports.js'

export function useTimeout(callabck, timeout, ...args) {
  let id
  const fn = {
    start: () => {
      withValue(timeout, timeout => {
        fn.stop()
        if (timeout < Infinity)
          id = setTimeout(callabck, timeout, ...args)
      })
      return fn
    },

    stop: () => clearTimeout(id),
  }

  cleanup(fn.stop)

  return fn
}
