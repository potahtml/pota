export const randomBetween = (min, max) => {
	const random = crypto.getRandomValues(new Uint32Array(1))[0]
	return (
		Math.floor((random / (0xffffffff + 1)) * (max - min + 1)) + min
	)
}
