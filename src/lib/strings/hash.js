export async function hash(value, algo = 'SHA-256') {
	const msgUint8 = new TextEncoder().encode(value)
	const hashBuffer = await crypto.subtle.digest(algo, msgUint8)
	const hashArray = Array.from(new Uint8Array(hashBuffer))
	return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
