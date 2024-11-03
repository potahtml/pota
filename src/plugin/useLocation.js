import { memo, signal } from '../lib/reactive.js'
import {
	document,
	empty,
	entries,
	history,
	nothing,
	optional,
	origin,
	preventDefault,
	walkParents,
	location as wLocation,
} from '../lib/std.js'

import { scrollToSelectorWithFallback } from './useScroll.js'

import {
	decodeURIComponent,
	isExternal,
	replaceParams,
} from './useURL.js'

import { Context } from '../web/router/context.js'
import { useTimeout } from './useTimeout.js'

// window.location signal

const [getLocation, setLocation] = signal(wLocation, {
	equals: false,
})

// only trigger on what changed

const pathname = memo(() => getLocation().pathname)
const search = memo(() => getLocation().search)
const href = memo(() => getLocation().href)

// http://location/# reports hash to be empty
// http://location/ reports hash to be empty
// handle this difference by checking if "#" is at the end of `href`
const hash = memo(() =>
	href().endsWith('#') ? '#' : getLocation().hash,
)

/**
 * @typedef {object} location
 * @property {Signal} href - The full url
 * @property {Signal} pathname - Mirror of window.location.pathname
 * @property {Signal} hash - Everything after #
 * @property {Signal} path - Pathname + hash
 * @property {Signal} query - Key value pairs with search params
 * @property {Function} params - Key value pairs with route params
 */

/** @type location */
export const location = {
	href,
	pathname,
	hash,
	path: memo(() => pathname() + hash()),
	query: memo(() => {
		const value = search()
		const searchParams = empty()
		const params = new URL(origin + '/' + value).searchParams
		for (const [key, value] of params.entries()) {
			searchParams[key] = value
		}
		return searchParams
	}),
	params: () => {
		const routes = []
		walkParents(Context(), 'parent', context => {
			routes.push(context.params)
		})
		const params = empty()

		for (const param of routes) {
			// `|| params` because when nothing is found the result is undefined
			for (const [key, value] of entries(param()() || nothing)) {
				params[key] =
					value !== undefined ? decodeURIComponent(value) : value
			}
		}
		return params
	},
}

let BeforeLeave = []

/**
 * Run code before leaving the route, return or resolve to false to
 * reject, return true to continue
 *
 * @param {Function | Promise<unknown>} callback - Run before leaving
 *   the route
 * @url https://pota.quack.uy/Components/Router/useBeforeLeave
 */
export const useBeforeLeave = callback => {
	addListeners()

	BeforeLeave.push({
		href: Context().href() || wLocation.href,
		callback,
	})
}

/**
 * Returns a boolean telling if navigation is allowed
 *
 * @param {string} href
 * @returns {Promise<boolean>}
 */
async function canNavigate(href) {
	const newBeforeLeave = []
	for (const beforeLeave of BeforeLeave) {
		if (href.indexOf(beforeLeave.href) !== 0) {
			if (!(await beforeLeave.callback().catch(() => false)))
				return false
		} else {
			newBeforeLeave.push(beforeLeave)
		}
	}
	BeforeLeave = newBeforeLeave
	return true
}

/**
 * Navigates to a new location
 *
 * @param {string} href
 * @param {{ scroll?: boolean; replace?: boolean }} options
 * @url https://pota.quack.uy/Components/Router/Navigate
 */
async function navigate(href, options = nothing) {
	if (wLocation.href !== href) {
		if (await canNavigate(href)) {
			const fn = () => navigateInternal(href, options)
			// navigate with transition if available
			document.startViewTransition &&
			wLocation.href.replace(/#.*/, '') !== href.replace(/#.*/, '')
				? document.startViewTransition(fn)
				: fn()
		}
	}
}

function navigateInternal(href, options) {
	if (options.replace) {
		history.replaceState(null, '', href)
	} else {
		history.pushState(null, '', href)
	}
	setLocation(wLocation)

	if (optional(options.scroll)) {
		scrollToSelectorWithFallback(wLocation.hash)
	}
}

/**
 * Navigates to a new location programmatically
 *
 * @param {string} href
 * @param {{
 * 	params?: object
 * 	scroll?: boolean
 * 	replace?: boolean
 * 	delay?: number
 * }} options
 * @url https://pota.quack.uy/Components/Router/Navigate
 */
function navigateUser(href, options = nothing) {
	addListeners()

	href = replaceParams(href, options.params)

	/**
	 * When the user provides the url, it may pass a relative path, this
	 * makes it absolute
	 */
	href = href.startsWith('http')
		? href
		: new URL(href, wLocation.href).href

	const nav = () => navigate(href, options)

	options.delay ? useTimeout(nav, options.delay).start() : nav()
}
export { navigateUser as navigate }

/**
 * Navigates to a new location from JSX
 *
 * @param {{
 * 	href: string
 * 	scroll?: boolean
 * 	replace?: boolean
 * 	params?: object
 * 	delay?: number
 * }} props
 * @url https://pota.quack.uy/Components/Router/Navigate
 */
export function Navigate(props) {
	addListeners()
	navigateUser(props.href, props)
	return props.children
}

// listeners

let addListenersAdded = false

export function addListeners() {
	if (!addListenersAdded) {
		addListenersAdded = true

		document.addEventListener('click', onLinkClick)

		addEventListener('hashchange', onLocationChange)
		addEventListener('popstate', onLocationChange)
	}
}

// listen when using browser buttons
// safe to use async as its on a listener
async function onLocationChange() {
	// chrome has a bug on which if you use the back/forward button
	// it will change the title of the tab to whatever it was before
	// if the navigation is prevented (therefore the title/page wont change)
	// it will still use the old title even if the title tag didn't change at all
	const title = document.title
	document.title = title + ' '
	document.title = title

	if (await canNavigate(wLocation.href)) {
		setLocation(wLocation)
	} else {
		history.pushState(null, '', location.href())
	}
}

function onLinkClick(e) {
	if (
		e.defaultPrevented ||
		e.button !== 0 ||
		e.metaKey ||
		e.altKey ||
		e.ctrlKey ||
		e.shiftKey
	)
		return

	// find link
	const node = e
		.composedPath()
		.find(item => item instanceof HTMLAnchorElement)

	// validate
	if (
		!node ||
		!node.href ||
		node.download ||
		node.target ||
		!node.href.startsWith('http') || // when using other protocol than "http"
		isExternal(node.href) ||
		(node.rel && node.rel.split(/\s/).includes('external'))
	)
		return

	preventDefault(e)

	navigate(node.href, {
		replace: node.replace,
	})
}
