import Color from 'colorjs.io'

/** Given an array of colors it returns a gradient between them */
export function scale(colors, count) {
	const result = []
	let numPerColor = count / (colors.length - 1)

	for (let i = 0; i < colors.length - 1; i++) {
		const color = colors[i]
		const isLastColor = i === color.length - 2

		// the last gradient may need more colors to fully fill
		if (isLastColor) {
			numPerColor = count - result.length
		}

		// get gradient
		const r = new Color(color).steps(colors[i + 1], {
			space: 'srgb',
			steps: numPerColor | 0,
		})

		// remove the last color as its going to be used on the next gradient
		// but only if isnt the last one
		if (!isLastColor) {
			r.pop()
		}

		// save
		result.push(...r)
	}

	return result.map(color => color.toString())
}
