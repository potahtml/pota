/** Returns random number between 0 and 1 */
export const random = () =>
	crypto.getRandomValues(new Uint32Array(1))[0] / (0xffffffff + 1)
