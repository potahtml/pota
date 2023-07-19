import * as reactivity from '../../../node_modules/solid-js/dist/solid.js'

import { setReactiveLibrary } from '../index.js'

export const root = reactivity.createRoot
export const renderEffect = reactivity.createRenderEffect
export const effect = reactivity.createEffect
export const cleanup = reactivity.onCleanup
export const signal = reactivity.createSignal
export const memo = reactivity.createMemo
export const untrack = reactivity.untrack

setReactiveLibrary({
  root,
  renderEffect,
  effect,
  cleanup,
  signal,
  memo,
  untrack,
})

export * from '../index.js'
