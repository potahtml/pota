/// <Reference path="./context.js.d.ts"/>

import { cleanup, memo, signal } from '../../lib/reactive.js'
import { nothing, removeFromArray } from '../../lib/std.js'

import { context } from '../../core/renderer.js'
import { isAbsolute } from '../../plugin/useURL.js'

/**
 * @param {Partial<RouteContextValue>} props
 * @returns {RouteContextValue}
 */
export function create(props) {
	const [children, _, updateChildren] = signal([])

	return {
		// the composed base route
		base: undefined,
		href: () => '', // the url of the route
		parent: undefined, // parent context
		show: undefined, // if the route is shown
		params: () => () => nothing, // params of the route
		scroll: undefined, // elements to scroll
		// the children routes
		addChild(child) {
			updateChildren(children => {
				children.push(child)
				return [...children]
			})
			cleanup(() =>
				updateChildren(children => {
					removeFromArray(children, child)
					return [...children]
				}),
			)
		},
		shouldShowDefault: memo(() => {
			const child = children()
			return (
				// when it has siblings, check if at least 1 rendered
				// `every` instead of `some`, needs to read the signal for tracking
				child.length && child.every(child => !child.show())
			)
		}),
		resolve(href) {
			// link is relative to the `<Route>`
			const base = this.href()
			return isAbsolute(href)
				? href
				: // making link dos/ relative to http://localhost:11433/#uno/
					// becomes http://localhost:11433/#uno/dos/
					// this should be window.location.protocol
					(location.protocol === 'blob:' ? 'blob:' : '') +
						(base.includes('#')
							? base + href
							: new URL(href, base).href)
		},
		// override
		...props,
	}
}

export const RouteContext = context(create(nothing))
