import { Component } from '../core/renderer.js'
import { css } from '../use/css.js'
import { CustomElement, customElement } from './CustomElement.js'

/**
 * Similar to `Show`, but doesn't remove its children from the
 * document
 *
 * @type {FlowComponent<{
 * 	when: When<any>
 * 	fallback?: JSX.Element
 * }>}
 * @url https://pota.quack.uy/Components/Collapse
 */
export const Collapse = props => {
	// need to include the class here because else its not treeshaked

	class CollapseElement extends CustomElement {
		static styleSheets = [
			css`
				:host {
					display: contents;
				}
			`,
		]

		/** @param {any} value - To toggle children */
		set when(value) {
			this.html = value ? '<slot/>' : this.fb || ''
		}
		/** @param {any} fallback - To toggle children */
		set fallback(fallback) {
			// TODO make this reactive
			this.fb = fallback
		}
	}

	const name = 'pota-collapse'

	customElement(name, CollapseElement)

	return Component(name, {
		'prop:when': props.when,
		'prop:fallback': props.fallback,
		children: props.children,
	})
}
