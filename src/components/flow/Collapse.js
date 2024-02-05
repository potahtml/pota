import { getValue } from '../../lib/std/@main.js'
import {
	CustomElement,
	customElement,
} from '../../lib/comp/CustomElement.js'
import { Component } from '../../renderer/@renderer.js'

class CollapseElement extends CustomElement {
	constructor() {
		super()
		this.addCSS(`:host{display: contents;}`)
	}
	/** @param {When} value - To toggle children */
	set when(value) {
		this.shadowRoot.innerHTML = getValue(value) ? '<slot/>' : ''
	}
}

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
	customElement('pota-collapse', CollapseElement)

	return Component('pota-collapse', {
		when: props.when,
		children: props.children,
	})
}
