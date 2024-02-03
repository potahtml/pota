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
	hide() {
		this.shadowRoot.innerHTML = ''
	}
	show() {
		this.shadowRoot.innerHTML = '<slot/>'
	}
	/** @param {When} value - To toggle children */
	set when(value) {
		getValue(value) ? this.show() : this.hide()
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
