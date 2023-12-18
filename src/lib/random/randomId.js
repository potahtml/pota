export const randomId = () =>
	crypto.getRandomValues(new BigUint64Array(1))[0].toString(36)
