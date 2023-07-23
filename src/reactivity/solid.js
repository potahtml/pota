import {
  createRoot,
  createRenderEffect,
  createEffect,
  onCleanup,
  createSignal,
  createMemo,
  untrack,
} from 'solid-js'

import { setReactiveLibrary } from 'pota'

export const root = createRoot
export const renderEffect = createRenderEffect
export const effect = createEffect
export const cleanup = onCleanup
export const signal = createSignal
export const memo = createMemo
export { untrack }

setReactiveLibrary({
  root,
  renderEffect,
  effect,
  cleanup,
  signal,
  memo,
  untrack,
})

export * from 'pota'
