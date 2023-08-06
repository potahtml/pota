// For
import { makeCallback, memo, MapArray, getValue } from '#main'

export function For(props, children) {
	const callback = makeCallback(children)
	return memo(() => new MapArray(props.each, callback))
}
