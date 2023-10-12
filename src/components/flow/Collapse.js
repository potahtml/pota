// as Show but doesnt remove the children from the DOM

customElements.define(
	'pota-collapse',
	class collapse extends HTMLElement {
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
			value ? this.show() : this.hide()
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
