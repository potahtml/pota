// For
import { componentCallback, memo, MapArray } from '#main'

export function For(props, children) {
	const callback = componentCallback(children)
	return memo(() => new MapArray(props.each, callback))
}
