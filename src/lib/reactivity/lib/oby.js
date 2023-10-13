import { markReactive } from '#reactivity'
import { children } from '#main'
import { empty } from '#std'

import $, {
	root,
	effect,
	cleanup,
	memo,
	untrack,
	batch,
	context,
} from 'oby'

const renderEffect = v => effect(v, { sync: 'init' })

const signal = (a, b) => {
	const s = $(a, b)
	return [markReactive(() => s()), s]
}

const _memo = (a, b) => markReactive(memo(a, b))

function _context(defaultValue = empty()) {
	const id = Symbol('context')

	function Context(newValue, fn) {
		if (newValue === undefined) {
			const c = context(id)
			return c ?? defaultValue
		} else {
			let r
			context({ [id]: newValue }, () => {
				r = untrack(fn)
			})
			return r
		}
	}
	Context.Provider = props =>
		Context(props.value, () => children(() => props.children))

	return Context
}

export {
	root,
	renderEffect,
	effect,
	cleanup,
	signal,
	_memo as memo,
	_context as context,
	untrack,
	batch,
}
