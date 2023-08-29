import { signal, lazyMemo } from '#main'
import { context } from '#reactivity'
import { empty, removeFromArray } from '#std'

function show() {
	return false
}
export function create(props = empty()) {
	const [children, setChildren] = signal([])

	return {
		base: '', // the composed base route
		href: '', // the url of the route
		route: '', // the regular expresion of this route
		parent: null, // parent context
		show, // if the route is shown
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
		// overide
		...props,
	}
}

export const Context = context(create())

Context.beforeLeave = []
