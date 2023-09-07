import { lazyMemo, signal } from '#main'

// utils
import { proxy } from '#reactivity'
import { empty, entries } from '#std'
import { decodeURIComponent } from '#urls'

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
