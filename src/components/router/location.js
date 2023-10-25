import { origin } from '../../lib/urls/@main.js'
import { signal, memo, lazyMemo } from '../../lib/reactivity/primitives/solid.js'
import { assign, empty } from '../../lib/std/@main.js'

// local
import { canNavigate } from './useBeforeLeave.js'

// window.location signal

const [getLocation, setLocation] = signal(window.location, {
	equals: false,
})

export { setLocation }

// only trigger on what changed

const pathname = memo(() => getLocation().pathname)
const search = lazyMemo(() => getLocation().search)
const href = memo(() => getLocation().href)
// http://location/# reports hash to be empty
// http://location/ reports hash to be empty
// handle this difference by checking if "#" is at the end of `href`
const hash = memo(() =>
	href().endsWith('#') ? '#' : getLocation().hash,
)

// query params is resolved once
let queryParams = empty()
let querySearch = ''

/**
 * @typedef {Object} location
 * @property {Signal} hash - Everything after #
 * @property {Signal} href - The full url
 * @property {Signal} pathname - Mirror of
 *   window.location.pathname
 * @property {Signal} path - Pathname + hash
 * @property {Signal} query - Key value pairs with params
 */

/** @type location */
export const location = assign(empty(), {
	hash,
	pathname,
	path: () => pathname() + hash(),
	query: () => {
		const value = search() // track
		// run queryParams only once
		if (querySearch !== value) {
			querySearch = value
			queryParams = empty()

			const params = new URL(origin + '/' + value).searchParams

			for (const [key, value] of params.entries()) {
				queryParams[key] = value
			}
		}
		return queryParams
	},
	href,
})

/**
 * Returns location data in a reactive object
 *
 * @returns Location
 */
export function useLocation() {
	return location
}

// listen when using browser buttons

async function onLocationChange() {
	// chrome has a bug on which if you use the back/forward button
	// it will change the title of the tab to whatever it was before
	// if the navigation is prevented (therefore the title/page wont change)
	// it will still use the old title even if the title tag didn't change at all
	const title = document.title
	document.title = title + ' '
	document.title = title

	if (await canNavigate(window.location.href)) {
		setLocation(window.location)
	} else {
		window.history.pushState(null, '', location.href())
	}
}

addEventListener('hashchange', onLocationChange)
addEventListener('popstate', onLocationChange)
