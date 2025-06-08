import { css } from '../lib/std.js'

import { Component } from '../core/renderer.js'
import { CustomElement, customElement } from './CustomElement.js'

const styles = css`
	:host {
		display: contents;
	}
`

/**
 * Similar to `Show`, but doesn't remove its children from the
 * document
 *
 * @template T
 * @param {{
 * 	when: When<T> // Condition to show/hide children
 * 	children?: Children // Content to show when condition is true
 * 	fallback?: Children // Content to show when condition is false
 * }} props
 * @returns {Children}
 * @url https://pota.quack.uy/Components/Collapse
 */
export function Collapse(props) {
	// need to include the class here because else its not treeshaked
	class CollapseElement extends CustomElement {
		static styleSheets = [styles]

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
