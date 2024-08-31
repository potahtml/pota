import { global } from '../lib/std.js'

export const cleanLink = v => v.replace(/[\.,"]$/, '')

export const encodeURIComponent = global.encodeURIComponent

/**
 * Safe guard. `decodeURIComponent` will fail with malformed strings:
 * links are copied, pasted, manipulated by people, software etc
 *
 * @param {string} string - String to decode
 * @returns {string} Returns decoded string or original string on
 *   error
 */
function _decodeURIComponent(string) {
	try {
		return decodeURIComponent(string)
	} catch (e) {
		return string
	}
}
export { _decodeURIComponent as decodeURIComponent }

/**
 * Returns true if the link is absolute: starts with '/', '#' or
 * 'http'
 *
 * @param {string} href - Url
 * @returns {boolean} Returns true if the link is absolute
 */
export const isAbsolute = href =>
	href[0] === '/' || href[0] === '#' || /^http/.test(href)

/**
 * Returns true if the link is external. It does so by checking that
 * window.location.origin is present at the beginning of the url
 *
 * @param {string} url - Url
 * @returns {boolean} Returns true if the link is external
 */
export const isExternal = url =>
	// origin could be http://example.net and link could be http://example.net.ha.com, so add "/"
	/^http/.test(url) && !(url + '/').startsWith(origin + '/')

/**
 * Returns true if the link is relative
 *
 * @param {string} url - Url
 * @returns {boolean} Returns true if the link relative
 */
export const isRelative = url => !isAbsolute(url)

/**
 * Replace params in an url for the encoded equivalent
 *
 * @param {string | undefined} url - Url
 * @param {object} [params] - Key-value pair to replace
 * @returns {string} Url with the params replaced
 */
export const replaceParams = (url, params) =>
	params
		? url.replace(/\:([a-z0-9_\-]+)/gi, (a, b) =>
				// only replace the ones defined on params
				params[b] !== undefined ? encodeURIComponent(params[b]) : a,
			)
		: url
