import {
  memo,
  children,
  lazyMemo,
  resolve,
  makeCallback,
} from '#main'

import { hasValue, getValue } from '#std'

export function Switch(props) {
  const childrens = children(() => props.children)

  const fallback = hasValue(props.fallback)
    ? lazyMemo(() => resolve(props.fallback))
    : () => null

  const match = memo(() =>
    childrens().find(match => !!getValue(match.when)),
  )
  const value = memo(() => match() && getValue(match().when))
  const callback = memo(
    () => match() && makeCallback(match().children),
  )
  return memo(() => (match() ? callback()(value) : fallback))
}

export function Match(props) {
  return props
}
