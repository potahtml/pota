/** @jsxImportSource pota */

// Tests for the Tabs component: initial active tab, signal-driven
// tab switching, and cleanup.
import { $, $$, test, body } from '#test'

import { render, signal } from 'pota'
import { Tabs } from 'pota/components'

await test('Tabs - renders tablist, tab buttons and linked panels', expect => {
	const dispose = render(
		<Tabs>
			<Tabs.Labels>
				<Tabs.Label>one</Tabs.Label>
				<Tabs.Label>two</Tabs.Label>
			</Tabs.Labels>
			<Tabs.Panels>
				<Tabs.Panel>panel one</Tabs.Panel>
				<Tabs.Panel>panel two</Tabs.Panel>
			</Tabs.Panels>
		</Tabs>,
	)

	expect($('nav[role="tablist"]')).not.toBe(null)
	expect($$('[role="tab"]').length).toBe(2)
	expect($$('section').length).toBe(1)
	expect(
		document
			.querySelector('[role="tab"]')
			.getAttribute('aria-controls'),
	).toBe($('section').id)
	expect(
		$('section').getAttribute('aria-labelledby'),
	).toBe($('[role="tab"]').id)

	dispose()
})

await test('Tabs - selects the first tab by default and switches on click', expect => {
	const dispose = render(
		<Tabs>
			<Tabs.Labels>
				<Tabs.Label>one</Tabs.Label>
				<Tabs.Label>two</Tabs.Label>
				<Tabs.Label>three</Tabs.Label>
			</Tabs.Labels>
			<Tabs.Panels>
				<Tabs.Panel>p1</Tabs.Panel>
				<Tabs.Panel>p2</Tabs.Panel>
				<Tabs.Panel>p3</Tabs.Panel>
			</Tabs.Panels>
		</Tabs>,
	)

	expect(
		document
			.querySelectorAll('[role="tab"]')[0]
			.getAttribute('aria-selected'),
	).toBe('true')
	expect(body()).toContain('p1')

	document
		.querySelectorAll('[role="tab"]')[2]
		.dispatchEvent(new MouseEvent('click', { bubbles: true }))
	expect(
		document
			.querySelectorAll('[role="tab"]')[2]
			.getAttribute('aria-selected'),
	).toBe('true')
	expect($('section').textContent).toBe('p3')

	document
		.querySelectorAll('[role="tab"]')[1]
		.dispatchEvent(new MouseEvent('click', { bubbles: true }))
	expect($('section').textContent).toBe('p2')

	dispose()
})

await test('Tabs - selected props on Tabs and Label control the initial tab', expect => {
	const tabsSelected = render(
		<Tabs selected={2}>
			<Tabs.Labels>
				<Tabs.Label>one</Tabs.Label>
				<Tabs.Label>two</Tabs.Label>
				<Tabs.Label>three</Tabs.Label>
			</Tabs.Labels>
			<Tabs.Panels>
				<Tabs.Panel>p1</Tabs.Panel>
				<Tabs.Panel>p2</Tabs.Panel>
				<Tabs.Panel>p3</Tabs.Panel>
			</Tabs.Panels>
		</Tabs>,
	)

	expect(
		document
			.querySelectorAll('[role="tab"]')[2]
			.getAttribute('aria-selected'),
	).toBe('true')
	expect($('section').textContent).toBe('p3')

	tabsSelected()

	const labelSelected = render(
		<Tabs>
			<Tabs.Labels>
				<Tabs.Label>one</Tabs.Label>
				<Tabs.Label selected>two</Tabs.Label>
			</Tabs.Labels>
			<Tabs.Panels>
				<Tabs.Panel>p1</Tabs.Panel>
				<Tabs.Panel>p2</Tabs.Panel>
			</Tabs.Panels>
		</Tabs>,
	)

	expect(
		document
			.querySelectorAll('[role="tab"]')[1]
			.getAttribute('aria-selected'),
	).toBe('true')
	expect($('section').textContent).toBe('p2')

	labelSelected()
})

await test('Tabs - hidden labels toggle visibility reactively', expect => {
	const hidden = signal(false)
	const dispose = render(
		<Tabs>
			<Tabs.Labels>
				<Tabs.Label>one</Tabs.Label>
				<Tabs.Label hidden={hidden.read}>two</Tabs.Label>
			</Tabs.Labels>
			<Tabs.Panels>
				<Tabs.Panel>p1</Tabs.Panel>
				<Tabs.Panel>p2</Tabs.Panel>
			</Tabs.Panels>
		</Tabs>,
	)

	expect($$('[role="tab"]').length).toBe(2)

	hidden.write(true)
	expect($$('[role="tab"]').length).toBe(1)

	hidden.write(false)
	expect($$('[role="tab"]').length).toBe(2)

	dispose()
})

await test('Tabs - Label forwards props and passes click metadata', expect => {
	let clicked
	const dispose = render(
		<Tabs>
			<Tabs.Labels>
				<Tabs.Label
					class="first"
					name="tab-one"
				>
					one
				</Tabs.Label>
				<Tabs.Label
					class="second"
					name="tab-two"
					onClick={({ group, id, props }) => {
						clicked = { group, id, name: props.name }
					}}
				>
					two
				</Tabs.Label>
			</Tabs.Labels>
			<Tabs.Panels>
				<Tabs.Panel>p1</Tabs.Panel>
				<Tabs.Panel class="panel-two">p2</Tabs.Panel>
			</Tabs.Panels>
		</Tabs>,
	)

	expect($('[role="tab"].first')).not.toBe(null)

	document
		.querySelectorAll('[role="tab"]')[1]
		.dispatchEvent(new MouseEvent('click', { bubbles: true }))

	expect($('[role="tab"].second')).not.toBe(null)
	expect($('section').textContent).toBe('p2')
	expect(clicked.name).toBe('tab-two')
	expect(clicked.id).toBe(1)
	expect(typeof clicked.group).toBe('number')

	dispose()
})

await test('Tabs - collapse panels keep both sections mounted while only one is visible', expect => {
	const dispose = render(
		<Tabs>
			<Tabs.Labels>
				<Tabs.Label>one</Tabs.Label>
				<Tabs.Label>two</Tabs.Label>
			</Tabs.Labels>
			<Tabs.Panels>
				<Tabs.Panel collapse>panel one</Tabs.Panel>
				<Tabs.Panel
					collapse
					class="second-panel"
				>
					panel two
				</Tabs.Panel>
			</Tabs.Panels>
		</Tabs>,
	)

	expect($$('section').length).toBe(2)
	expect($('section').textContent).toBe(
		'panel one',
	)

	document
		.querySelectorAll('[role="tab"]')[1]
		.dispatchEvent(new MouseEvent('click', { bubbles: true }))

	expect($$('section').length).toBe(2)
	expect($('section.second-panel')).not.toBe(
		null,
	)

	dispose()
})

await test('Tabs - Tabs.selected() provides reactive access to the selected tab from context', expect => {
	let selectedName
	const dispose = render(
		<Tabs>
			<div>
				{() => {
					const sel = Tabs.selected()
					selectedName = sel ? sel.read()?.name : undefined
					return selectedName
				}}
			</div>
			<Tabs.Labels>
				<Tabs.Label name="one">one</Tabs.Label>
				<Tabs.Label name="two">two</Tabs.Label>
			</Tabs.Labels>
			<Tabs.Panels>
				<Tabs.Panel>p1</Tabs.Panel>
				<Tabs.Panel>p2</Tabs.Panel>
			</Tabs.Panels>
		</Tabs>,
	)

	expect(body()).toContain('one')

	document
		.querySelectorAll('[role="tab"]')[1]
		.dispatchEvent(new MouseEvent('click', { bubbles: true }))

	expect(body()).toContain('two')

	dispose()
})
