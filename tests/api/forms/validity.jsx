/** @jsxImportSource pota */

// Tests for the constraint-validation API — `validity` flags and
// `checkValidity()` for required, type, pattern, range overflow/
// underflow.

import { $, test } from '#test'
import { render } from 'pota'

await test('forms - required empty input reports invalid via validity', expect => {
	const dispose = render(
		<form>
			<input name="name" required />
		</form>,
	)

	const input = $('input')
	expect(input.validity.valueMissing).toBe(true)
	expect(input.checkValidity()).toBe(false)

	dispose()
})

await test('forms - email input with invalid value reports typeMismatch', expect => {
	const dispose = render(
		<input type="email" prop:value="not-an-email" />,
	)

	expect($('input').validity.typeMismatch).toBe(true)

	dispose()
})

await test('forms - pattern mismatch reports patternMismatch', expect => {
	const dispose = render(<input pattern="[0-9]+" prop:value="abc" />)

	expect($('input').validity.patternMismatch).toBe(true)

	dispose()
})

await test('forms - number input out of range reports rangeOverflow', expect => {
	const dispose = render(
		<input type="number" max="10" prop:value={20} />,
	)

	expect($('input').validity.rangeOverflow).toBe(true)

	dispose()
})

await test('forms - number input under min reports rangeUnderflow', expect => {
	const dispose = render(
		<input type="number" min="5" prop:value={1} />,
	)

	expect($('input').validity.rangeUnderflow).toBe(true)

	dispose()
})
