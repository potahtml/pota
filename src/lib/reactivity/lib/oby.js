// setup
import $, {
	root,
	effect,
	cleanup,
	memo,
	untrack,
	context,
	batch,
} from 'oby'

const _effect = v => effect(v)
const renderEffect = v => effect(v, { sync: 'init' })
const signal = (a, b) => {
	const s = $(a, b)
	return [markReactive(() => s()), s]
}
const _memo = (a, b) => markReactive(memo(a, b))

const _context = defaultValue => {
	const id = Symbol()
	return {
		id,
		defaultValue,
		Provider: function (props) {
			let r
			renderEffect(
				() =>
					(r = untrack(() => {
						context({ [id]: props.value })
						return children(() => props.children)
					})),
			)
			return r
		},
	}
}
const useContext = v => {
	const c = context(v.id)
	return c ?? v.defaultValue
}

export {
	root,
	renderEffect,
	_effect as effect,
	cleanup,
	signal,
	_memo as memo,
	untrack,
	batch,
	_context as context,
	useContext,
}

import { children } from '#main'
import { markReactive } from '#reactivity'
