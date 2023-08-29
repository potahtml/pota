export function isExternal(href) {
	return (
		/^http/.test(href) &&
		(href + '/').indexOf(window.location.origin + '/') !== 0
	)
}
