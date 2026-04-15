// WIP

import { propsPlugin } from '../core/props/plugin.js'
import { setElementStyle } from '../core/props/style.js'
import { addEvent } from '../lib/reactive.js'
import { empty, entries, hasOwn, isArray } from '../lib/std.js'

/**
 * Returns `true` when the element is disabled, either directly or
 * via an ancestor `<fieldset disabled>`.
 *
 * @param {Element} node
 * @returns {boolean}
 */
export const isDisabled = node => node.matches(':disabled')

export function focusNextInput(node, e) {
	const { form } = node
	if (form) {
		const { elements } = form

		for (let i = 0; i < elements.length; i++) {
			let element = elements[i]

			if (element === node) {
				element = elements[++i]
				if (element) {
					e.preventDefault()
					e.stopPropagation()
					element.focus()
				}
				break
			}
		}
	}
}

export function form2object(
	form,
	object = empty(),
	submitter = undefined,
) {
	const formData = new FormData(form, submitter)
	for (const [key, value] of formData) {
		if (hasOwn(object, key)) {
			const entry = object[key]
			isArray(entry)
				? entry.push(value)
				: (object[key] = [object[key], value])
		} else {
			object[key] = value
		}
	}

	return object
}

export function object2form(form, object) {
	for (const [name, value] of entries(object)) {
		const fields = form.querySelectorAll('[name=' + name + ']')

		for (const field of fields) {
			switch (field.type) {
				case 'checkbox':
					field.checked = !!value
					break
				case 'radio':
					field.checked = field.value === value
					break
				default: {
					if (field.options) {
						for (const option of field.options) {
							if (value.indexOf(option.value) !== -1)
								option.selected = true
						}
					} else {
						field.value = value
					}
				}
			}
		}
	}
}

propsPlugin('use:click-focus-children-input', (node, propValue) => {
	addEvent(node, 'click', e => {
		/** @type {HTMLElement | null} */ (
			node.querySelector(
				'input:not([type=hidden]), button, select, textarea, [contenteditable]',
			)
		)?.focus()
	})
})

propsPlugin('use:enter-focus-next', (node, propValue) => {
	addEvent(node, 'keydown', e => {
		if (e.code === 'Enter' || e.code === 'NumpadEnter') {
			focusNextInput(node, e)
		}
	})
})
propsPlugin('use:prevent-enter', (node, propValue) => {
	addEvent(node, 'keydown', e => {
		if (e.code === 'Enter' || e.code === 'NumpadEnter') {
			e.preventDefault()
			e.stopPropagation()
		}
	})
})

propsPlugin('use:size-to-input', (node, propValue) => {
	// initial size
	setElementStyle(node, 'height', node.scrollHeight + 'px')
	setElementStyle(node, 'overflow', 'hidden')

	/* it resize to content or to container */
	function resizeToContainer() {
		resizeToContent()

		// if the parent is still bigger, then size to parent
		const { parentNode, scrollHeight } = node

		const size =
			scrollHeight > /** @type {Element} */ (parentNode).clientHeight
				? scrollHeight
				: /** @type {Element} */ (parentNode).clientHeight

		setElementStyle(node, 'height', 'auto')
		setElementStyle(node, 'height', size + 'px')
	}
	/* it resize to content exclusively */
	function resizeToContent() {
		setElementStyle(node, 'height', 'auto')
		setElementStyle(node, 'height', node.scrollHeight + 'px')
	}
	addEvent(node, 'input', resizeToContainer)
	addEvent(node, 'focus', resizeToContainer)

	// this allows to _ungrow_ siblings
	addEvent(node, 'blur', resizeToContent)
})
