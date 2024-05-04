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
		reference = addNamed(path, name, 'pota/src/renderer/@main.js', {
			importedInterop: 'uncompiled',
			importPosition: 'after',
		})
		set(state, `imports/${name}`, reference)
		return reference
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

/** Displays fancy error on path */
export function error(path, err) {
	throw path.buildCodeFrameError(err)
}
