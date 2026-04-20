/** @jsxImportSource pota */

// Tests for the Range component: numeric ranges, reactive bounds,
// step, descending ranges, start equals stop, and array children.
import { test, body } from '#test'

import { render, signal } from 'pota'
import { Range } from 'pota/components'

// basic rendering - note: range is inclusive of both start and stop

await test('Range - renders from 0 to 2 step 1', expect => {
	const dispose = render(
		<Range start={0} stop={2} step={1}>
			{item => <p>{item}</p>}
		</Range>,
	)
	expect(body()).toBe('<p>0</p><p>1</p><p>2</p>')
	dispose()
})

await test('Range - renders from 0 to 4 step 2', expect => {
	const dispose = render(
		<Range start={0} stop={4} step={2}>
			{item => <p>{item}</p>}
		</Range>,
	)
	expect(body()).toBe('<p>0</p><p>2</p><p>4</p>')
	dispose()
})

await test('Range - renders from 1 to 3', expect => {
	const dispose = render(
		<Range start={1} stop={3} step={1}>
			{item => <span>{item}</span>}
		</Range>,
	)
	expect(body()).toBe('<span>1</span><span>2</span><span>3</span>')
	dispose()
})

// defaults

await test('Range - start defaults to 0', expect => {
	const dispose = render(
		<Range stop={2} step={1}>
			{item => <p>{item}</p>}
		</Range>,
	)
	expect(body()).toBe('<p>0</p><p>1</p><p>2</p>')
	dispose()
})

await test('Range - step defaults to 1', expect => {
	const dispose = render(
		<Range start={0} stop={3}>
			{item => <p>{item}</p>}
		</Range>,
	)
	expect(body()).toBe('<p>0</p><p>1</p><p>2</p><p>3</p>')
	dispose()
})

await test('Range - all defaults: start=0, stop=0, step=1', expect => {
	const dispose = render(<Range>{item => <p>{item}</p>}</Range>)
	// range(0, 0, 1) yields 0 only
	expect(body()).toBe('<p>0</p>')
	dispose()
})

// countdown (start > stop)

await test('Range - counts down when start > stop', expect => {
	const dispose = render(
		<Range start={3} stop={1} step={1}>
			{item => <p>{item}</p>}
		</Range>,
	)
	expect(body()).toBe('<p>3</p><p>2</p><p>1</p>')
	dispose()
})

await test('Range - counts down with step 2', expect => {
	const dispose = render(
		<Range start={6} stop={2} step={2}>
			{item => <p>{item}</p>}
		</Range>,
	)
	expect(body()).toBe('<p>6</p><p>4</p><p>2</p>')
	dispose()
})

// negative step is treated as abs

await test('Range - negative step is treated as positive (abs)', expect => {
	const dispose = render(
		<Range start={0} stop={4} step={-2}>
			{item => <p>{item}</p>}
		</Range>,
	)
	// step < 0 -> Math.abs(step) = 2, start < stop so counts up
	expect(body()).toBe('<p>0</p><p>2</p><p>4</p>')
	dispose()
})

// same start and stop

await test('Range - start equals stop yields single item', expect => {
	const dispose = render(
		<Range start={5} stop={5} step={1}>
			{item => <p>{item}</p>}
		</Range>,
	)
	expect(body()).toBe('<p>5</p>')
	dispose()
})

// multiple children callbacks

await test('Range - accepts multiple children callbacks', expect => {
	const dispose = render(
		<Range start={0} stop={1} step={1}>
			{item => <p>{item}-a</p>}
			{item => <span>{item}-b</span>}
		</Range>,
	)
	expect(body()).toBe(
		'<p>0-a</p><span>0-b</span><p>1-a</p><span>1-b</span>',
	)
	dispose()
})

// signal reactivity

await test('Range - updates when stop signal changes', expect => {
	const [stop, setStop] = signal(2)
	const dispose = render(
		<Range start={0} stop={stop} step={1}>
			{item => <p>{item}</p>}
		</Range>,
	)
	expect(body()).toBe('<p>0</p><p>1</p><p>2</p>')
	setStop(3)
	expect(body()).toBe('<p>0</p><p>1</p><p>2</p><p>3</p>')
	dispose()
})

await test('Range - updates when start signal changes', expect => {
	const [start, setStart] = signal(0)
	const dispose = render(
		<Range start={start} stop={3} step={1}>
			{item => <p>{item}</p>}
		</Range>,
	)
	expect(body()).toBe('<p>0</p><p>1</p><p>2</p><p>3</p>')
	setStart(2)
	expect(body()).toBe('<p>2</p><p>3</p>')
	dispose()
})

await test('Range - updates when step signal changes', expect => {
	const [step, setStep] = signal(1)
	const dispose = render(
		<Range start={0} stop={4} step={step}>
			{item => <p>{item}</p>}
		</Range>,
	)
	expect(body()).toBe('<p>0</p><p>1</p><p>2</p><p>3</p><p>4</p>')
	setStep(2)
	expect(body()).toBe('<p>0</p><p>2</p><p>4</p>')
	dispose()
})

// cleanup

await test('Range - cleans up on dispose', expect => {
	const dispose = render(
		<Range start={0} stop={2} step={1}>
			{item => <p>{item}</p>}
		</Range>,
	)
	expect(body()).toBe('<p>0</p><p>1</p><p>2</p>')
	dispose()
	expect(body()).toBe('')
})

// --- Array children syntax ---------------------------------------------------

await test('Range - accepts an array of callbacks as single child prop', expect => {
	const dispose = render(
		<Range start={0} stop={1} step={1}>
			{[i => <p>{i}-a</p>, i => <span>{i}-b</span>]}
		</Range>,
	)
	expect(body()).toBe(
		'<p>0-a</p><span>0-b</span><p>1-a</p><span>1-b</span>',
	)
	dispose()
})

// --- Range descending --------------------------------------------------------

await test('Range - descending range with negative step', expect => {
	const dispose = render(
		<Range start={3} stop={1} step={-1}>
			{item => <p>{item}</p>}
		</Range>,
	)
	expect(body()).toBe('<p>3</p><p>2</p><p>1</p>')
	dispose()
})

// --- negative-only range --------------------------------------------

await test('Range - renders a negative range', expect => {
	const dispose = render(
		<Range start={-3} stop={-1}>
			{item => <p>{item}</p>}
		</Range>,
	)
	expect(body()).toBe('<p>-3</p><p>-2</p><p>-1</p>')
	dispose()
})
