/** @jsxImportSource pota */

// Tests for form-related events and click semantics:
// focus/blur on input, label click focuses associated input,
// button default type=submit vs type=button, submit prevent,
// novalidate, input vs change events, disabled-button click
// suppression, label association by nesting and `for`.

import { $, test } from '#test'
import { render } from 'pota'

// --- input focus and blur events --------------------------------------------

await test('forms - focus and blur events fire on input', expect => {
	const events = []
	const dispose = render(
		<input
			on:focus={() => events.push('focus')}
			on:blur={() => events.push('blur')}
		/>,
	)

	// baseline: no events yet
	expect(events).toEqual([])

	const input = $('input')
	input.focus()
	expect(events).toEqual(['focus'])

	input.blur()
	expect(events).toEqual(['focus', 'blur'])

	dispose()
})

// --- label association -------------------------------------------------------

await test('forms - clicking a label focuses its associated input', expect => {
	const dispose = render(
		<form>
			<label for="my-input">Name</label>
			<input id="my-input" />
		</form>,
	)

	$('label').click()
	expect(document.activeElement).toBe($('#my-input'))

	dispose()
})

await test('forms - label wrapping an input focuses it on click', expect => {
	const dispose = render(
		<form>
			<label>
				Email
				<input type="email" name="email" />
			</label>
		</form>,
	)

	$('label').click()
	expect(document.activeElement).toBe($('input'))

	dispose()
})

// --- default button type inside form -----------------------------------------

await test('forms - button inside form defaults to type submit', expect => {
	const dispose = render(
		<form>
			<button>Submit</button>
		</form>,
	)

	expect($('button').type).toBe('submit')

	dispose()
})

await test('forms - button with explicit type=button does not submit', expect => {
	let submitted = false
	const dispose = render(
		<form
			on:submit={e => {
				e.preventDefault()
				submitted = true
			}}
		>
			<button type="button">Click</button>
		</form>,
	)

	$('button').click()
	expect(submitted).toBe(false)

	dispose()
})

// --- form novalidate ---------------------------------------------------------

await test('forms - submit with novalidate bypasses validation', expect => {
	let submitted = false
	const dispose = render(
		<form
			on:submit={e => {
				e.preventDefault()
				submitted = true
			}}
		>
			<input name="email" type="email" required />
			<button type="submit" formnovalidate>
				Skip Validation
			</button>
		</form>,
	)

	// empty required field, but novalidate should bypass
	$('button').click()
	expect(submitted).toBe(true)

	dispose()
})

// --- input events: change vs input -------------------------------------------

await test('forms - input event fires on typing, change on blur', expect => {
	const inputEvents = []
	const changeEvents = []

	const dispose = render(
		<input
			on:input={() => inputEvents.push('input')}
			on:change={() => changeEvents.push('change')}
		/>,
	)

	const el = $('input')
	el.value = 'typed'
	el.dispatchEvent(new Event('input', { bubbles: true }))

	expect(inputEvents).toEqual(['input'])
	expect(changeEvents).toEqual([])

	el.dispatchEvent(new Event('change', { bubbles: true }))
	expect(changeEvents).toEqual(['change'])

	dispose()
})

// --- disabled input does not fire click --------------------------------------

await test('forms - disabled button does not fire click handler', expect => {
	const clicks = []
	const dispose = render(
		<button disabled on:click={() => clicks.push('click')}>
			No Click
		</button>,
	)

	$('button').click()
	expect(clicks).toEqual([])

	dispose()
})

// --- form submit event with preventDefault -----------------------------------

await test('forms - submit event can be prevented', expect => {
	let submitted = false
	const dispose = render(
		<form
			on:submit={e => {
				e.preventDefault()
				submitted = true
			}}
		>
			<button type="submit">Go</button>
		</form>,
	)

	$('button').click()
	expect(submitted).toBe(true)

	dispose()
})

// --- input inside label via nesting -----------------------------------

await test('forms - input nested inside a label is associated implicitly', expect => {
	const dispose = render(
		<label>
			name
			<input name="username" />
		</label>,
	)

	const label = $('label')
	const input = $('input')

	// clicking the label focuses the input
	expect(label.contains(input)).toBe(true)

	dispose()
})

// --- label with for attribute associates explicitly ------------------

await test('forms - label with for associates explicitly to input by id', expect => {
	const dispose = render(
		<>
			<label for="field-a">name</label>
			<input id="field-a" name="username" />
		</>,
	)

	expect($('label').htmlFor).toBe('field-a')
	expect($('input').id).toBe('field-a')

	dispose()
})
