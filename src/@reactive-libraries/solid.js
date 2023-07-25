import {
  createRoot,
  createRenderEffect,
  createEffect,
  onCleanup,
  createSignal,
  createMemo,
  untrack,
} from 'solid-js'

import { setReactiveLibrary } from '../index.js'

setReactiveLibrary({
  root: createRoot,
  renderEffect: createRenderEffect,
  effect: createEffect,
  cleanup: onCleanup,
  signal: createSignal,
  memo: createMemo,
  untrack: untrack,
})

export * from '../index.js'
export * from '../components.js'
