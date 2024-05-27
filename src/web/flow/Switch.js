import { memo } from '../../lib/reactivity/reactive.js'
import { resolve } from '../../renderer/@main.js'
import { getValue, isNullUndefined } from '../../lib/std/@main.js'
import { makeCallback } from '../../lib/component/makeCallback.js'
import { identity } from '../../lib/std/identity.js'

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
  const matches = resolve(() => props.children)

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
 * @param {object} props
 * @param {When} props.when
 * @param {Children} [props.children]
 * @returns {Children}
 */
export const Match = identity
