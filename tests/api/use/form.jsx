// Tests for pota/use/form: isDisabled, focusNextInput, form2object
// (submitter, multiple values), object2form (checkbox, radio), and
// the JSX prop-plugins use:click-focus-children-input,
// use:enter-focus-next, use:prevent-enter, and use:size-to-input.
/** @jsxImportSource pota */

import { microtask, test, $ } from '#test'

import { render } from 'pota'
import {
	focusNextInput,
	form2object,
	isDisabled,
	object2form,
} from 'pota/use/form'
import 'pota/use/form'

// --- isDisabled -------------------------------------------------------------

await test('form - isDisabled returns true for directly disabled element', expect => {
	const dispose = render(
		<form>
			<input
				name="off"
				disabled
			/>
			<input name="on" />
		</form>,
	)

	expect(isDisabled($('input[name="off"]'))).toBe(true)
	expect(isDisabled($('input[name="on"]'))).toBe(false)

	dispose()
})

await test('form - isDisabled returns true for element inside disabled fieldset', expect => {
	const dispose = render(
		<form>
			<fieldset disabled>
				<input name="child" />
			</fieldset>
			<input name="outside" />
		</form>,
	)

	expect(isDisabled($('input[name="child"]'))).toBe(true)
	expect(isDisabled($('input[name="outside"]'))).toBe(false)

	dispose()
})

// --- focusNextInput ---------------------------------------------------------

await test('form - focusNextInput advances focus to the next element', expect => {
	const form = document.createElement('form')
	const first = document.createElement('input')
	const second = document.createElement('input')
	form.append(first, second)
	document.body.appendChild(form)

	let prevented = false
	let stopped = false
	first.focus()

	focusNextInput(first, {
		preventDefault() {
			prevented = true
		},
		stopPropagation() {
			stopped = true
		},
	})

	expect(document.activeElement).toBe(second)
	expect(prevented).toBe(true)
	expect(stopped).toBe(true)

	form.remove()
})

await test('form - focusNextInput does nothing when node is the last element', expect => {
	const form = document.createElement('form')
	const first = document.createElement('input')
	const last = document.createElement('input')
	form.append(first, last)
	document.body.appendChild(form)

	last.focus()

	let prevented = false
	focusNextInput(last, {
		preventDefault() {
			prevented = true
		},
		stopPropagation() {},
	})

	// focus stays on last; no event prevented because there is no next element
	expect(document.activeElement).toBe(last)
	expect(prevented).toBe(false)

	form.remove()
})

await test('form - focusNextInput does nothing when node has no form', expect => {
	const input = document.createElement('input')
	document.body.appendChild(input)
	input.focus()

	let prevented = false
	focusNextInput(input, {
		preventDefault() {
			prevented = true
		},
		stopPropagation() {},
	})

	expect(document.activeElement).toBe(input)
	expect(prevented).toBe(false)

	input.remove()
})

// --- form2object ------------------------------------------------------------

await test('form - form2object collects field values into a plain object', expect => {
	const form = document.createElement('form')
	form.innerHTML = `
		<input name="title" value="hello">
		<input type="checkbox" name="published" checked>
		<input type="radio" name="kind" value="a">
		<input type="radio" name="kind" value="b" checked>
		<select name="tags" multiple>
			<option value="x" selected>x</option>
			<option value="y">y</option>
			<option value="z" selected>z</option>
		</select>
		<input name="tag" value="one">
		<input name="tag" value="two">
	`

	expect(form2object(form)).toEqual({
		title: 'hello',
		published: 'on',
		kind: 'b',
		tags: ['x', 'z'],
		tag: ['one', 'two'],
	})
})

await test('form - form2object merges into an existing object when provided', expect => {
	const form = document.createElement('form')
	form.innerHTML = `<input name="a" value="1"><input name="b" value="2">`

	const base = { existing: true }
	const result = form2object(form, base)

	expect(result).toBe(base)
	expect(result.existing).toBe(true)
	expect(result.a).toBe('1')
	expect(result.b).toBe('2')
})

// --- object2form ------------------------------------------------------------

await test('form - object2form restores text, checkbox, radio, and select values', expect => {
	const form = document.createElement('form')
	form.innerHTML = `
		<input name="title" value="hello">
		<input type="checkbox" name="published" checked>
		<input type="radio" name="kind" value="a">
		<input type="radio" name="kind" value="b" checked>
	`

	object2form(form, {
		title: 'updated',
		published: false,
		kind: 'a',
	})

	expect(form.querySelector('[name=title]').value).toBe('updated')
	expect(form.querySelector('[name=published]').checked).toBe(false)
	expect(form.querySelector('[name=kind][value=a]').checked).toBe(
		true,
	)
	expect(form.querySelector('[name=kind][value=b]').checked).toBe(
		false,
	)
})

await test('form - object2form adds to multi-select (never clears existing selections)', expect => {
	const form = document.createElement('form')
	form.innerHTML = `
		<select name="tags" multiple>
			<option value="x" selected>x</option>
			<option value="y">y</option>
			<option value="z" selected>z</option>
		</select>
	`

	// object2form only sets options to selected=true, never clears them.
	// so x and z (already selected) remain; y is newly selected.
	// selectedOptions returns in DOM source order: x, y, z.
	object2form(form, { tags: ['y'] })

	expect(
		Array.from(form.querySelector('[name=tags]').selectedOptions).map(
			option => option.value,
		),
	).toEqual(['x', 'y', 'z'])
})

// --- JSX prop-plugins -------------------------------------------------------

await test('form - use:click-focus-children-input focuses first focusable child on click', async expect => {
	const dispose = render(
		<div use:click-focus-children-input={true}>
			<input id="child-input" />
		</div>,
	)

	await microtask()

	$('div').click()
	expect(document.activeElement.id).toBe('child-input')

	dispose()
})

await test('form - use:enter-focus-next advances focus when Enter is pressed', async expect => {
	const dispose = render(
		<form>
			<input
				id="first-input"
				use:enter-focus-next={true}
			/>
			<input id="second-input" />
		</form>,
	)

	await microtask()

	const first = $('#first-input')
	first.focus()
	first.dispatchEvent(
		new KeyboardEvent('keydown', { bubbles: true, code: 'Enter' }),
	)
	expect(document.activeElement.id).toBe('second-input')

	dispose()
})

await test('form - use:prevent-enter calls preventDefault on Enter', async expect => {
	const dispose = render(
		<input
			id="prevent-enter"
			use:prevent-enter={true}
		/>,
	)

	await microtask()

	let prevented = false
	const event = new KeyboardEvent('keydown', {
		bubbles: true,
		cancelable: true,
		code: 'Enter',
	})
	const originalPrevent = event.preventDefault.bind(event)
	event.preventDefault = () => {
		prevented = true
		originalPrevent()
	}
	$('#prevent-enter').dispatchEvent(event)
	expect(prevented).toBe(true)

	dispose()
})

await test('form - use:size-to-input sets initial height from scrollHeight and updates on focus', async expect => {
	const originalScrollHeight = Object.getOwnPropertyDescriptor(
		HTMLTextAreaElement.prototype,
		'scrollHeight',
	)
	const originalClientHeight = Object.getOwnPropertyDescriptor(
		HTMLDivElement.prototype,
		'clientHeight',
	)
	Object.defineProperty(
		HTMLTextAreaElement.prototype,
		'scrollHeight',
		{
			configurable: true,
			get() {
				return 40
			},
		},
	)
	Object.defineProperty(HTMLDivElement.prototype, 'clientHeight', {
		configurable: true,
		get() {
			return 50
		},
	})

	const dispose = render(
		<div id="textarea-parent">
			<textarea
				id="size-to-input"
				use:size-to-input={true}
			/>
		</div>,
	)

	await microtask()

	// initial height is set from scrollHeight (40)
	expect($('#size-to-input').style.height).toBe('40px')

	// focus triggers resizeToContainer: compares scrollHeight vs parentNode.clientHeight
	// clientHeight (50) > scrollHeight (40) → height set to clientHeight
	document
		.querySelector('#size-to-input')
		.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
	expect($('#size-to-input').style.height).toBe('50px')

	dispose()

	if (originalScrollHeight) {
		Object.defineProperty(
			HTMLTextAreaElement.prototype,
			'scrollHeight',
			originalScrollHeight,
		)
	}
	if (originalClientHeight) {
		Object.defineProperty(
			HTMLDivElement.prototype,
			'clientHeight',
			originalClientHeight,
		)
	}
})

await test('form - form2object includes submitter button name in result', expect => {
	const form = document.createElement('form')
	form.innerHTML = `
		<input name="field" value="val" />
		<button type="submit" name="action" value="save">Save</button>
	`
	document.body.append(form)

	const button = form.querySelector('button')
	const result = form2object(form, {}, button)

	expect(result.field).toBe('val')
	expect(result.action).toBe('save')

	form.remove()
})

await test('form - form2object collects multiple values with same name into array', expect => {
	const form = document.createElement('form')
	form.innerHTML = `
		<input name="tag" value="a" />
		<input name="tag" value="b" />
		<input name="tag" value="c" />
	`
	document.body.append(form)

	const result = form2object(form)

	expect(result.tag).toEqual(['a', 'b', 'c'])

	form.remove()
})

await test('form - object2form sets checkbox checked state', expect => {
	const form = document.createElement('form')
	form.innerHTML = `
		<input type="checkbox" name="agree" />
	`
	document.body.append(form)

	object2form(form, { agree: true })

	expect(form.querySelector('[name=agree]').checked).toBe(true)

	object2form(form, { agree: false })

	expect(form.querySelector('[name=agree]').checked).toBe(false)

	form.remove()
})

await test('form - object2form sets radio button by value', expect => {
	const form = document.createElement('form')
	form.innerHTML = `
		<input type="radio" name="color" value="red" />
		<input type="radio" name="color" value="blue" />
	`
	document.body.append(form)

	object2form(form, { color: 'blue' })

	const radios = form.querySelectorAll('[name=color]')
	expect(radios[0].checked).toBe(false)
	expect(radios[1].checked).toBe(true)

	form.remove()
})
