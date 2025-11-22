import { toHTMLFragment } from '../core/renderer.js'
import {
	memo,
	createSuspenseContext,
	useSuspense,
} from '../lib/reactive.js'

/**
 * Provides a fallback till children promises resolve (recursively)
 *
 * @template T
 * @param {object} props
 * @param {Children} [props.fallback]
 * @param {Children} [props.children]
 * @returns {Children}
 * @url https://pota.quack.uy/Components/Suspense
 */
export const Suspense = props =>
	useSuspense(new createSuspenseContext(), () => {
		const children = toHTMLFragment(props.children)
		const context = useSuspense()
		// for when `Suspense` was used with children that dont have promises
		return context.isEmpty()
			? children
			: memo(() => (context.s.read() ? children : props.fallback))
	})
