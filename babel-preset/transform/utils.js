import { types as t } from '@babel/core'
import { addNamed } from '@babel/helper-module-imports'

function get(state, name) {
	return state.get(`@babel/plugin-pota-jsx/${name}`)
}
function set(state, name, v) {
	return state.set(`@babel/plugin-pota-jsx/${name}`, v)
}

/** Creates an import for a function */
export const createImport = (path, state, name) =>
	set(state, 'id/' + name, importLazy(path, state, name))

/**
 * Calls function that has been created with `createImport` with
 * arguments
 */
export const callFunctionImport = (state, name, args) =>
	t.callExpression(get(state, `id/${name}`)(), args)

/** Call function it with arguments */
export const callFunction = (name, args) =>
	t.callExpression(t.identifier(name), args)

function importLazy(path, state, name) {
	return () => {
		let reference = get(state, `imports/${name}`)
		if (reference) return t.cloneNode(reference)
		reference = addNamed(path, name, 'pota/jsx-runtime', {
			importedInterop: 'uncompiled',
			importPosition: 'after',
		})
		set(state, `imports/${name}`, reference)
		return reference
	}
}

/** Displays fancy error on path */

export function error(path, err) {
	throw path.buildCodeFrameError(err)
}

export function warn(path, err) {
	const e = path.buildCodeFrameError(err).toString()
	console.log()
	console.warn(filename(path))
	console.log(e)
	console.log()
}

export function filename(path) {
	try {
		return path.scope
			.getProgramParent()
			.path.hub.file.opts.filename.replace(/\\/g, '/')
	} catch (e) {
		return 'unknown'
	}
}

/**
 * Removes a value from an array
 *
 * @param {any[]} array
 * @param {any} value To remove from the array
 * @returns {any[]}
 */
export function removeFromArray(array, value) {
	const index = array.indexOf(value)
	if (index !== -1) array.splice(index, 1)
	return array
}

export const keys = Object.keys

export const eventNames = new Set([
	'onabort',
	'onafterprint',
	'onanimationcancel',
	'onanimationend',
	'onanimationiteration',
	'onanimationstart',
	'onauxclick',
	'onbeforeinput',
	'onbeforeprint',
	'onbeforetoggle',
	'onbeforeunload',
	'onblur',
	'oncancel',
	'oncanplay',
	'oncanplaythrough',
	'onchange',
	'onclick',
	'onclose',
	'oncompositionend',
	'oncompositionstart',
	'oncompositionupdate',
	'oncontextlost',
	'oncontextmenu',
	'oncontextrestored',
	'oncopy',
	'oncuechange',
	'oncut',
	'ondblclick',
	'ondoubleclick',
	'ondrag',
	'ondragend',
	'ondragenter',
	'ondragexit',
	'ondragleave',
	'ondragover',
	'ondragstart',
	'ondrop',
	'ondurationchange',
	'onemptied',
	'onencrypted',
	'onended',
	'onenterpictureinpicture',
	'onerror',
	'onfocus',
	'onfocusin',
	'onfocusout',
	'onformdata',
	'onfullscreenchange',
	'onfullscreenerror',
	'ongamepadconnected',
	'ongamepaddisconnected',
	'ongotpointercapture',
	'onhashchange',
	'oninput',
	'oninvalid',
	'onkeydown',
	'onkeypress',
	'onkeyup',
	'onlanguagechange',
	'onleavepictureinpicture',
	'onload',
	'onloadeddata',
	'onloadedmetadata',
	'onloadstart',
	'onlostpointercapture',
	'onmessage',
	'onmessageerror',
	'onmiddleclick',
	'onmousedown',
	'onmouseenter',
	'onmouseleave',
	'onmousemove',
	'onmouseout',
	'onmouseover',
	'onmouseup',
	'onoffline',
	'ononline',
	'onpagehide',
	'onpagereveal',
	'onpageshow',
	'onpageswap',
	'onpaste',
	'onpause',
	'onplay',
	'onplaying',
	'onpointercancel',
	'onpointerdown',
	'onpointerenter',
	'onpointerleave',
	'onpointermove',
	'onpointerout',
	'onpointerover',
	'onpointerup',
	'onpopstate',
	'onprogress',
	'onratechange',
	'onrejectionhandled',
	'onreset',
	'onresize',
	'onscroll',
	'onscrollend',
	'onsearch',
	'onsecuritypolicyviolation',
	'onseeked',
	'onseeking',
	'onselect',
	'onselectionchange',
	'onselectstart',
	'onslotchange',
	'onstalled',
	'onstorage',
	'onsubmit',
	'onsuspend',
	'ontimeupdate',
	'ontoggle',
	'ontouchcancel',
	'ontouchend',
	'ontouchmove',
	'ontouchstart',
	'ontransitioncancel',
	'ontransitionend',
	'ontransitionrun',
	'ontransitionstart',
	'onunhandledrejection',
	'onunload',
	'onvolumechange',
	'onwaiting',
	'onwaitingforkey',
	'onwebkitanimationend',
	'onwebkitanimationiteration',
	'onwebkitanimationstart',
	'onwebkittransitionend',
	'onwheel',
])
