import { isAbsolute } from '#urls'

export function isRelative(href) {
	return !isAbsolute(href)
}
