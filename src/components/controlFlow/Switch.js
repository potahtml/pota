import {
  children,
  getValue,
  hasValue,
  lazyMemo,
  makeCallback,
  memo,
  resolve,
} from '#main'

export function Match(props) {
  return props
}

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
