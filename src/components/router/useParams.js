import { proxy } from '../../lib/reactivity/@main.js'
import { empty, entries } from '../../lib/std/@main.js'
import { signal, lazyMemo } from '../../lib/reactivity/primitives/solid.js'
import { decodeURIComponent } from '../../lib/urls/@main.js'

const [getParams, setParams] = signal(() => empty())

export { setParams }

const params = lazyMemo(() => {
	const params = empty()
	// `|| params` because when nothing is found the result is undefined
	for (const [key, value] of entries(getParams()() || params)) {
		params[key] =
			value !== undefined ? decodeURIComponent(value) : value
	}
	return params
})

export function useParams() {
	return proxy(params)
}
