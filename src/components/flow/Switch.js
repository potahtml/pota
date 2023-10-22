import { memo, children, resolve, lazyMemo } from '#primitives'
import { makeCallback } from '#comp'
import { getValue, isNullUndefined } from '#std'

/**
 * Renders the first child that matches the given `when` condition, or
 * a fallback in case of no match
 *
 * @param {object} props
 * @param {pota.Children} [props.children]
 * @param {pota.Children} [props.fallback]
 * @returns {pota.Children}
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
 * @param {pota.When} props.when
 * @param {pota.Children} [props.children]
 * @returns {pota.Children}
 */
export function Match(props) {
  return props
}
