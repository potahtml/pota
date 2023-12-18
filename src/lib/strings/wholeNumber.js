// removes decimal from number, converts NaN to 0
export function wholeNumber(num) {
	return +num | 0
}
