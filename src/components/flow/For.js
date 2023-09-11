import { memo, ReactiveMap, makeCallback } from '#main'

export function For(props) {
	const callback = makeCallback(props.children)
	return memo(() => new ReactiveMap(props.each, callback))
}
