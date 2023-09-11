import { origin } from '#urls'

export function isExternal(href) {
	return (
		/^http/.test(href) && (href + '/').indexOf(origin + '/') !== 0
	)
}
