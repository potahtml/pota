import { Show, Dynamic, Collapse } from '../flow/@main.js'
import {
	cleanup,
	memo,
} from '../../lib/reactivity/primitives/solid.js'
import { scrollToSelectorWithFallback } from '../../lib/scroll/@main.js'

// utils
import { optional } from '../../lib/std/@main.js'
import { replaceParams, origin } from '../../lib/urls/@main.js'

// local
import { Context, create } from './context.js'
import { location } from './location.js'
import { setParams } from './useParams.js'
import { onRender } from '../../renderer/scheduler.js'

/**
 * Renders children if the path matches the current location
 *
 * @param {object} props
 * @param {string} [props.path] - Path to match relative to the parent
 *   Route. When `path` is missing, it will render only when the
 *   parent's route path is matched exactly.
 * @param {string[]} [props.scrolls] - Elements to scroll when the
 *   route matches
 * @param {object} [props.params] - Key-value pairs params to encode
 *   and replace on the path
 * @param {When} [props.collapse] - To hide the route instead of
 *   removing it from the document
 * @param {When} [props.when] - To stop rendering the route even if
 *   the path matches.
 * @param {Children} [props.fallback] - Fallback for when a `when`
 *   condition is set. If the `when` condition is not set, this wont
 *   be used.
 * @param {Children} [props.children]
 * @returns {Children}
 */
export function Route(props) {
	const parent = Context()

	const base =
		parent.base +
		replaceParams(
			// pathname always starts with /, make sure the hash is considered
			// when <Route lacks a path prop is treated as the final route
			props.path !== undefined ? props.path.replace(/^#/, '/#') : '$',
			props.params,
		)

	const route = new RegExp(
		'^' + base.replace(/\:([a-z0-9_\-]+)/gi, '(?<$1>.+)'),
	)

	let href = ''

	const scrolls = props.scrolls
		? parent.scrolls.concat(props.scrolls)
		: parent.scrolls

	const show = memo(() => {
		const path = location.path()
		if (route.test(path)) {
			setParams(() => () => route.exec(path).groups)

			if (href === '') {
				href = path.replace(path.replace(route, ''), '')
				// create full link
				href =
					// add origin
					origin +
					// add slash after origin if isnt present in the href
					(href[0] !== '/' ? '/' : '') +
					// add the path
					href
			}

			// scroll
			onRender(() => {
				// already rendered
				for (const item of scrolls) scrollToSelectorWithFallback(item)
				scrollToSelectorWithFallback(window.location.hash)
			})

			return true
		} else {
			return false
		}
	})

	const context = create({
		base, // the prefix for the children path
		href: () => href, // the full url of the route
		scrolls,
		parent,
		show,
	})

	parent.addChildren(context)

	cleanup(() => {
		parent.removeChildren(context)
	})

	return (
		<Context.Provider value={context}>
			<Dynamic
				component={props.collapse ? Collapse : Show}
				when={() => show() && optional(props.when)}
				fallback={props.fallback}
				children={props.children}
			/>
		</Context.Provider>
	)
}

/**
 * Renders children when no sibling `Route` matches
 *
 * @param {object} props
 * @param {Children} [props.children]
 * @returns {Children}
 */
Route.Default = props => {
	const context = Context()
	return (
		<Show
			when={context.noneMatch}
			children={props.children}
		/>
	)
}
