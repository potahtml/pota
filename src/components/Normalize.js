import { unwrap } from '../lib/reactive.js'

/**
 * Resolves children as text. It creates 1 effect that contains all
 * the children, instead of each child with its own effect.
 *
 * @type {FlowComponent}
 * @url https://pota.quack.uy/Components/Normalize
 */
export const Normalize = props => () =>
	// returnng null when string is empty avoids 1 text node
	unwrap([props.children])
		.map(x => x?.toString())
		.join('') || null
