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
		set when(value) {
			getValue(value) ? this.show() : this.hide()
		}
	},
)

export function Collapse(props) {
	return (
		<pota-collapse
			when={props.when}
			children={props.children}
		/>
	)
}
