import { types as t } from '@babel/core'
import { addNamed } from '@babel/helper-module-imports'

/** Plugin preferences */

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
 * @template T
 * @param {T[]} array
 * @param {T} value To remove from the array
 * @returns {T[]}
 */
export function removeFromArray(array, value) {
	const index = array.indexOf(value)
	if (index !== -1) array.splice(index, 1)
	return array
}

export const keys = Object.keys
