import { makeCallback, memo, resolve } from '../lib/reactive.js'
import {
  getValue,
  identity,
  isArray,
  isNullUndefined,
} from '../lib/std.js'

/**
 * Renders the first child that matches the given `when` condition, or
 * a fallback in case of no match
 *
 * @param {object} props
 * @param {Children} [props.children]
 * @param {Children} [props.fallback]
 * @returns {Children}
 * @url https://pota.quack.uy/Components/Switch
 */
export function Switch(props) {
  const matches = resolve(() =>
    isArray(props.children) ? props.children : [props.children],
  )

  const fallback = isNullUndefined(props.fallback)
    ? memo(() => {
        const r = matches().find(match => !('when' in match))
        return r && r.children
      })
    : memo(() => resolve(props.fallback))

  const match = memo(() =>
    matches().find(match => !!getValue(match.when)),
  )

  const value = memo(() => match() && getValue(match().when))

  const callback = memo(
    () => match() && makeCallback(match().children),
  )
  return memo(() => (match() ? callback()(value) : fallback))
}

/**
 * Renders the content if the `when` condition is true
 *
 * @template T
 * @param {object} props
 * @param {When<T>} props.when
 * @param {Children} [props.children]
 * @returns {Children}
 */
export const Match = identity
