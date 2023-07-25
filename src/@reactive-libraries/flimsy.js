import {
  createRoot,
  createEffect,
  onCleanup,
  createSignal,
  createMemo,
  untrack,
} from './lib/flimsy.js'

import { setReactiveLibrary } from '../index.js'

setReactiveLibrary({
  root: createRoot,
  renderEffect: createEffect,
  effect: createEffect,
  cleanup: onCleanup,
  signal: createSignal,
  memo: createMemo,
  untrack: untrack,
})

export * from '../index.js'
export * from '../components.js'
