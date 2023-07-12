/*
import $ from '../../node_modules/oby/dist/index.js'

export const createRoot = fn => $.root(fn)
export const createEffect = fn => $.effect(fn)
export const onCleanup = fn => $.cleanup(fn)
export const createMemo = fn => $.memo(fn)
export const createSignal = v => {
  const s = $(v)
  return [s, s]
}
*/

export {
  createRoot,
  createEffect,
  onCleanup,
  createMemo,
  createSignal,
} from './flimsy.js'
