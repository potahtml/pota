// I dont undertand why I need to import it like this
/*
import $ from '../../node_modules/oby/dist/index.js'

export const createRoot = fn => $.root(fn)
export const createEffect = fn => $.effect(fn, { sync: 'init' })
export const onCleanup = fn => $.cleanup(fn)
export const createMemo = fn => $.memo(fn)
export const untrack = fn => $.untrack(fn)
export const createSignal = v => {
  const s = $(v)
  return [s, s]
}

*/

import { createSignal } from './flimsy.js'

export {
  createRoot,
  createEffect,
  onCleanup,
  createMemo,
  createSignal,
  untrack,
} from './flimsy.js'

export function Signal(v) {
  let [read, write] = createSignal(v)
  return v => {
    return v === undefined ? read() : write(v)
  }
}
