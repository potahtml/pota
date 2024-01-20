import { create, toHTML } from '../../renderer/@renderer.js'
import { CustomElement as CustomElementsTemplate } from '../comp/CustomElement.js'
import { assign } from '../std/assign.js'
import { empty } from '../std/empty.js'
import { sheet } from './sheet.js'

/**
 * Custom Element Factory. Returns a function to register custom
 * elements that share a groupCSS and externalSheets. Each registered
 * custom element can have its own css too.
 *
 * @param {string} groupCSS - CSS shared by the group
 * @param {string[]} externalSheets - Array with paths to external
 *   sheets
 * @returns {(name, css, component) => void}
 */
export function customElementGroup(groupCSS, externalSheets) {
	// make a sheet of the group css
	const groupSheet = sheet(groupCSS)

	// element data (local sheet, component)
	const data = empty()

	// element factory
	class CustomElement extends CustomElementsTemplate {
		constructor() {
			super()

			// get element data
			const element = data[customElements.getName(this.constructor)]

			// add external sheet
			this.addExternalStyles(externalSheets)

			// add group sheet
			this.addSheet(groupSheet)

			// add local sheet
			element.sheet && this.addSheet(element.sheet)

			// add component (in case is not a class what the user defined)
			!element.isClass &&
				this.shadowRoot.append(
					toHTML(create(element.component || 'slot')),
				)

			// set property to empty when the slot is not in use
			// TODO BUG: this is not checking all slots
			this.shadowRoot.addEventListener('slotchange', e =>
				e.target.assignedElements().length
					? this.removeAttribute('empty')
					: this.setAttribute('empty', ''),
			)
		}
	}

	return assign(
		(name, css, component) => {
			// if user provided a class
			const isClass = component.toString().startsWith('class')

			// save data
			data[name] = {
				sheet: sheet(css),
				component: isClass ? null : component,
				isClass,
			}

			// define custom element
			customElements.define(
				name,
				isClass ? component : class extends CustomElement {},
			)
		},
		{ CustomElement },
	)
}
