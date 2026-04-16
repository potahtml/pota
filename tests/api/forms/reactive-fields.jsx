/** @jsxImportSource pota */

// Tests for form fields whose value/checked/selected state is driven
// by a signal — text/checkbox/select/textarea/number/range inputs,
// radio groups, single/multi-select options, progress, output, and
// reactive list rendering inside a form.

import { $, $$, test } from '#test'
import { render, signal } from 'pota'

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

// --- progress + reactive value ---------------------------------------------

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

// --- output element with reactive content ----------------------------------

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

// --- direct value binding via signal ----------------------------------------

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
