export function isRelative(href) {
	return !(href[0] === '/' || href[0] === '#' || /^http/.test(href))
}
