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

import { setReactiveLibrary, children, markReactive } from '#main'

setReactiveLibrary({
	root: root,
	renderEffect: v => effect(v, { sync: 'init' }),
	effect: v => effect(v, { sync: 'init' }),
	cleanup: cleanup,
	signal: (v, equals) => {
		const s = $(v, equals)
		markReactive(s)
		return [s, s]
	},
	memo: (a, b) => {
		const r = memo(a, b)
		markReactive(r)
		return r
	},
	untrack: untrack,
	batch: batch,
	context: defaultValue => {
		const id = Symbol()
		return {
			id,
			defaultValue,
			Provider: function (props) {
				let r
				effect(
					() =>
						(r = /*untrack*/ () => {
							context({ [id]: props.value })
							return children(() => props.children)
						}),
					{ sync: 'init' },
				)
				return r
			},
		}
	},
	useContext: v => {
		const c = context(v.id)
		return c ?? v.defaultValue
	},
})

// export
export * from '#main'
