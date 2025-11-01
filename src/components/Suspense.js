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
		const result = memo(() => (s.read() ? children : props.fallback))

		return Promise.resolve(result)
	})
}
