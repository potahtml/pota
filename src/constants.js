// symbols

import { Symbol } from './lib/std/Symbol.js'

export const $meta = Symbol()
export const $component = Symbol()
export const $class = Symbol()
export const $reactive = Symbol()
export const $map = Symbol()
export const $internal = Symbol()

// supported namespaces

const prefix = 'http://www.w3.org/'

export const NS = {
	__proto__: null,
	svg: prefix + '2000/svg',
	math: prefix + '1998/Math/MathML',
	html: prefix + '1999/xhtml',
	xlink: prefix + '1999/xlink',
}
