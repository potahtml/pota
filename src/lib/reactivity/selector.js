import { effect, signal } from '#main'

export function selector(value) {
	const map = new Map()

	let prev
	effect(() => {
		const previous = map.get(prev)
		if (previous) previous.write(false)

		const selected = value()

		const current = map.get(selected)
		if (current) current.write(true)

		prev = selected
	})

	const defaultValue = value()

	return item => {
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
