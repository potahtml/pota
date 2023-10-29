import {
	signal,
	lazyMemo,
} from '../../lib/reactivity/primitives/solid.js'
import { empty, removeFromArray } from '../../lib/std/@main.js'
import { context } from '../../renderer/@main.js'

function show() {
	return false
}
export function create(props = empty()) {
	const [children, setChildren] = signal([])

	return {
		base: '', // the composed base route
		href: () => '', // the url of the route
		parent: null, // parent context
		show, // if the route is shown
		scrolls: [], // elements to scroll
		// the children routes
		addChildren: child => {
			setChildren(children => {
				children.push(child)
				return [...children]
			})
		},
		removeChildren: child => {
			setChildren(children => {
				removeFromArray(children, child)
				return [...children]
			})
		},
		noneMatch: lazyMemo(() => {
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

Context.beforeLeave = []
