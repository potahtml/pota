import { memo, signal } from '../../lib/reactive.js'
import { nothing, optional } from '../../lib/std.js'

import { addListeners, location } from '../../use/location.js'
import { paramsRegExp, replaceParams } from '../../use/url.js'

import { Collapse } from '../Collapse.js'
import { Dynamic } from '../Dynamic.js'
import { Show } from '../Show.js'

import { Component } from '../../core/renderer.js'
import { onDone } from '../../core/scheduler.js'

import { useRoute, create } from './context.js'
import { scroll } from './scroll.js'

/**
 * @typedef {Object} RouteProps
 * @property {string} path - Path to match relative to the parent
 *   Route. When `path` is missing, it will render only when the
 *   parent's route path is matched exactly.
 * @property {string[] | string} scroll - Elements to scroll when the
 *   route matches.
 * @property {Record<string, string>} params - Key-value pairs params
 *   to encode and replace on the path.
 * @property {When<any>} collapse - To hide the route instead of
 *   removing it from the document.
 * @property {When<any>} when - To stop rendering the route even if
 *   the path matches.
 * @property {Children} fallback - Fallback children.
 * @property {Children} children - Children to render.
 */

/**
 * Renders children if the path matches the current location
 *
 * @param {Partial<RouteProps>} props
 * @returns {Children}
 * @url https://pota.quack.uy/Components/Route/Route
 */
export function Route(props) {
	addListeners()

	const parent = useRoute()

	const path = props.path

	// this concatenates our route to the parent route
	const base =
		// base +
		(parent.base === undefined
			? location.protocol === 'file:'
				? location.pathname() // when is `file:` protocol, it defaults to `pathname`
				: ''
			: parent.base) +
		// path +
		replaceParams(
			/**
			 * 1. When `<Route>` lacks a `path` prop, is treated as the final
			 *    route
			 * 2. Ends with nothing or has a hash followed of stuff
			 * 3. Allow hash so people can scroll to stuff
			 */
			path === undefined ? '(|#.*)$' : path.replace(/\$$/, '(|#.*)$'),
			props.params,
		)

	const route = new RegExp(
		'^' + base.replace(paramsRegExp, '(?<$1>[^/#]+)'),
	)

	let href = ''
	const [params, setParams] = signal(() => nothing)

	const show = memo(() => {
		const path = location.path()

		// console.log(path, route)

		if (route.test(path)) {
			setParams(() => route.exec(path)?.groups || nothing)

			if (href === '') {
				href =
					location.origin + path.replace(path.replace(route, ''), '')
			}

			onDone(() => scroll(context))

			return true
		}
	})

	const context = create({
		base,
		href: () => href,
		params,
		scroll: props.scroll,
		parent,
		show,
	})

	parent.addChild(context)

	return Component(useRoute.Provider, {
		value: context,
		children: Component(Dynamic, {
			component: props.collapse ? Collapse : Show,
			when: () => show() && optional(props.when),
			fallback: props.fallback,
			children: props.children,
		}),
	})
}

/**
 * Renders children when no sibling `Route` matches
 *
 * @param {object} props
 * @param {Children} [props.children]
 * @returns {Children}
 */
Route.Default = props => {
	return Component(Show, {
		when: useRoute().shouldShowDefault,
		children: props.children,
	})
}
