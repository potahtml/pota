import { customElement } from '#renderer'
import { getValue } from '#std'

class CollapseElement extends HTMLElement {
	constructor() {
		super(), this.attachShadow({ mode: 'open' })
	}
	hide() {
		this.shadowRoot.innerHTML = ''
	}
	show() {
		this.shadowRoot.innerHTML = '<slot/>'
	}
	/** @param {pota.When} value - To toggle children */
	set when(value) {
		getValue(value) ? this.show() : this.hide()
	}
}

/**
 * Similar to `Show`, but doesn't remove its children from the
 * document
 *
 * @param {{
 * 	when: pota.When
 * 	children?: pota.Children
 * }} props
 * @returns {pota.Children}
 */
export function Collapse(props) {
	customElement('pota-collapse', CollapseElement)

	return (
		<pota-collapse
			when={props.when}
			children={props.children}
		/>
	)
}
