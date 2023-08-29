import { signal, lazyMemo } from '#main'
import { assign, empty } from '#std'

// local
import { canNavigate } from './useBeforeLeave.js'

// window.location signal

const [getLocation, setLocation] = signal(window.location, {
	equals: false,
})

function setLocation2(a) {
	console.log('setting location', a)
	setLocation(a)
}
export { setLocation2 as setLocation }

// only trigger on what changed
const hash = lazyMemo(() => getLocation().hash)
const pathname = lazyMemo(() => getLocation().pathname)
const search = lazyMemo(() => getLocation().search)
const href = lazyMemo(() => getLocation().href)

// query params is resolved once
let queryParams
let querySearch = ''
const origin = window.location.origin
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

export function useLocation() {
	return location
}

// listen when using browser buttons

const state = { ignore: false }

async function onLocationChange() {
	/* if (state.ignore) {
			console.log('ignoring')
			state.ignore = false
		} else {*/
	// chrome has a bug on which if you use the back/forward button
	// it will change the title of the tab to whatever it was before
	// if the navigation is prevented (therefore the title/page wont change)
	// it will still use the old title even if the title tag didnt change at all
	const title = document.title
	document.title = title + ' '
	document.title = title

	if (await canNavigate(window.location.href)) {
		setLocation(window.location)
	} else {
		/* state.ignore = true
		 */ console.log(
			'going back to',
			location.href(),
			'from0',
			getLocation().href,
		)
		window.history.pushState(null, '', location.href())
	}
	/*}*/
}

addEventListener('hashchange', onLocationChange)
addEventListener('popstate', onLocationChange)
