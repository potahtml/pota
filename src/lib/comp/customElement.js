import { create } from '#main'

export function customElement(name, fn) {
	if (customElements.get(name) === undefined) {
		customElements.define(name, fn)
	}
	return create(name)
}
