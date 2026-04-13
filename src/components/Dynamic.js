import { Component } from '../core/renderer.js'

/**
 * Creates components dynamically
 *
 * @template {JSX.ElementType} T
 * @param {Dynamic<T>} props
 * @returns {JSX.Element}
 * @url https://pota.quack.uy/Components/Dynamic
 */
export function Dynamic(props) {
	// `component` needs to be deleted else it will end in the tag as an attribute
	return Component(props.component, {
		...props,
		component: undefined,
	})
}
