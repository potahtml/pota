import { context, signal, lazyMemo } from '#primitives'
import { empty, removeFromArray } from '#std'

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
		noneMatch: lazyMemo(() =>
			children().every(children => !children.show()),
		),
		// override
		...props,
	}
}

export const Context = context(create())

Context.beforeLeave = []
