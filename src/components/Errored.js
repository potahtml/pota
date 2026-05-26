import { toHTMLFragment } from '../core/renderer.js'
import {
	batch,
	catchError,
	makeCallback,
	memo,
	signal,
} from '../lib/reactive.js'

const noError = Symbol()

/**
 * Catches errors thrown by descendants and renders a fallback.
 *
 * Protects its subtree from both synchronous throws during render and
 * reactive throws inside descendant effects, memos, and deriveds. The
 * `fallback` can be a JSX element, plain value, or a `(err, reset) =>
 * JSX.Element` function.
 *
 * @type {FlowComponent<{
 * 	fallback?:
 * 		| JSX.Element
 * 		| ((err: unknown, reset: () => void) => JSX.Element)
 * }>}
 * @url https://pota.quack.uy/Components/Errored
 */
export const Errored = props => {
	const err = signal(/** @type {unknown} */ (noError))
	const attempt = signal(0)

	const fallback = makeCallback(props.fallback)

	const reset = () => {
		batch(() => {
			err.write(noError)
			attempt.update(n => n + 1)
		})
	}

	const children = memo(() => {
		attempt.read()
		return catchError(() => toHTMLFragment(props.children), err.write)
	})

	return memo(() => {
		const e = err.read()
		if (e !== noError) return fallback(e, reset)
		return children()
	})
}
