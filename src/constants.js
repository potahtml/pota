// symbols

import { Symbol } from './lib/std.js'

export const $isComponent = Symbol()
export const $isMap = Symbol()

export const $isMutable = Symbol()

// supported namespaces

const prefix = 'http://www.w3.org/'

// when a tag/attribute is missing the namespace this puts it back in

/** @type {Record<string, string>} */
export const NS = {
	__proto__: null,
	svg: prefix + '2000/svg',
	math: prefix + '1998/Math/MathML',
	html: prefix + '1999/xhtml',
	xlink: prefix + '1999/xlink',
	xmlns: prefix + '2000/xmlns/',
	xml: prefix + 'XML/1998/namespace',
}
