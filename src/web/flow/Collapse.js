import { getValue } from '../../lib/std/@main.js'
import { withValue } from '../../lib/reactivity/withValue.js'
import {
	CustomElement,
	customElement,
} from '../../lib/component/CustomElement.js'
import { Component } from '../../renderer/@main.js'
import { css } from '../../lib/css/css.js'

/**
 * Similar to `Show`, but doesn't remove its children from the
 * document
 *
 * @param {{
 * 	when: When
 * 	children?: Children
 * }} props
 * @returns {Children}
 * @url https://pota.quack.uy/Components/Collapse
 */
export function Collapse(props) {
	class CollapseElement extends CustomElement {
		static styleSheets = [
			css`
				:host {
					display: contents;
				}
			`,
		]

		/** @param {When} value - To toggle children */
		set when(value) {
			withValue(
				value,
				value => (this.html = getValue(value) ? '<slot/>' : ''),
			)
		}
	}

	customElement('pota-collapse', CollapseElement)

	return Component('pota-collapse', {
		when: props.when,
		children: props.children,
	})
}
