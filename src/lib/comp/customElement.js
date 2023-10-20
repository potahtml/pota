import { create } from '#main'

/**
 * Defines a custom Element (if isnt defined already), and returns a
 * `Component` of it that can be used as `myComponent(props)`
 *
 * @param {string} name - Name for the custom element
 * @param {CustomElementConstructor} constructor - Class for the
 *   custom element
 * @param {ElementDefinitionOptions} [options] - Options passed to
 *   `customElements.define`
 * @returns {pota.component}
 */
export function customElement(name, constructor, options) {
	if (customElements.get(name) === undefined) {
		customElements.define(name, constructor, options)
	}
	return create(name)
}
