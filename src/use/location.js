import { memo, signal } from '../lib/reactive.js'
import { mutable, replace } from '../lib/store.js'
import {
	empty,
	entries,
	freeze,
	fromEntries,
	history,
	nothing,
	optional,
	location as wLocation,
} from '../lib/std.js'

import { scrollToSelectorWithFallback } from './scroll.js'
import {
	decodeURIComponent,
	isAbsolute,
	isExternal,
	removeNestedProtocol,
	replaceParams,
} from './url.js'
import { useTimeout } from './time.js'

import { RouteContext } from '../components/route/context.js'
import { document } from './dom.js'
import { preventDefault } from './event.js'

// window.location signal

const [getLocation, setLocation] = signal(wLocation.href)

// only trigger on what changed
const locationObject = memo(
	() => new URL(removeNestedProtocol(getLocation())),
)
const href = memo(() => locationObject().href)
const pathname = memo(() => locationObject().pathname)
// http://location/# reports hash to be empty
// http://location/ reports hash to be empty
const hash = memo(() => locationObject().hash || '#')
const path = memo(() => pathname() + hash())
const search = memo(() => locationObject().search)

const searchParams = mutable(
	/** @type {Record<PropertyKey, string>} */ ({}),
)
const searchParamsMemo = memo(() => {
	const entries = fromEntries(locationObject().searchParams.entries())

	replace(searchParams, entries)

	return entries
})
searchParamsMemo()

const params = mutable(
	/** @type {Record<PropertyKey, string>} */ ({}),
)
const paramsMemo = memo(() => {
	const values = empty()

	RouteContext.walk(context => {
		for (const [key, value] of entries(context.params()())) {
			values[key] =
				value !== undefined
					? decodeURIComponent(/** @type {string} */ (value))
					: value
		}
	})

	replace(params, values)

	return values
})
paramsMemo()

export const location = freeze({
	protocol: locationObject().protocol,
	origin: locationObject().origin,
	//
	href,
	pathname,
	path,
	hash,
	search,
	searchParams,
	// searchParamsMemo,
	params,
	// paramsMemo,
})

let BeforeLeave = []

/**
 * Run code before leaving the route, return or resolve to false to
 * reject, return true to continue
 *
 * @param {Function | Promise<unknown>} cb - Run before leaving the
 *   route
 * @url https://pota.quack.uy/Components/Route/useBeforeLeave
 */
export const useBeforeLeave = cb => {
	addListeners()

	BeforeLeave.push({
		href: RouteContext().href() || wLocation.href,
		cb,
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
			if (!(await beforeLeave.cb().catch(() => false))) {
				return false
			}
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
 * @param {{
 * 	scroll?: boolean
 * 	replace?: boolean
 * }} options
 * @url https://pota.quack.uy/Components/Route/Navigate
 */
async function navigate(href, options = nothing) {
	if (wLocation.href !== href) {
		if (await canNavigate(href)) {
			const fn = () => navigateInternal(href, options)
			const transition =
				document.startViewTransition &&
				document.startViewTransition.bind(document)
			// navigate with transition if available
			transition &&
			wLocation.href.replace(/#.*/, '') !== href.replace(/#.*/, '')
				? transition(fn)
				: fn()
		}
	}
}

/**
 * Internal navigation function that updates history and location
 *
 * @param {string} href - The URL to navigate to
 * @param {{ replace?: boolean; scroll?: boolean }} options -
 *   Navigation options
 */
function navigateInternal(href, options) {
	options.replace
		? history.replaceState(null, '', href)
		: history.pushState(null, '', href)

	setLocation(wLocation.href)

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
 * @url https://pota.quack.uy/Components/Route/Navigate
 */
function navigateUser(href, options = nothing) {
	addListeners()

	href = replaceParams(href, options.params)

	/**
	 * When the user provides the url, it may pass a relative path, this
	 * makes it absolute
	 */
	href = isAbsolute(href) ? href : new URL(href, wLocation.href).href

	const nav = () => navigate(href, options)

	options.delay ? useTimeout(nav, options.delay).start() : nav()
}
export { navigateUser as navigate }

// listeners

let addListenersAdded = false

/**
 * Adds event listeners for client-side navigation. Only adds
 * listeners once to prevent duplicate handlers
 */
export function addListeners() {
	if (!addListenersAdded) {
		addListenersAdded = true

		document.addEventListener('click', onLinkClick)

		addEventListener('hashchange', onLocationChange)
		addEventListener('popstate', onLocationChange)
	}
}

/**
 * Handles browser history changes (back/forward buttons) Fixes Chrome
 * title bug and ensures navigation is allowed
 *
 * @returns {Promise<void>}
 */
async function onLocationChange() {
	// chrome has a bug on which if you use the back/forward button
	// it will change the title of the tab to whatever it was before
	// if the navigation is prevented (therefore the title/page wont change)
	// it will still use the old title even if the title tag didn't change at all
	const title = document.title
	document.title = title + ' '
	document.title = title

	if (await canNavigate(wLocation.href)) {
		setLocation(wLocation.href)
	} else {
		history.pushState(null, '', location.href())
	}
}

/**
 * Handles click events on anchor elements to enable client-side
 * navigation
 *
 * @param {MouseEvent} e - The click event
 */
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
		isExternal(node.href) ||
		node.rel.includes('external')
	) {
		return
	}

	preventDefault(e)

	navigate(node.href, {
		replace: node.hasAttribute('replace'),
	})
}
