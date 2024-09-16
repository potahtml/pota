import { withValue } from '../lib/reactive.js'
import { css } from '../lib/std.js'

import { Component } from '../renderer.js'
import { CustomElement, customElement } from './CustomElement.js'

/**
 * Similar to `Show`, but doesn't remove its children from the
 * document
 *
 * @template T
 * @param {{
 * 	when: When<T>
 * 	children?: Children
 * }} props
 * @returns {Children}
 * @url https://pota.quack.uy/Components/Collapse
 */
export function Collapse(props) {
	// need to include the class here because else its not treeshaked
	class CollapseElement extends CustomElement {
		static styleSheets = [
			css`
				:host {
					display: contents;
				}
			`,
		]

		/**
		 * @template T
		 * @param {When<T>} value - To toggle children
		 */
		set when(value) {
			withValue(value, value => (this.html = value ? '<slot/>' : ''))
		}
	}

	const name = 'pota-collapse'

	customElement(name, CollapseElement)

	return Component(name, {
		when: props.when,
		children: props.children,
	})
}
