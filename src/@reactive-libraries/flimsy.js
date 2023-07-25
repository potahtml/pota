import * as reactivity from './lib/flimsy.js'

import { setReactiveLibrary } from 'pota'

export const root = reactivity.createRoot
export const renderEffect = reactivity.createEffect
export const effect = reactivity.createEffect
export const cleanup = reactivity.onCleanup
export const signal = reactivity.createSignal
export const memo = reactivity.createMemo
export const untrack = reactivity.untrack
export const isTracking = reactivity.isTracking

setReactiveLibrary({
  root,
  renderEffect,
  effect,
  cleanup,
  signal,
  memo,
  untrack,
  isTracking,
})

export * from 'pota'
