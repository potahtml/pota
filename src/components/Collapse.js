import { Component } from '../core/renderer.js'
import { getValue } from '../lib/std.js'

/**
 * Similar to `Show`, but doesn't remove its children from the
 * document
 *
 * @type {FlowComponent<{
 * 	when: When<any>
 * 	fallback?: JSX.Element
 * }>}
 * @url https://pota.quack.uy/Components/Collapse
 */
export const Collapse = props => {
	const visible = () => !!getValue(props.when)
	return [
		Component('div', {
			'style:display': () => (visible() ? 'contents' : 'none'),
			children: props.children,
		}),
		() => (visible() ? undefined : props.fallback),
	]
}
