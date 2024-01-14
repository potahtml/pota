// symbols

const $ = Symbol
export const $meta = $()
export const $component = $()
export const $class = $()
export const $reactive = $()
export const $map = $()
export const $internal = $()
export const $webElement = $()

// supported namespaces

/** @type {Props} */
export const NS = {
	svg: 'http://www.w3.org/2000/svg',
	math: 'http://www.w3.org/1998/Math/MathML',
	html: 'http://www.w3.org/1999/xhtml',
	xlink: 'http://www.w3.org/1999/xlink',
}
