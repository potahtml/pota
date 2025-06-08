import { global, origin } from '../lib/std.js'

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

const nestedProtocol = /^[a-z]+:([a-z]+:)\/\//
const nestedProtocolOptional = /^[a-z]+:([a-z]+:)?\/\//

/**
 * Returns `true` if the link uses the `file:` protocol
 *
 * @param {string} href - URL
 * @returns {boolean}
 */
export const isFileProtocol = href => href.startsWith('file://')

/**
 * Returns `true` if the link comes with a protocol as `http://local/`
 * or `blob:http://local/`
 *
 * @param {string} href - URL
 * @returns {boolean}
 */
export const hasProtocol = href => nestedProtocolOptional.test(href)

/**
 * Removes nested protocol as in `blob:` from `blob:http://local/`
 *
 * @param {string} href - URL
 * @returns {string}
 */
export const removeNestedProtocol = href =>
	href.replace(nestedProtocol, '$1//')

/**
 * Returns `true` if the link is absolute: starts with `/` or has a
 * protocol
 *
 * @param {string} href - URL
 * @returns {boolean} Returns true if the link is absolute
 */
export const isAbsolute = href => href[0] === '/' || hasProtocol(href)

/**
 * Returns `true` if the link is relative
 *
 * @param {string} href - URL
 * @returns {boolean} Returns `true` if the link relative
 */
export const isRelative = href => !isAbsolute(href)

/**
 * Returns `true` if the link starts with a `#`
 *
 * @param {string} url - URL
 * @returns {boolean} Returns `true` if the link relative
 */
export const isHash = url => url[0] === '#'

/**
 * Returns `true` if the link is external. It does so by checking that
 * `window.location.origin` is present at the beginning of the url
 *
 * @param {string} href - URL
 * @returns {boolean} Returns true if the link is external
 */
export const isExternal = href =>
	// origin could be http://example.net and link could be http://example.net.ha.com, so add "/"
	!(href + '/').startsWith(origin + '/')

export const paramsRegExp = /\:([a-z0-9_\-]+)/gi

/**
 * Replace `params` in an `url` for the encoded equivalent
 *
 * @param {string} href - URL
 * @param {object} [params] - Key-value pair to replace
 * @returns {string} URL with the params replaced
 */
export const replaceParams = (href, params) =>
	params
		? href.replace(paramsRegExp, (a, b) =>
				// only replace the ones defined on params
				params[b] !== undefined ? encodeURIComponent(params[b]) : a,
			)
		: href
