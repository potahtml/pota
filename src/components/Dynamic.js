import { Component } from '../core/renderer.js'

/**
 * Creates components dynamically
 *
 * @template T
 * @param {Dynamic<T>} props
 * @url https://pota.quack.uy/Components/Dynamic
 */

export const Dynamic = props =>
	// `component` needs to be deleted else it will end in the tag as an attribute
	Component(
		/** @type {string | ((props: ComponentProps<T>) => Children)} */ (
			props.component
		),
		{ ...props, component: undefined },
	)
