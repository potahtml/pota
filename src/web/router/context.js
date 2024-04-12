import { signal, memo } from '../../lib/reactivity/reactive.js'
import { nothing, removeFromArray } from '../../lib/std/@main.js'
import { context } from '../../renderer/@main.js'

const show = () => false

export function create(props = nothing) {
	const [children, setChildren, updateChildren] = signal([])

	return {
		base: '', // the composed base route
		href: () => '', // the url of the route
		parent: undefined, // parent context
		show, // if the route is shown
		scrolls: [], // elements to scroll
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

Context.beforeLeave = []
