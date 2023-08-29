import { cleanup, memo, Show, Dynamic, Collapse } from '#main'

// utils
import { optional } from '#std'
import { replaceParams } from '#urls'

// local
import { Context, create } from './context.js'
import { location } from './location.js'
import { setParams } from './useParams.js'

// route
const origin = window.location.origin

export function Route(props) {
	const parent = Context()

	const path = parent.base + replaceParams(props.path, props.params)
	const route = new RegExp(
		'^' + path.replace(/\:([a-z0-9_\-]+)/gi, '(?<$1>.+)'),
	)

	let href = ''

	// derived value
	const show = memo(() => {
		const path = location.path()

		if (route.test(path)) {
			setParams(() => () => route.exec(path).groups)

			if (href === '') {
				href = path.replace(path.replace(route, ''), '')
				href = origin + (href[0] !== '/' ? '/' : '') + href
			}
			return true
		} else {
			return false
		}
	})

	const context = create({
		base: path,
		get href() {
			return href
		},
		route,
		parent,
		show,
	})

	parent.addChildren(context)
	cleanup(() => parent.removeChildren(context))

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
