import {
	cancelAnimationFrame,
	empty,
	promise,
	requestAnimationFrame,
	resolved,
} from '../lib/std.js'
import { cleanup } from '../lib/reactive.js'

import {
	addClass,
	removeClass,
	addPart,
	removePart,
	document,
} from './dom.js'
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

/**
 * Cancels every running animation on `element` — CSS animations,
 * CSS transitions, and Web Animations API instances. Returns the
 * list that was canceled, in case the caller wants to inspect or
 * `await Promise.all(returned.map(a => a.finished.catch(()=>0)))`.
 *
 * @param {Element} element
 */
export const stopAnimations = element => {
	const animations = element.getAnimations()
	for (const a of animations) a.cancel()
	return animations
}

/**
 * Returns a map of every `@keyframes` rule declared in the document
 * — name → its `CSSRuleList`. Walks both `document.styleSheets` and
 * `document.adoptedStyleSheets`. Cross-origin stylesheets are
 * skipped silently because reading their `cssRules` throws.
 * Intended for inspection / tooling, not for runtime use.
 */
export const documentKeyframes = () => {
	const out = empty()
	const sheets = [
		...document.styleSheets,
		...document.adoptedStyleSheets,
	]
	for (const sheet of sheets) {
		try {
			for (const rule of sheet.cssRules) {
				if (rule instanceof CSSKeyframesRule) {
					out[rule.name] = rule.cssRules
				}
			}
		} catch {
			// cross-origin: cssRules access throws — skip the sheet.
		}
	}
	return out
}

/**
 * Drives `fn(timestamp)` once per animation frame. Mirrors the shape
 * of {@link useTimeout}: returns `{start, stop}`, does NOT start
 * automatically, auto-stops on scope dispose. `fn` may call `stop()`
 * (or `start()`) to break out of or restart the loop synchronously.
 *
 * @param {(timestamp: DOMHighResTimeStamp) => void} fn
 * @returns {{ start: () => any; stop: () => any }}
 * @url https://pota.quack.uy/use/animate
 */
export function useAnimationFrame(fn) {
	let id = 0
	const tick = (/** @type {DOMHighResTimeStamp} */ t) => {
		// schedule the next frame before invoking `fn` so that an
		// `fn`-initiated `stop()` can cancel it; if `fn` doesn't
		// stop, the loop continues.
		id = requestAnimationFrame(tick)
		fn(t)
	}
	const ctrl = {
		start: () => {
			ctrl.stop()
			id = requestAnimationFrame(tick)
			return ctrl
		},
		stop: () => {
			if (id) {
				cancelAnimationFrame(id)
				id = 0
			}
			return ctrl
		},
	}
	cleanup(ctrl.stop)
	return ctrl
}
