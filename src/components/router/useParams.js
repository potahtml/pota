import { lazyMemo, signal } from '#main'

// utils
import { proxy } from '#reactivity'
import { empty, entries } from '#std'
import { decodeURIComponent } from '#urls'

const [getParams, setParams] = signal(() => empty())

export { setParams }

const params = lazyMemo(() => {
	const params = empty()
	for (const [key, value] of entries(getParams()())) {
		params[key] =
			value !== undefined ? decodeURIComponent(value) : value
	}
	return params
})

export function useParams() {
	return proxy(params)
}
