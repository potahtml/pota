import { memo, children, resolve, lazyMemo } from '../../lib/reactivity/primitives/solid.js'
import { makeCallback } from '../../lib/comp/@main.js'
import { getValue, isNullUndefined } from '../../lib/std/@main.js'

/**
 * Renders the first child that matches the given `when` condition, or
 * a fallback in case of no match
 *
 * @param {object} props
 * @param {Children} [props.children]
 * @param {Children} [props.fallback]
 * @returns {Children}
 */
export function Switch(props) {
  const childrens = children(() => props.children)

  const fallback = isNullUndefined(props.fallback)
    ? () => null
    : lazyMemo(() => resolve(props.fallback))

  const match = memo(() =>
    childrens().find(match => !!getValue(match.when)),
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
export function Match(props) {
  return props
}
