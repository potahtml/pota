// allows to tell a `signal function` from a `component function`
// signals and user functions go in effects, for reactivity
// components and callbacks are untracked and wont go in effects to avoid re-rendering

import { $component } from '#comp'

export function markComponent(fn) {
	fn[$component] = null
	return fn
}
