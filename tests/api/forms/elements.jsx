/** @jsxImportSource pota */

// Tests for specialty form elements and their behaviors:
// datalist, form.elements collection, optgroup, fieldset/legend,
// details/summary, meter, template inertness, select multiple,
// contenteditable, form-attribute association.

import { $, $$, test } from '#test'
import { render } from 'pota'
import { isDisabled } from 'pota/use/form'

await test('forms - input with list attribute associates to datalist', expect => {
	const dispose = render(
		<div>
			<input list="fruits" name="fruit" />
			<datalist id="fruits">
				<option value="Apple" />
				<option value="Banana" />
				<option value="Cherry" />
			</datalist>
		</div>,
	)

	expect($('input').getAttribute('list')).toBe('fruits')
	expect($('datalist')).not.toBe(null)
	expect($$('datalist option').length).toBe(3)

	dispose()
})

await test('forms - form.elements contains all named controls', expect => {
	const dispose = render(
		<form>
			<input name="a" />
			<input name="b" />
			<select name="c">
				<option>x</option>
			</select>
			<textarea name="d" />
		</form>,
	)

	const form = $('form')
	expect(form.elements.length).toBe(4)
	expect(form.elements.namedItem('a')).toBe($('input[name="a"]'))
	expect(form.elements.namedItem('c')).toBe($('select'))
	expect(form.elements.namedItem('d')).toBe($('textarea'))

	dispose()
})

// --- optgroup disabled cascades to options ----------------------------------

await test('forms - disabled optgroup disables its options', expect => {
	const dispose = render(
		<select>
			<optgroup label="Disabled" disabled>
				<option value="a">A</option>
			</optgroup>
			<optgroup label="Enabled">
				<option value="b">B</option>
			</optgroup>
		</select>,
	)

	expect($$('optgroup')[0].disabled).toBe(true)
	expect($$('optgroup')[1].disabled).toBe(false)
	// options inside disabled optgroup match :disabled
	expect($$('option')[0].matches(':disabled')).toBe(true)
	expect($$('option')[1].matches(':disabled')).toBe(false)

	dispose()
})

// --- fieldset disabled -------------------------------------------------------

await test('forms - disabled fieldset disables all child inputs', expect => {
	const dispose = render(
		<form>
			<fieldset disabled>
				<input name="a" />
				<select name="b">
					<option>x</option>
				</select>
				<textarea name="c" />
				<button type="button">btn</button>
			</fieldset>
		</form>,
	)

	expect($('fieldset').hasAttribute('disabled')).toBe(true)
	expect(isDisabled($('input[name="a"]'))).toBe(true)
	expect(isDisabled($('select[name="b"]'))).toBe(true)
	expect(isDisabled($('textarea[name="c"]'))).toBe(true)
	expect(isDisabled($('button'))).toBe(true)

	dispose()
})

// --- details / summary -------------------------------------------------------

await test('forms - details element toggles open state', expect => {
	const dispose = render(
		<details>
			<summary>Title</summary>
			<p>Content</p>
		</details>,
	)

	const details = $('details')
	expect(details.open).toBe(false)

	$('summary').click()
	expect(details.open).toBe(true)

	$('summary').click()
	expect(details.open).toBe(false)

	dispose()
})

await test('forms - details with open attribute starts expanded', expect => {
	const dispose = render(
		<details open>
			<summary>Title</summary>
			<p>Visible</p>
		</details>,
	)

	expect($('details').open).toBe(true)

	dispose()
})

// --- meter ------------------------------------------------------------------

await test('forms - meter element reflects value, min, max', expect => {
	const dispose = render(
		<meter prop:value={60} min="0" max="100" low="25" high="75" />,
	)

	const meter = $('meter')
	expect(meter.value).toBe(60)
	expect(meter.min).toBe(0)
	expect(meter.max).toBe(100)

	dispose()
})

// --- template element is inert -----------------------------------------------

await test('forms - template element content is not rendered to DOM', expect => {
	const dispose = render(
		<div>
			<template>
				<p>hidden</p>
			</template>
			<p>visible</p>
		</div>,
	)

	// template content should not be in the rendered DOM
	expect($$('p').length).toBe(1)
	expect($('p').textContent).toBe('visible')

	dispose()
})

// --- select multiple ---------------------------------------------------------

await test('forms - select multiple tracks multiple selections', expect => {
	const dispose = render(
		<form>
			<select name="items" multiple>
				<option value="a">A</option>
				<option value="b" selected>
					B
				</option>
				<option value="c" selected>
					C
				</option>
			</select>
			<button type="reset">Reset</button>
		</form>,
	)

	const select = $('select')
	const selected = Array.from(select.selectedOptions).map(
		o => o.value,
	)
	expect(selected).toEqual(['b', 'c'])

	// deselect all, select a
	for (const o of select.options) o.selected = false
	select.options[0].selected = true

	expect(
		Array.from(select.selectedOptions).map(o => o.value),
	).toEqual(['a'])

	$('button[type="reset"]').click()

	expect(
		Array.from(select.selectedOptions).map(o => o.value),
	).toEqual(['b', 'c'])

	dispose()
})

// --- optgroup ----------------------------------------------------------------

await test('forms - optgroup renders and groups options', expect => {
	const dispose = render(
		<select>
			<optgroup label="Fruits">
				<option value="apple">Apple</option>
				<option value="banana">Banana</option>
			</optgroup>
			<optgroup label="Veggies">
				<option value="carrot">Carrot</option>
			</optgroup>
		</select>,
	)

	expect($$('optgroup').length).toBe(2)
	expect($$('optgroup')[0].label).toBe('Fruits')
	expect($$('option').length).toBe(3)

	dispose()
})

// --- contenteditable ---------------------------------------------------------

await test('forms - contenteditable div is editable', expect => {
	const dispose = render(<div contenteditable="true">editable</div>)

	const el = $('div')
	expect(el.isContentEditable).toBe(true)
	expect(el.textContent).toBe('editable')

	dispose()
})

// --- form elements outside form via form attribute ---------------------------

await test('forms - input with form attribute associates to form by id', expect => {
	const dispose = render(
		<div>
			<form id="remote-form">
				<button type="reset">Reset</button>
			</form>
			<input form="remote-form" name="remote" value="original" />
		</div>,
	)

	const input = $('input[name="remote"]')
	expect(input.form.id).toBe('remote-form')

	input.value = 'changed'
	$('button[type="reset"]').click()
	expect(input.value).toBe('original')

	dispose()
})

// --- fieldset with legend renders ------------------------------------

await test('forms - fieldset and legend render correctly', expect => {
	const dispose = render(
		<fieldset>
			<legend>Personal Info</legend>
			<input name="name" />
		</fieldset>,
	)

	expect($('fieldset')).not.toBe(null)
	expect($('legend').textContent).toBe('Personal Info')
	expect($('input').name).toBe('name')

	dispose()
})

// --- disabled fieldset disables all inputs inside ---------------------

await test('forms - disabled fieldset disables all nested inputs', expect => {
	const dispose = render(
		<fieldset disabled>
			<input name="a" />
			<input name="b" />
			<button>submit</button>
		</fieldset>,
	)

	const [a, b] = $$('input')
	expect(isDisabled(a)).toBe(true)
	expect(isDisabled(b)).toBe(true)
	expect(isDisabled($('button'))).toBe(true)

	dispose()
})
