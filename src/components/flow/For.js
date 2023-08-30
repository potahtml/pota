import { memo, ReactiveMap, makeCallback } from '#main'

export function For(props, children) {
	const callback = makeCallback(children)
	return memo(() => new ReactiveMap(props.each, callback))
}
