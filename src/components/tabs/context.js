import { signal, context } from '../../lib/reactive.js'

export const Context = context({
	selected: signal({ id: 0, name: '' }),
	group: 0,
})
