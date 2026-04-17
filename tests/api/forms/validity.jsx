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

// --- stepMismatch ----------------------------------------------------

await test('forms - number input off step reports stepMismatch', expect => {
	const dispose = render(
		<input type="number" step="5" prop:value={7} />,
	)

	expect($('input').validity.stepMismatch).toBe(true)
	expect($('input').checkValidity()).toBe(false)

	dispose()
})

// --- setCustomValidity -> customError --------------------------------

await test('forms - setCustomValidity makes the input customError and invalid', expect => {
	const dispose = render(
		<input type="text" prop:value="anything" />,
	)

	const input = $('input')
	expect(input.validity.valid).toBe(true)

	input.setCustomValidity('broken')

	expect(input.validity.customError).toBe(true)
	expect(input.validity.valid).toBe(false)
	expect(input.validationMessage).toBe('broken')
	expect(input.checkValidity()).toBe(false)

	// Clearing the custom message restores validity.
	input.setCustomValidity('')
	expect(input.validity.customError).toBe(false)
	expect(input.validity.valid).toBe(true)

	dispose()
})

// --- form.checkValidity and reportValidity ---------------------------

await test('forms - form.checkValidity fails when any field is invalid', expect => {
	const dispose = render(
		<form>
			<input name="a" required />
			<input name="b" type="email" prop:value="not-email" />
		</form>,
	)

	const form = $('form')
	// form.checkValidity walks every contained field; either invalid
	// field makes the whole form invalid.
	expect(form.checkValidity()).toBe(false)

	// reportValidity returns the same boolean as checkValidity — the
	// UI side-effect (showing the browser validation bubble) is best
	// left untested in a headless environment.
	expect(form.reportValidity()).toBe(false)

	dispose()
})

await test('forms - form.checkValidity passes when every field is valid', expect => {
	const dispose = render(
		<form>
			<input name="a" prop:value="x" />
			<input name="b" type="number" prop:value={3} />
		</form>,
	)

	const form = $('form')
	expect(form.checkValidity()).toBe(true)
	expect(form.reportValidity()).toBe(true)

	dispose()
})

// --- novalidate on form suppresses implicit validation -----------------

await test('forms - novalidate on form still exposes per-field validity flags', expect => {
	const dispose = render(
		<form noValidate>
			<input name="a" required />
		</form>,
	)

	// The form attribute prevents submission-time validation, but the
	// individual field's ValidityState is still populated.
	expect($('input').validity.valueMissing).toBe(true)

	dispose()
})
