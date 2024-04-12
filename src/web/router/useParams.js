import { proxy } from '../../lib/reactivity/proxy.js'
import { empty, entries } from '../../lib/std/@main.js'
import {
	signal,
	memo,
} from '../../lib/reactivity/reactive.js'
import { decodeURIComponent } from '../../lib/urls/@main.js'

const [getParams, setParams] = signal(() => empty())

export { setParams }

const params = memo(() => {
	const params = empty()
	// `|| params` because when nothing is found the result is undefined
	for (const [key, value] of entries(getParams()() || params)) {
		params[key] =
			value !== undefined ? decodeURIComponent(value) : value
	}
	return params
})

export const useParams = () => proxy(params)
