/**
 * Returns a random number generator based no a seed that generates
 * numbers between 0 and 1
 */
export function randomSeeded(seed) {
	var m = 2 ** 35 - 31
	var a = 185852
	var s = seed % m
	return function () {
		return (s = (s * a) % m) / m
	}
}
