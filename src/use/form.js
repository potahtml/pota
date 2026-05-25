// WIP

import { setElementStyle } from '../core/props/style.js'
import { addEvent } from '../lib/reactive.js'
import { empty, entries, hasOwn, isArray } from '../lib/std.js'

/**
 * Returns `true` when the element is disabled, either directly or via
 * an ancestor `<fieldset disabled>`.
 *
 * @param {Element} node
 * @returns {boolean}
 */
export const isDisabled = node => node.matches(':disabled')

/**
 * Returns `true` when `node` is a user-editable element — `<input>`,
 * `<textarea>`, `<select>`, or anything inside a `contenteditable`
 * tree. Useful for global key handlers that should stand down when
 * the user is typing.
 *
 * @param {Element | null | undefined} node
 * @returns {boolean}
 */
export const isEditable = node => {
	if (!node) return false
	const tag = node.tagName
	return (
		tag === 'INPUT' ||
		tag === 'TEXTAREA' ||
		tag === 'SELECT' ||
		/** @type {HTMLElement} */ (node).isContentEditable === true
	)
}

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

/**
 * Ref function: clicking the element focuses the first focusable
 * descendant input/button/select/textarea/contenteditable.
 *
 * @param {DOMElement} node
 */
export const clickFocusChildrenInput = node => {
	addEvent(node, 'click', e => {
		const focusable = /** @type {HTMLElement | null} */ (
			node.querySelector(
				'input:not([type=hidden]), button, select, textarea, [contenteditable]',
			)
		)
		focusable?.focus()
	})
}

/**
 * Ref function: pressing Enter moves focus to the next form element.
 *
 * @param {HTMLInputElement} node
 */
export const enterFocusNext = node => {
	addEvent(node, 'keydown', e => {
		if (e.code === 'Enter' || e.code === 'NumpadEnter') {
			focusNextInput(node, e)
		}
	})
}

/**
 * Ref function: blocks Enter key from submitting / inserting a
 * newline by calling `preventDefault` and `stopPropagation`.
 *
 * @param {DOMElement} node
 */
export const preventEnter = node => {
	addEvent(node, 'keydown', e => {
		if (e.code === 'Enter' || e.code === 'NumpadEnter') {
			e.preventDefault()
			e.stopPropagation()
		}
	})
}

/**
 * Ref function: makes a textarea grow/shrink to fit its content (and
 * parent) on `input`, `focus`, and `blur`.
 *
 * @param {HTMLTextAreaElement} node
 */
export const sizeToInput = node => {
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
}
