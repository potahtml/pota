/** @jsxImportSource pota */

// Tests for HTML attributes whose value is driven by a signal —
// disabled, required, min/max/step, pattern, readonly, maxlength,
// type, multiple, class, style, rows/cols, name, fieldset disabled,
// data-*, details open, placeholder, aria-*.

import { $, test } from '#test'
import { render, signal } from 'pota'

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

// --- input name ------------------------------------------------------------

await test('forms - reactive name attribute updates via signal', expect => {
	const name = signal('first')
	const dispose = render(<input name={name.read} />)

	expect($('input').name).toBe('first')

	name.write('last')
	expect($('input').name).toBe('last')

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

await test('forms - reactive data attribute updates dataset', expect => {
	const val = signal('initial')
	const dispose = render(<div data-status={val.read}>content</div>)

	expect($('div').dataset.status).toBe('initial')

	val.write('updated')
	expect($('div').dataset.status).toBe('updated')

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

// --- input placeholder -------------------------------------------------------

await test('forms - placeholder attribute renders on input', expect => {
	const ph = signal('Enter name...')
	const dispose = render(<input placeholder={ph.read} />)

	expect($('input').placeholder).toBe('Enter name...')

	ph.write('Type here')
	expect($('input').placeholder).toBe('Type here')

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
