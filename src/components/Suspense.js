import { toHTMLFragment, useSuspense } from '../core/renderer.js'
import { memo, signal } from '../lib/reactive.js'

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
export function Suspense(props) {
	const s = signal(false)

	return useSuspense({ c: 0, s }, () => {
		const children = toHTMLFragment(props.children)

		// for when `Suspense` was used with children that dont have promises
		const context = useSuspense()

		return context.c === 0
			? children
			: memo(() => (s.read() ? children : props.fallback))
	})
}
