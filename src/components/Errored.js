import { toHTMLFragment } from '../core/renderer.js'
import {
	batch,
	catchError,
	makeCallback,
	memo,
	signal,
} from '../lib/reactive.js'

/**
 * Catches errors thrown by descendants and renders a fallback.
 *
 * Protects its subtree from both synchronous throws during render and
 * reactive throws inside descendant effects, memos, and deriveds. The
 * `fallback` can be a JSX element, plain value, or a `(err, reset) =>
 * Children` function.
 *
 * @param {object} props
 * @param {Children} [props.children]
 * @param {Children
 * 	| ((err: unknown, reset: () => void) => Children)} [props.fallback]
 * @returns {Children}
 * @url https://pota.quack.uy/Components/Errored
 */
const noError = Symbol()

export function Errored(props) {
	const [err, writeErr] = signal(/** @type {unknown} */ (noError))
	const [attempt, , updateAttempt] = signal(0)

	const fallback = makeCallback(props.fallback)

	const reset = () => {
		batch(() => {
			writeErr(noError)
			updateAttempt(n => n + 1)
		})
	}

	const children = memo(() => {
		attempt()
		return catchError(() => toHTMLFragment(props.children), writeErr)
	})

	return memo(() => {
		const e = err()
		if (e !== noError) return fallback(e, reset)
		return children()
	})
}
