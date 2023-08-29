export function replaceParams(href, params) {
	return params
		? href.replace(/\:([a-z0-9_\-]+)/gi, function (a, b, c) {
				// only replace the ones defined on params
				return params[b] !== undefined
					? encodeURIComponent(params[b])
					: a
		  })
		: href
}
