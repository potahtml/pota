import * as reactivity from 'oby'

import { setReactiveLibrary } from 'pota'

export const root = v => reactivity.root(v)
export const renderEffect = v =>
  reactivity.effect(v, { sync: 'init' })
export const effect = v => reactivity.effect(v, { sync: 'init' })
export const cleanup = v => reactivity.cleanup(v)
export const signal = v => {
  const s = reactivity.default(v)
  return [s, s]
}
export const memo = v => reactivity.memo(v)
export const untrack = v => reactivity.untrack(v)

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
