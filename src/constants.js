// symbols

import { Symbol } from './lib/std.js'

export const $isComponent = Symbol()
export const $isClass = Symbol()
export const $isReactive = Symbol()
export const $isMap = Symbol()

// supported namespaces

const prefix = 'http://www.w3.org/'

// when a tag/attribute is missing the namespace this puts it back in

export const NS = {
	__proto__: null,
	svg: prefix + '2000/svg',
	math: prefix + '1998/Math/MathML',
	html: prefix + '1999/xhtml',
	xlink: prefix + '1999/xlink',
}
