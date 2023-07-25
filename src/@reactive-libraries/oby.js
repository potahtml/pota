import $, { root, effect, cleanup, memo, untrack } from 'oby'

import { setReactiveLibrary } from '../index.js'

setReactiveLibrary({
  root: root,
  renderEffect: v => effect(v, { sync: 'init' }),
  effect: v => effect(v, { sync: 'init' }),
  cleanup: cleanup,
  signal: v => {
    const s = $(v)
    return [s, s]
  },
  memo: memo,
  untrack: untrack,
})

export * from '../index.js'
export * from '../components.js'
