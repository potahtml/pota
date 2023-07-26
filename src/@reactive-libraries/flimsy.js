import {
  createRoot,
  createEffect,
  onCleanup,
  createSignal,
  createMemo,
  untrack,
  createContext,
  useContext,
} from './lib/flimsy.js'

import { setReactiveLibrary, children } from '../index.js'

setReactiveLibrary({
  root: createRoot,
  renderEffect: createEffect,
  effect: createEffect,
  cleanup: onCleanup,
  signal: createSignal,
  memo: createMemo,
  untrack: untrack,
  createContext: function (defaultValue) {
    const context = createContext(defaultValue)
    return {
      ...context,
      Provider: function (props) {
        let r
        createEffect(
          () =>
            (r = untrack(() => {
              context.set(props.value)
              return children(() => props.children)
            })),
        )
        return r
      },
    }
  },
  useContext: useContext,
})

export * from '../index.js'
export * from '../components.js'
