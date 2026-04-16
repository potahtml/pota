/** @jsxImportSource pota */

// Tests for static HTML attributes and input state preservation:
// autocomplete, selectionStart/End, spellcheck, wrap, hidden value,
// data-*, range static values, tabindex, defaultValue, indeterminate,
// readonly, role, required, autofocus, number static, maxlength/
// minlength, pattern, form method/action/target/enctype.

import { $, $$, test } from '#test'
import { render } from 'pota'

await test('forms - autocomplete attribute renders correctly', expect => {
	const dispose = render(<input autocomplete="email" />)

	expect($('input').autocomplete).toBe('email')

	dispose()
})

// --- input selection range --------------------------------------------------

await test('forms - selectionStart and selectionEnd work on text input', expect => {
	const dispose = render(<input prop:value="hello world" />)

	const input = $('input')

	// baseline: value is set
	expect(input.value).toBe('hello world')

	input.setSelectionRange(0, 5)
	expect(input.selectionStart).toBe(0)
	expect(input.selectionEnd).toBe(5)

	dispose()
})

// --- spellcheck and wrap attributes -----------------------------------------

await test('forms - spellcheck attribute renders correctly', expect => {
	// @ts-expect-error prop:spellcheck not defined
	const dispose = render(<textarea prop:spellcheck={false} />)

	expect($('textarea').spellcheck).toBe(false)

	dispose()
})

await test('forms - wrap attribute on textarea', expect => {
	const dispose = render(<textarea wrap="off" />)

	expect($('textarea').wrap).toBe('off')

	dispose()
})

// --- hidden input carries value ----------------------------------------------

await test('forms - hidden input carries value but is not visible', expect => {
	const dispose = render(
		<form>
			<input type="hidden" name="token" value="abc123" />
		</form>,
	)

	const hidden = $('input[name="token"]')
	expect(hidden).not.toBe(null)
	expect(hidden.value).toBe('abc123')
	expect(hidden.type).toBe('hidden')

	dispose()
})

// --- data attributes ---------------------------------------------------------

await test('forms - data-* attributes are accessible via dataset', expect => {
	const dispose = render(
		<div data-id="42" data-name="test" data-is-active="true">
			content
		</div>,
	)

	const el = $('div')
	expect(el.dataset.id).toBe('42')
	expect(el.dataset.name).toBe('test')
	expect(el.dataset.isActive).toBe('true')

	dispose()
})

// --- input type=range --------------------------------------------------------

await test('forms - range input respects min, max, and value', expect => {
	const dispose = render(
		<input type="range" min="0" max="100" prop:value={50} />,
	)

	const input = $('input')
	expect(input.type).toBe('range')
	expect(input.value).toBe('50')
	expect(input.min).toBe('0')
	expect(input.max).toBe('100')

	dispose()
})

// --- tabindex ----------------------------------------------------------------

await test('forms - tabindex controls focus order', expect => {
	const dispose = render(
		<div>
			<input tabindex="2" />
			<input tabindex="1" />
			<input tabindex="3" />
		</div>,
	)

	const inputs = $$('input')
	expect(inputs[0].tabIndex).toBe(2)
	expect(inputs[1].tabIndex).toBe(1)
	expect(inputs[2].tabIndex).toBe(3)

	dispose()
})

// --- input defaultValue vs value ---------------------------------------------

await test('forms - defaultValue is preserved separately from value', expect => {
	const dispose = render(<input name="field" value="default" />)

	const input = $('input')
	expect(input.defaultValue).toBe('default')
	expect(input.value).toBe('default')

	input.value = 'changed'
	expect(input.value).toBe('changed')
	expect(input.defaultValue).toBe('default')

	dispose()
})

// --- checkbox indeterminate --------------------------------------------------

await test('forms - checkbox can be set to indeterminate state', expect => {
	const dispose = render(<input type="checkbox" />)

	const cb = $('input')
	cb.indeterminate = true

	expect(cb.indeterminate).toBe(true)
	expect(cb.checked).toBe(false)

	cb.click()
	expect(cb.checked).toBe(true)
	expect(cb.indeterminate).toBe(false)

	dispose()
})

// --- input readonly ----------------------------------------------------------

await test('forms - readonly input has value but cannot be edited by user', expect => {
	const dispose = render(<input readonly value="locked" />)

	const input = $('input')
	expect(input.readOnly).toBe(true)
	expect(input.value).toBe('locked')

	dispose()
})

// --- role attribute ----------------------------------------------------------

await test('forms - role attribute is set correctly', expect => {
	const dispose = render(<div role="alert">Important message</div>)

	expect($('div').getAttribute('role')).toBe('alert')

	dispose()
})

// --- required and autofocus attributes ----------------------------------

await test('forms - required attribute renders on input', expect => {
	const dispose = render(<input type="text" required />)

	expect($('input').required).toBe(true)

	dispose()
})

await test('forms - autofocus attribute renders on input', expect => {
	const dispose = render(<input type="text" autofocus />)

	expect($('input').autofocus).toBe(true)

	dispose()
})

// --- min, max, step on range and number -------------------------------

await test('forms - number input respects min, max, and step', expect => {
	const dispose = render(
		<input type="number" min="0" max="100" step="5" value="25" />,
	)

	const input = $('input')
	expect(input.min).toBe('0')
	expect(input.max).toBe('100')
	expect(input.step).toBe('5')
	expect(input.value).toBe('25')

	dispose()
})

// --- maxlength and minlength on text input ----------------------------

await test('forms - maxlength and minlength attributes on text input', expect => {
	const dispose = render(
		<input type="text" maxlength="10" minlength="3" />,
	)

	const input = $('input')
	expect(input.maxLength).toBe(10)
	expect(input.minLength).toBe(3)

	dispose()
})

// --- pattern attribute -------------------------------------------------

await test('forms - pattern attribute renders on input', expect => {
	const dispose = render(<input type="text" pattern="[A-Z]+" />)

	expect($('input').pattern).toBe('[A-Z]+')

	dispose()
})

// --- form method attribute --------------------------------------------

await test('forms - form method attribute reflects on form element', expect => {
	const dispose = render(<form method="post" />)

	expect($('form').method).toBe('post')

	dispose()
})

// --- form action attribute --------------------------------------------

await test('forms - form action attribute renders on form', expect => {
	const dispose = render(<form action="/submit" />)

	expect($('form').action.endsWith('/submit')).toBe(true)

	dispose()
})

// --- form target attribute --------------------------------------------

await test('forms - form target attribute renders on form', expect => {
	const dispose = render(<form target="_blank" />)

	expect($('form').target).toBe('_blank')

	dispose()
})

// --- form enctype attribute -------------------------------------------

await test('forms - form enctype=multipart/form-data renders on form', expect => {
	const dispose = render(<form enctype="multipart/form-data" />)

	expect($('form').enctype).toBe('multipart/form-data')

	dispose()
})
