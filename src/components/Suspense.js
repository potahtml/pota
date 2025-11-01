import { useSuspense } from '../core/renderer.js'
import { memo, resolve, signal } from '../lib/reactive.js'

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
	const s = signal(0)

	return useSuspense(s, () => {
		const children = resolve(props.children)()
		const result = memo(() =>
			s.read() === 0 ? children : props.fallback,
		)

		return new Promise(resolve => resolve(result))
	})
}
