// symbols

const $ = Symbol
export const $meta = $()
export const $component = $()
export const $class = $()
export const $reactive = $()
export const $map = $()
export const $internal = $()

// supported namespaces

const prefix = 'http://www.w3.org/'

export const NS = {
	svg: prefix + '2000/svg',
	math: prefix + '1998/Math/MathML',
	html: prefix + '1999/xhtml',
	xlink: prefix + '1999/xlink',
}
