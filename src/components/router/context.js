import { memo, signal } from '../../lib/reactive.js'
import { nothing, removeFromArray } from '../../lib/std.js'

import { context } from '../../renderer.js'

/* #__NO_SIDE_EFFECTS__ */ export function create(props = nothing) {
	const [children, setChildren, updateChildren] = signal([])

	return {
		base: '', // the composed base route
		href: () => '', // the url of the route
		parent: undefined, // parent context
		show: () => false, // if the route is shown
		params: () => () => nothing, // params of the route
		scroll: [], // elements to scroll
		// the children routes
		addChildren: child => {
			updateChildren(children => {
				children.push(child)
				return [...children]
			})
		},
		removeChildren: child => {
			updateChildren(children => {
				removeFromArray(children, child)
				return [...children]
			})
		},
		noneMatch: memo(() => {
			return (
				/**
				 * If doesnt have siblings then is not a 404
				 *
				 * @example
				 * 	<Route>
				 * 	<Component/> <Router.Default/> <-- Router.Default should never render
				 * 	</Route>
				 */
				children().length &&
				// when it has sibling, check if at least 1 rendered
				children().every(children => !children.show())
			)
		}),
		// override
		...props,
	}
}

export const Context = context(create())
