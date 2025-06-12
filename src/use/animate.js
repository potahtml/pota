import { promise, resolved } from '../lib/std.js'

import { addClass, removeClass, addPart, removePart } from './dom.js'
import { waitEvent } from './event.js'

/**
 * Swaps classNames and waits for the animation to end
 *
 * @param {Element} element
 * @param {string} oldClass - `class` with the old animation
 * @param {string} newClass - `class` with the new animation
 */
export const animateClassTo = (element, oldClass, newClass) =>
	promise(resolve =>
		requestAnimationFrame(() => {
			removeClass(element, oldClass)
			addClass(element, newClass)
			element.getAnimations().length
				? resolved(waitEvent(element, 'animationend'), resolve)
				: resolve()
		}),
	)

/**
 * Swaps parts and waits for the animation to end
 *
 * @param {Element} element
 * @param {string} oldPart - `part` with the old animation
 * @param {string} newPart - `part` with the new animation
 */
export const animatePartTo = (element, oldPart, newPart) =>
	promise(resolve =>
		requestAnimationFrame(() => {
			removePart(element, oldPart)
			addPart(element, newPart)
			element.getAnimations().length
				? resolved(waitEvent(element, 'animationend'), resolve)
				: resolve()
		}),
	)
