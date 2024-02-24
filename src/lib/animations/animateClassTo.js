import { waitEvent } from '../events/waitEvent.js'

/**
 * Swaps classNames and waits for the animation to end
 *
 * @param {HTMLElement} element
 * @param {string} oldClass - `class` with the old animation
 * @param {string} newClass - `class` with the new animation
 */
export const animateClassTo = (element, oldClass, newClass) =>
	new Promise(resolve =>
		requestAnimationFrame(() => {
			element.classList.remove(oldClass)
			element.classList.add(newClass)
			element.getAnimations().length
				? waitEvent(element, 'animationend')
						.then(resolve)
						.catch(resolve)
				: resolve()
		}),
	)
