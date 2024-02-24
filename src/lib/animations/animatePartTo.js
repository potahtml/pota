import { waitEvent } from '../events/waitEvent.js'

/**
 * Swaps parts and waits for the animation to end
 *
 * @param {HTMLElement} element
 * @param {string} oldPart - `part` with the old animation
 * @param {string} newPart - `part` with the new animation
 */
export const animatePartTo = (element, oldPart, newPart) =>
	new Promise(resolve =>
		requestAnimationFrame(() => {
			element.part.remove(oldPart)
			element.part.add(newPart)
			element.getAnimations().length
				? waitEvent(element, 'animationend')
						.then(resolve)
						.catch(resolve)
				: resolve()
		}),
	)
