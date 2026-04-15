/** @jsxImportSource pota */

// Tests for native HTML form behaviors preserved by the renderer:
// form reset (all input types), reactive values via signals,
// label association, fieldset disabled, validity API, details/summary,
// data attributes, hidden inputs, progress/meter, template inertness,
// select multiple, optgroup, output, contenteditable, tabindex,
// novalidate, placeholder, form attribute association, input/change
// events, disabled button, defaultValue, indeterminate checkbox,
// readonly, aria attributes (string values), role, reactive
// constraints (required, min, max, step, pattern, maxlength, type,
// multiple), datalist, form.elements, focus/blur, selection range,
// spellcheck, wrap, and reactive class/style on form elements.
import { $, $$, body, microtask, test } from '#test'

import { render, signal } from 'pota'
import { isDisabled } from 'pota/use/form'

// --- form reset --------------------------------------------------------------

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

// --- reactive value changes via signals --------------------------------------

await test('forms - reactive text input value updates via signal', expect => {
	const val = signal('initial')
	const dispose = render(<input prop:value={val.read} />)

	expect($('input').value).toBe('initial')

	val.write('updated')
	expect($('input').value).toBe('updated')

	val.write('')
	expect($('input').value).toBe('')

	dispose()
})

await test('forms - reactive checkbox checked updates via signal', expect => {
	const checked = signal(false)
	const dispose = render(
		<input type="checkbox" prop:checked={checked.read} />,
	)

	expect($('input').checked).toBe(false)

	checked.write(true)
	expect($('input').checked).toBe(true)

	checked.write(false)
	expect($('input').checked).toBe(false)

	dispose()
})

await test('forms - reactive select value updates via signal', expect => {
	const val = signal('b')
	const dispose = render(
		<select prop:value={val.read}>
			<option value="a">A</option>
			<option value="b">B</option>
			<option value="c">C</option>
		</select>,
	)

	expect($('select').value).toBe('b')

	val.write('c')
	expect($('select').value).toBe('c')

	val.write('a')
	expect($('select').value).toBe('a')

	dispose()
})

await test('forms - reactive textarea value updates via signal', expect => {
	const val = signal('hello')
	const dispose = render(<textarea prop:value={val.read} />)

	expect($('textarea').value).toBe('hello')

	val.write('world')
	expect($('textarea').value).toBe('world')

	dispose()
})

await test('forms - reactive number input value updates via signal', expect => {
	const val = signal(10)
	const dispose = render(
		<input type="number" prop:value={val.read} />,
	)

	expect($('input').value).toBe('10')

	val.write(99)
	expect($('input').value).toBe('99')

	dispose()
})

await test('forms - reactive range input value updates via signal', expect => {
	const val = signal(25)
	const dispose = render(
		<input type="range" min="0" max="100" prop:value={val.read} />,
	)

	expect($('input').value).toBe('25')

	val.write(75)
	expect($('input').value).toBe('75')

	dispose()
})

await test('forms - reactive disabled attribute updates via signal', expect => {
	const off = signal(false)
	const dispose = render(<input disabled={off.read} />)

	expect($('input').disabled).toBe(false)

	off.write(true)
	expect($('input').disabled).toBe(true)

	off.write(false)
	expect($('input').disabled).toBe(false)

	dispose()
})

await test('forms - reactive radio selection updates via signal', expect => {
	const selected = signal('a')
	const dispose = render(
		<form>
			<input
				type="radio"
				name="pick"
				value="a"
				prop:checked={() => selected.read() === 'a'}
			/>
			<input
				type="radio"
				name="pick"
				value="b"
				prop:checked={() => selected.read() === 'b'}
			/>
		</form>,
	)

	expect($$('input')[0].checked).toBe(true)
	expect($$('input')[1].checked).toBe(false)

	selected.write('b')
	expect($$('input')[0].checked).toBe(false)
	expect($$('input')[1].checked).toBe(true)

	dispose()
})

await test('forms - reactive selected on option updates via signal', expect => {
	const which = signal('a')
	const dispose = render(
		<select>
			<option value="a" selected={() => which.read() === 'a'}>
				A
			</option>
			<option value="b" selected={() => which.read() === 'b'}>
				B
			</option>
			<option value="c" selected={() => which.read() === 'c'}>
				C
			</option>
		</select>,
	)

	expect($('select').value).toBe('a')

	which.write('c')
	expect($('select').value).toBe('c')

	which.write('b')
	expect($('select').value).toBe('b')

	dispose()
})

await test('forms - reactive selected on multiple select via signal', expect => {
	const items = signal(['a', 'c'])
	const dispose = render(
		<select multiple>
			<option value="a" selected={() => items.read().includes('a')}>
				A
			</option>
			<option value="b" selected={() => items.read().includes('b')}>
				B
			</option>
			<option value="c" selected={() => items.read().includes('c')}>
				C
			</option>
		</select>,
	)

	const selected = () =>
		Array.from($('select').selectedOptions).map(o => o.value)

	expect(selected()).toEqual(['a', 'c'])

	items.write(['b'])
	expect(selected()).toEqual(['b'])

	items.write(['a', 'b', 'c'])
	expect(selected()).toEqual(['a', 'b', 'c'])

	dispose()
})

await test('forms - reactive selected toggled on single option', expect => {
	const active = signal(true)
	const dispose = render(
		<select>
			<option value="x">X</option>
			<option value="y" selected={active.read}>
				Y
			</option>
		</select>,
	)

	expect($('select').value).toBe('y')

	active.write(false)
	// when selected is removed, browser falls back to first option
	expect($('select').value).toBe('x')

	active.write(true)
	expect($('select').value).toBe('y')

	dispose()
})

// --- reactive placeholder, min, max, step, pattern, required ----------------

await test('forms - reactive required attribute toggles via signal', expect => {
	const req = signal(false)
	const dispose = render(<input required={req.read} />)

	expect($('input').required).toBe(false)

	req.write(true)
	expect($('input').required).toBe(true)

	req.write(false)
	expect($('input').required).toBe(false)

	dispose()
})

await test('forms - reactive min and max attributes update via signal', expect => {
	const min = signal('0')
	const max = signal('100')
	const dispose = render(
		<input type="number" min={min.read} max={max.read} />,
	)

	expect($('input').min).toBe('0')
	expect($('input').max).toBe('100')

	min.write('10')
	max.write('50')
	expect($('input').min).toBe('10')
	expect($('input').max).toBe('50')

	dispose()
})

await test('forms - reactive step attribute updates via signal', expect => {
	const step = signal('1')
	const dispose = render(<input type="number" step={step.read} />)

	expect($('input').step).toBe('1')

	step.write('0.5')
	expect($('input').step).toBe('0.5')

	dispose()
})

await test('forms - reactive pattern attribute updates via signal', expect => {
	const pattern = signal('[A-Z]+')
	const dispose = render(<input pattern={pattern.read} />)

	expect($('input').pattern).toBe('[A-Z]+')

	pattern.write('[0-9]+')
	expect($('input').pattern).toBe('[0-9]+')

	dispose()
})

await test('forms - reactive readonly toggles via signal', expect => {
	const ro = signal(false)
	const dispose = render(
		<input prop:readOnly={ro.read} value="text" />,
	)

	expect($('input').readOnly).toBe(false)

	ro.write(true)
	expect($('input').readOnly).toBe(true)

	ro.write(false)
	expect($('input').readOnly).toBe(false)

	dispose()
})

await test('forms - reactive maxlength attribute updates via signal', expect => {
	const ml = signal('10')
	const dispose = render(<input maxlength={ml.read} />)

	expect($('input').maxLength).toBe(10)

	ml.write('5')
	expect($('input').maxLength).toBe(5)

	dispose()
})

// --- validity API -----------------------------------------------------------

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

// --- input type switching ---------------------------------------------------

await test('forms - reactive type attribute switches input behavior', expect => {
	const type = signal('text')
	const dispose = render(<input prop:type={type.read} />)

	expect($('input').type).toBe('text')

	type.write('password')
	expect($('input').type).toBe('password')

	type.write('email')
	expect($('input').type).toBe('email')

	dispose()
})

// --- multiple attribute on select -------------------------------------------

await test('forms - reactive multiple attribute on select', expect => {
	const multi = signal(false)
	const dispose = render(
		<select prop:multiple={multi.read}>
			<option value="a">A</option>
			<option value="b">B</option>
		</select>,
	)

	expect($('select').multiple).toBe(false)

	multi.write(true)
	expect($('select').multiple).toBe(true)

	dispose()
})

// --- reactive class and style on form elements ------------------------------

await test('forms - reactive class on input toggles via signal', expect => {
	const cls = signal('plain')
	const dispose = render(<input class={cls.read} />)

	expect($('input').className).toBe('plain')

	cls.write('error')
	expect($('input').className).toBe('error')

	dispose()
})

await test('forms - reactive style on input updates via signal', expect => {
	const color = signal('black')
	const dispose = render(<input style:color={color.read} />)

	expect($('input').style.color).toBe('black')

	color.write('red')
	expect($('input').style.color).toBe('red')

	dispose()
})

// --- textarea rows and cols -------------------------------------------------

await test('forms - reactive rows and cols on textarea', expect => {
	const rows = signal('3')
	const cols = signal('40')
	const dispose = render(
		<textarea rows={rows.read} cols={cols.read} />,
	)

	expect($('textarea').rows).toBe(3)
	expect($('textarea').cols).toBe(40)

	rows.write('10')
	cols.write('80')
	expect($('textarea').rows).toBe(10)
	expect($('textarea').cols).toBe(80)

	dispose()
})

// --- input autocomplete and name --------------------------------------------

await test('forms - reactive name attribute updates via signal', expect => {
	const name = signal('first')
	const dispose = render(<input name={name.read} />)

	expect($('input').name).toBe('first')

	name.write('last')
	expect($('input').name).toBe('last')

	dispose()
})

await test('forms - autocomplete attribute renders correctly', expect => {
	const dispose = render(<input autocomplete="email" />)

	expect($('input').autocomplete).toBe('email')

	dispose()
})

// --- datalist association ---------------------------------------------------

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

// --- form elements collection -----------------------------------------------

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

// --- reactive children inside form ------------------------------------------

await test('forms - reactive list of inputs via signal array', expect => {
	const fields = signal(['name', 'email'])
	const dispose = render(
		<form>
			{() =>
				fields.read().map(name => <input name={name} value={name} />)
			}
		</form>,
	)

	expect($$('input').length).toBe(2)
	expect($('input[name="name"]').value).toBe('name')
	expect($('input[name="email"]').value).toBe('email')

	fields.write(['name', 'email', 'phone'])
	expect($$('input').length).toBe(3)
	expect($('input[name="phone"]').value).toBe('phone')

	fields.write(['email'])
	expect($$('input').length).toBe(1)
	expect($('input[name="email"]')).not.toBe(null)

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

await test('forms - reactive disabled on fieldset toggles child states', expect => {
	const disabled = signal(false)
	const dispose = render(
		<form>
			<fieldset disabled={disabled.read}>
				<input name="field" />
			</fieldset>
		</form>,
	)

	expect($('input').matches(':disabled')).toBe(false)

	disabled.write(true)
	expect($('input').matches(':disabled')).toBe(true)

	disabled.write(false)
	expect($('input').matches(':disabled')).toBe(false)

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

await test('forms - reactive data attribute updates dataset', expect => {
	const val = signal('initial')
	const dispose = render(<div data-status={val.read}>content</div>)

	expect($('div').dataset.status).toBe('initial')

	val.write('updated')
	expect($('div').dataset.status).toBe('updated')

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

await test('forms - reactive open on details toggles programmatically', expect => {
	const open = signal(false)
	const dispose = render(
		<details prop:open={open.read}>
			<summary>Toggle</summary>
			<p>Body</p>
		</details>,
	)

	expect($('details').open).toBe(false)

	open.write(true)
	expect($('details').open).toBe(true)

	open.write(false)
	expect($('details').open).toBe(false)

	dispose()
})

// --- progress and meter ------------------------------------------------------

await test('forms - progress element reflects value and max', expect => {
	const val = signal(30)
	const dispose = render(<progress prop:value={val.read} max="100" />)

	const progress = $('progress')
	expect(progress.value).toBe(30)
	expect(progress.max).toBe(100)

	val.write(75)
	expect(progress.value).toBe(75)

	dispose()
})

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

// --- output element ----------------------------------------------------------

await test('forms - output element displays computed value', expect => {
	const result = signal('0')
	const dispose = render(
		<form>
			<output name="result">{result.read}</output>
		</form>,
	)

	expect($('output').textContent).toBe('0')

	result.write('42')
	expect($('output').textContent).toBe('42')

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

// --- contenteditable ---------------------------------------------------------

await test('forms - contenteditable div is editable', expect => {
	const dispose = render(<div contenteditable="true">editable</div>)

	const el = $('div')
	expect(el.isContentEditable).toBe(true)
	expect(el.textContent).toBe('editable')

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

// --- input placeholder -------------------------------------------------------

await test('forms - placeholder attribute renders on input', expect => {
	const ph = signal('Enter name...')
	const dispose = render(<input placeholder={ph.read} />)

	expect($('input').placeholder).toBe('Enter name...')

	ph.write('Type here')
	expect($('input').placeholder).toBe('Type here')

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

// --- aria attributes ---------------------------------------------------------

await test('forms - aria attributes render correctly', expect => {
	const expanded = signal(/** @type {'false' | 'true'} */ ('false'))
	const dispose = render(
		<button aria-expanded={expanded.read} aria-label="Toggle menu">
			Menu
		</button>,
	)

	const btn = $('button')
	expect(btn.getAttribute('aria-label')).toBe('Toggle menu')
	expect(btn.getAttribute('aria-expanded')).toBe('false')

	expanded.write('true')
	expect(btn.getAttribute('aria-expanded')).toBe('true')

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

// --- input value binding via signal ------------------------------------

await test('forms - input value from a signal updates reactively', expect => {
	const text = signal('initial')

	const dispose = render(
		<input type="text" prop:value={() => text.read()} />,
	)

	expect($('input').value).toBe('initial')

	text.write('updated')
	expect($('input').value).toBe('updated')

	dispose()
})
