import { create, toHTML } from '../../exports.js'
import { entries } from '../std/entries.js'
import { sheet } from './sheet.js'

/**
 * Web Element Factory. Returns a function to register web elements as
 * customElements with `name`, `css`, `component` arguments
 *
 * @param {string} groupCss - Sheet shared by group
 * @param {string[]} externalSheets - Array with paths to external
 *   sheets
 * @returns {(name, css, component) => void}
 */
export function webElementsGroup(groupCss, externalSheets = []) {
	// load external css files in a Link
	for (const [key, value] of entries(externalSheets)) {
		externalSheets[key] = (
			<link
				rel="stylesheet"
				href={value}
			/>
		)
	}

	// make a sheet of the group css
	groupCss = sheet(groupCss)

	return (name, css, component) => {
		customElements.define(
			name,
			class extends HTMLElement {
				constructor() {
					super()

					const shadow = this.attachShadow({
						mode: 'open',
					})
					// add global and local css sheets to shadow
					shadow.adoptedStyleSheets.push(groupCss, sheet(css))

					// external stylesheets
					externalSheets.length &&
						shadow.append(toHTML(externalSheets))

					// add component to shadow
					shadow.append(toHTML(create(component || <slot />)))

					// set property empty when the slot is not used
					shadow.addEventListener('slotchange', e =>
						e.target.assignedElements().length
							? this.removeAttribute('empty')
							: this.setAttribute('empty', ''),
					)
				}
			},
		)
	}
}
