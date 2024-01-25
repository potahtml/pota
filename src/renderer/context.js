import { Context } from '../lib/reactivity/primitives/solid.js'

import { toHTML } from './@renderer.js'

/**
 * Creates a context and returns a function to get or set the value
 *
 * @param {unknown} [defaultValue] - Default value for the context
 * @returns {Function & { Provider: ({ value }) => Elements }}
 *   Context
 * @url https://pota.quack.uy/Reactivity/Context
 */
export function context(defaultValue = undefined) {
	/** @type {any} */
	const ctx = Context(defaultValue)

	/**
	 * Sets the `value` for the context
	 *
	 * @param {object} props
	 * @param {any} props.value
	 * @param {Children} [props.children]
	 * @returns {Children} Children
	 * @url https://pota.quack.uy/Reactivity/Context
	 */
	ctx.Provider = props =>
		ctx(props.value, () => toHTML(props.children))

	return ctx
}
