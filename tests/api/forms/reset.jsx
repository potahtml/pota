/** @jsxImportSource pota */

// Tests for `<button type="reset">` — restores defaultValue/
// defaultChecked/defaultSelected for every input type and dispatches
// the reset event.

import { $, $$, test } from '#test'
import { render } from 'pota'

await test('forms - reset button restores text inputs to default value', expect => {
	const dispose = render(
		<form id="reset-text">
			<input name="name" value="default" />
			<button type="reset">Reset</button>
		</form>,
	)

	const input = $('input[name="name"]')
	expect(input.value).toBe('default')

	input.value = 'typed'
	expect(input.value).toBe('typed')

	$('button[type="reset"]').click()
	expect(input.value).toBe('default')

	dispose()
})

await test('forms - reset button restores checkbox to default checked state', expect => {
	const dispose = render(
		<form>
			<input type="checkbox" name="agree" checked />
			<input type="checkbox" name="opt" />
			<button type="reset">Reset</button>
		</form>,
	)

	const agree = $('input[name="agree"]')
	const opt = $('input[name="opt"]')

	expect(agree.checked).toBe(true)
	expect(opt.checked).toBe(false)

	agree.checked = false
	opt.checked = true

	$('button[type="reset"]').click()

	expect(agree.checked).toBe(true)
	expect(opt.checked).toBe(false)

	dispose()
})

await test('forms - reset button restores radio group to default selection', expect => {
	const dispose = render(
		<form>
			<input type="radio" name="color" value="red" />
			<input type="radio" name="color" value="blue" checked />
			<input type="radio" name="color" value="green" />
			<button type="reset">Reset</button>
		</form>,
	)

	const radios = $$('input[name="color"]')
	expect(radios[1].checked).toBe(true)

	radios[2].checked = true
	expect(radios[1].checked).toBe(false)

	$('button[type="reset"]').click()

	expect(radios[0].checked).toBe(false)
	expect(radios[1].checked).toBe(true)
	expect(radios[2].checked).toBe(false)

	dispose()
})

await test('forms - reset button restores select to default selected option', expect => {
	const dispose = render(
		<form>
			<select name="fruit">
				<option value="apple">Apple</option>
				<option value="banana" selected>
					Banana
				</option>
				<option value="cherry">Cherry</option>
			</select>
			<button type="reset">Reset</button>
		</form>,
	)

	const select = $('select')
	expect(select.value).toBe('banana')

	select.value = 'cherry'
	expect(select.value).toBe('cherry')

	$('button[type="reset"]').click()
	expect(select.value).toBe('banana')

	dispose()
})

await test('forms - reset button restores textarea to default content', expect => {
	const dispose = render(
		<form>
			<textarea name="notes">original</textarea>
			<button type="reset">Reset</button>
		</form>,
	)

	const textarea = $('textarea')
	expect(textarea.value).toBe('original')

	textarea.value = 'edited'

	$('button[type="reset"]').click()
	expect(textarea.value).toBe('original')

	dispose()
})

await test('forms - reset button restores range input to default value', expect => {
	const dispose = render(
		<form>
			<input type="range" name="vol" min="0" max="100" value="50" />
			<button type="reset">Reset</button>
		</form>,
	)

	const input = $('input[name="vol"]')
	expect(input.value).toBe('50')

	input.value = '80'
	expect(input.value).toBe('80')

	$('button[type="reset"]').click()
	expect(input.value).toBe('50')

	dispose()
})

await test('forms - reset button restores color input to default value', expect => {
	const dispose = render(
		<form>
			<input type="color" name="bg" value="#ff0000" />
			<button type="reset">Reset</button>
		</form>,
	)

	const input = $('input[name="bg"]')
	expect(input.value).toBe('#ff0000')

	input.value = '#00ff00'
	expect(input.value).toBe('#00ff00')

	$('button[type="reset"]').click()
	expect(input.value).toBe('#ff0000')

	dispose()
})

await test('forms - reset button restores date input to default value', expect => {
	const dispose = render(
		<form>
			<input type="date" name="dob" value="2020-01-15" />
			<button type="reset">Reset</button>
		</form>,
	)

	const input = $('input[name="dob"]')
	expect(input.value).toBe('2020-01-15')

	input.value = '2023-06-01'
	expect(input.value).toBe('2023-06-01')

	$('button[type="reset"]').click()
	expect(input.value).toBe('2020-01-15')

	dispose()
})

await test('forms - reset button restores time input to default value', expect => {
	const dispose = render(
		<form>
			<input type="time" name="alarm" value="08:30" />
			<button type="reset">Reset</button>
		</form>,
	)

	const input = $('input[name="alarm"]')
	expect(input.value).toBe('08:30')

	input.value = '14:00'
	expect(input.value).toBe('14:00')

	$('button[type="reset"]').click()
	expect(input.value).toBe('08:30')

	dispose()
})

await test('forms - reset button restores number input to default value', expect => {
	const dispose = render(
		<form>
			<input type="number" name="qty" value="5" />
			<button type="reset">Reset</button>
		</form>,
	)

	const input = $('input[name="qty"]')
	expect(input.value).toBe('5')

	input.value = '99'
	expect(input.value).toBe('99')

	$('button[type="reset"]').click()
	expect(input.value).toBe('5')

	dispose()
})

await test('forms - reset button restores hidden input value', expect => {
	const dispose = render(
		<form>
			<input type="hidden" name="token" value="secret" />
			<input name="visible" value="hello" />
			<button type="reset">Reset</button>
		</form>,
	)

	const hidden = $('input[name="token"]')
	const visible = $('input[name="visible"]')

	// baseline: defaults rendered correctly
	expect(hidden.value).toBe('secret')
	expect(visible.value).toBe('hello')

	hidden.value = 'changed'
	visible.value = 'changed'

	// verify mutation took effect
	expect(hidden.value).toBe('changed')
	expect(visible.value).toBe('changed')

	$('button[type="reset"]').click()

	// hidden inputs: setting .value also updates the attribute,
	// so reset restores from defaultValue which was also overwritten
	expect(hidden.value).toBe('changed')
	expect(visible.value).toBe('hello')

	dispose()
})

await test('forms - reset button clears file input', expect => {
	const dispose = render(
		<form>
			<input type="file" name="upload" />
			<button type="reset">Reset</button>
		</form>,
	)

	const input = $('input[name="upload"]')

	// baseline: file input starts empty
	expect(input.value).toBe('')
	expect(input.type).toBe('file')

	// reset clears any selection back to empty
	$('button[type="reset"]').click()
	expect(input.value).toBe('')

	dispose()
})

await test('forms - reset button restores output to default value', expect => {
	const dispose = render(
		<form>
			<output name="result">42</output>
			<button type="reset">Reset</button>
		</form>,
	)

	const output = $('output')
	expect(output.value).toBe('42')
	expect(output.defaultValue).toBe('42')

	output.value = '99'
	expect(output.value).toBe('99')

	$('button[type="reset"]').click()
	expect(output.value).toBe('42')

	dispose()
})

await test('forms - reset button restores password input to default value', expect => {
	const dispose = render(
		<form>
			<input type="password" name="pass" value="initial" />
			<button type="reset">Reset</button>
		</form>,
	)

	const input = $('input[name="pass"]')
	expect(input.value).toBe('initial')

	input.value = 'changed'
	expect(input.value).toBe('changed')

	$('button[type="reset"]').click()
	expect(input.value).toBe('initial')

	dispose()
})

await test('forms - reset button restores email input to default value', expect => {
	const dispose = render(
		<form>
			<input type="email" name="mail" value="a@b.com" />
			<button type="reset">Reset</button>
		</form>,
	)

	const input = $('input[name="mail"]')
	expect(input.value).toBe('a@b.com')

	input.value = 'x@y.com'
	expect(input.value).toBe('x@y.com')

	$('button[type="reset"]').click()
	expect(input.value).toBe('a@b.com')

	dispose()
})

await test('forms - reset button restores search input to default value', expect => {
	const dispose = render(
		<form>
			<input type="search" name="q" value="initial query" />
			<button type="reset">Reset</button>
		</form>,
	)

	const input = $('input[name="q"]')

	// baseline: default value rendered
	expect(input.value).toBe('initial query')

	input.value = 'changed'
	expect(input.value).toBe('changed')

	$('button[type="reset"]').click()
	expect(input.value).toBe('initial query')

	dispose()
})

await test('forms - reset button restores url input to default value', expect => {
	const dispose = render(
		<form>
			<input type="url" name="site" value="https://example.com" />
			<button type="reset">Reset</button>
		</form>,
	)

	const input = $('input[name="site"]')

	// baseline: default value rendered
	expect(input.value).toBe('https://example.com')

	input.value = 'https://other.com'
	expect(input.value).toBe('https://other.com')

	$('button[type="reset"]').click()
	expect(input.value).toBe('https://example.com')

	dispose()
})

await test('forms - reset button restores tel input to default value', expect => {
	const dispose = render(
		<form>
			<input type="tel" name="phone" value="555-1234" />
			<button type="reset">Reset</button>
		</form>,
	)

	const input = $('input[name="phone"]')

	// baseline: default value rendered
	expect(input.value).toBe('555-1234')

	input.value = '999-0000'
	expect(input.value).toBe('999-0000')

	$('button[type="reset"]').click()
	expect(input.value).toBe('555-1234')

	dispose()
})

await test('forms - reset button restores datetime-local input', expect => {
	const dispose = render(
		<form>
			<input
				type="datetime-local"
				name="when"
				value="2020-01-01T12:00"
			/>
			<button type="reset">Reset</button>
		</form>,
	)

	const input = $('input[name="when"]')
	expect(input.value).toBe('2020-01-01T12:00')

	input.value = '2025-06-15T09:30'
	expect(input.value).toBe('2025-06-15T09:30')

	$('button[type="reset"]').click()
	expect(input.value).toBe('2020-01-01T12:00')

	dispose()
})

await test('forms - reset fires the reset event on the form', expect => {
	let resetFired = false
	const dispose = render(
		<form on:reset={() => (resetFired = true)}>
			<input name="x" value="a" />
			<button type="reset">Reset</button>
		</form>,
	)

	$('button[type="reset"]').click()
	expect(resetFired).toBe(true)

	dispose()
})

await test('forms - reset restores multiple fields at once', expect => {
	const dispose = render(
		<form>
			<input name="first" value="Ada" />
			<input name="last" value="Lovelace" />
			<input type="number" name="age" value="36" />
			<button type="reset">Reset</button>
		</form>,
	)

	$('input[name="first"]').value = 'Grace'
	$('input[name="last"]').value = 'Hopper'
	$('input[name="age"]').value = '85'

	$('button[type="reset"]').click()

	expect($('input[name="first"]').value).toBe('Ada')
	expect($('input[name="last"]').value).toBe('Lovelace')
	expect($('input[name="age"]').value).toBe('36')

	dispose()
})
