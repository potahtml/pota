import { getValue } from '#std'

customElements.define(
	'pota-collapse',
	class Collapse extends HTMLElement {
		constructor() {
			super(), this.attachShadow({ mode: 'open' })
		}
		hide() {
			this.shadowRoot.innerHTML = ''
		}
		show() {
			this.shadowRoot.innerHTML = '<slot/>'
		}
		/** @param {pota.when} value - To toggle children */
		set when(value) {
			getValue(value) ? this.show() : this.hide()
		}
	},
)

/**
 * Similar to `Show`, but doesn't remove its children from the
 * document
 *
 * @param {{
 * 	when: pota.when
 * 	children?: pota.children
 * }} props
 * @returns {pota.children}
 */
export function Collapse(props) {
	return (
		<pota-collapse
			when={props.when}
			children={props.children}
		/>
	)
}
