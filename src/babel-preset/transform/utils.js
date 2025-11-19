import { types as t } from '@babel/core'
import { addNamed } from '@babel/helper-module-imports'

/** Plugin preferences */

function get(state, name) {
	return state.get(`@babel/plugin-pota-jsx/${name}`)
}
function set(state, name, v) {
	return state.set(`@babel/plugin-pota-jsx/${name}`, v)
}

/** Call function it with arguments */
export const callFunction = (name, args) =>
	t.callExpression(t.identifier(name), args)

/**
 * Calls function that has been created with `createImport` with
 * arguments
 */
export const callFunctionImport = (
	path,
	state,
	file,
	name,
	...args
) => {
	createImport(path, state, file, name)
	return t.callExpression(
		get(state, `id/${file + '/' + name}`)(),
		args,
	)
}

/** Creates an import for a function */
const createImport = (path, state, file, name) => {
	set(state, 'id/' + file + '/' + name, () => {
		let reference = get(state, `imports/${file + '/' + name}`)
		if (reference) return t.cloneNode(reference)
		reference = addNamed(path, name, file, {
			importedInterop: 'uncompiled',
			importPosition: 'after',
		})
		set(state, `imports/${file + '/' + name}`, reference)
		return reference
	})
}

export function hasStaticMarker(node) {
	if (!node) return false
	if (node.leadingComments && node.leadingComments[0]) {
		const value = node.leadingComments[0].value
			.replace(/\*/g, '')
			.trim()
		if (value === '@static' || value === '@once') return true
	}
	if (node.expression) return hasStaticMarker(node.expression)
}

export function objectProperty(o, propName) {
	const computed = !/^[a-z]+$/i.test(propName)
	return t.memberExpression(
		o,
		computed ? t.stringLiteral(propName) : t.identifier(propName),
		computed,
	)
}

/** Displays fancy error on path */
export function error(path, err, value) {
	value && console.log(value)
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

export const isInsideJSXAttribute = path =>
	!!path.findParent(p => p.isJSXAttribute())

export function isInsideJSX(path) {
	return !!path.findParent(
		p =>
			p.isJSXElement() ||
			p.isJSXFragment() ||
			p.isJSXExpressionContainer(),
	)
}
