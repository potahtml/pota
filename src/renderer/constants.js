// constants

export const $meta = Symbol('meta')

// supported namespaces

export const NS = {
	svg: 'http://www.w3.org/2000/svg',
	math: 'http://www.w3.org/1998/Math/MathML',
	html: 'http://www.w3.org/1999/xhtml',
	xlink: 'http://www.w3.org/1999/xlink',
}

// to ensure timing of events callbacks are queued to run at specific times

export const TIME_MOUNT = 1
export const TIME_READY = 2
