/**
 * Replace params in an url for the encoded equivalent
 *
 * @param {string | undefined} url - Url
 * @param {object} [params] - Key-value pair to replace
 * @returns {string} Url with the params replaced
 */
export function replaceParams(url, params) {
	return params
		? url.replace(/\:([a-z0-9_\-]+)/gi, function (a, b) {
				// only replace the ones defined on params
				return params[b] !== undefined
					? encodeURIComponent(params[b])
					: a
		  })
		: url
}
