import { cleanup, memo, Show, Dynamic, Collapse } from '#main'

// utils
import { optional } from '#std'
import { replaceParams, origin } from '#urls'

// local
import { Context, create } from './context.js'
import { location } from './location.js'
import { setParams } from './useParams.js'

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
			return true
		} else {
			return false
		}
	})

	const context = create({
		base, // the prefix for the children path
		href: () => href, // the full url of the root
		route, // the regexp for params
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

Route.Default = function Default(props) {
	const context = Context()
	return (
		<Show
			when={context.noneMatch}
			children={props.children}
		/>
	)
}
