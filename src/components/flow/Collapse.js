import { create, effect } from '#main'
import { getValue } from '#std'

// as Show but doesnt remove the children from the DOM

/*customElements.define(
	'pota-collapse',
	class extends HTMLElement {
		constructor() {
			super(), this.attachShadow({ mode: 'open' }), this.hide()
		}
		hide() {
			this.shadowRoot.innerHTML = `<template><slot/></template>`
		}
		show() {
			this.shadowRoot.innerHTML = `<slot/>`
		}
		attributeChangedCallback(name, oldValue, newValue) {
			newValue === 'true' ? this.show() : this.hide()
		}
		static get observedAttributes() {
			return ['when']
		}
	},
)

const WebComponent = create('pota-collapse')
*/
export function Collapse(props) {
	const element = WebComponent({ children: props.children })

	effect(() => {
		element.setAttribute('when', getValue(props.when))
	})
	return element
}
