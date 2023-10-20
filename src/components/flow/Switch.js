import {
  memo,
  children,
  lazyMemo,
  resolve,
  makeCallback,
} from '#main'

import { getValue, isNullUndefined } from '#std'

/**
 * Renders the first child that matches the given `when` condition, or
 * a fallback in case of no match
 *
 * @param {object} props
 * @param {pota.children} [props.children]
 * @param {pota.children} [props.fallback]
 * @returns {pota.children}
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
 * @param {pota.when} props.when
 * @param {pota.children} [props.children]
 * @returns {pota.children}
 */
export function Match(props) {
  return props
}
