import { empty } from '#std'

// usage functionState(fn(state){...}, {state})
// usage functionState({state}, fn(state){...})

export function functionState(fn, state = empty()) {
	return (fn.bind ? fn : state).bind(null, fn.bind ? state : fn)
}
