import { memo, MapArray, makeCallback } from '#main'

export function For(props, children) {
	const callback = makeCallback(children)
	return memo(() => new MapArray(props.each, callback))
}
