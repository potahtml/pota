// setup
import $, { root, effect, cleanup, memo, untrack, context } from 'oby'

import { setReactiveLibrary, children } from '#main'

setReactiveLibrary({
	root: root,
	renderEffect: v => effect(v, { sync: 'init' }),
	effect: v => effect(v, { sync: 'init' }),
	cleanup: cleanup,
	signal: (v, equals) => {
		const s = $(v, equals)
		return [s, s]
	},
	memo: memo,
	untrack: untrack,
	createContext: defaultValue => {
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
