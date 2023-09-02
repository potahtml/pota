import { cleanup, effect, signal } from '#main'

export function selector(value) {
	const map = new Map()

	let prev
	effect(() => {
		const selected = value()
		if (selected === prev) return

		const previous = map.get(prev)
		if (previous) previous.write(false)

		const current = map.get(selected)
		if (current) current.write(true)

		prev = selected
	})

	const defaultValue = value()

	return item => {
		cleanup(() => map.delete(item))

		if (!map.has(item)) {
			const [read, write] = signal(item === defaultValue)
			map.set(item, {
				read,
				write,
			})
		}

		return map.get(item).read
	}
}
