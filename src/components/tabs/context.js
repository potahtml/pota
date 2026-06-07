import { signal, context } from '../../lib/reactive.js'

/**
 * Shared selection state for a `Tabs` group.
 *
 * @typedef {object} TabsContext
 * @property {Signal<{ id: number; name: string }>} selected
 * @property {number} group
 * @property {(selected: { id: number; name: string }) => void} [onSelected]
 *   - Fires with the new selection whenever a tab is picked.
 */

export const Context = context(
	/** @type {TabsContext} */ ({
		selected: signal({ id: 0, name: '' }),
		group: 0,
	}),
)
