---
title: Tabs
kind: component
subpath: pota/components
topic: Layout
desc:
  Accessible, nestable tabs built from Labels, Label, Panels, and
  Panel sub-components.
---

# `<Tabs/>`

Accessible, nestable `Tabs` component by
[@boredofnames](https://github.com/boredofnames). Composes four
sub-components — `Tabs.Labels`, `Tabs.Label`, `Tabs.Panels`,
`Tabs.Panel` — and exposes a `Tabs.selected` helper for reading the
current tab from elsewhere in the tree.

`<Tabs.Labels>` renders a `<nav role="tablist">` with one
`<button role="tab">` per `<Tabs.Label>` child, and `<Tabs.Panels>`
renders the matching `<section>` panels — each linked back to its tab
via `aria-labelledby` and paired by position. The first tab is active
by default; pass `selected={index}` on `<Tabs>` to start elsewhere.
Unknown props are forwarded to the underlying element.

## Attributes

| component    | prop          | type                                               | description                                                                                                                                               |
| ------------ | ------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Tabs`       | `selected?`   | `number`                                           | initial tab index (default `0`)                                                                                                                           |
| `Tabs`       | `onSelected?` | `(selected: { id: number, name: string }) => void` | called with the picked tab each time the selection changes (not on mount) — lift it into a caller-owned signal to observe selection from outside the tree |
| `Tabs.Label` | `name?`       | `string`                                           | optional label name, exposed through `Tabs.selected().read().name`                                                                                        |
| `Tabs.Label` | `selected?`   | `boolean`                                          | when `true`, marks this label as the initially selected tab (overrides `Tabs`'s `selected`)                                                               |
| `Tabs.Label` | `hidden?`     | `Accessor<boolean>`                                | hides the label's tab button — its panel then can't be selected (don't point the initial `selected` at a hidden tab)                                      |
| `Tabs.Label` | `onClick?`    | `(info: { event, group, id, props }) => void`      | called when the label is clicked, after the selection change is applied                                                                                   |
| `Tabs.Panel` | `collapse?`   | `boolean`                                          | when `true`, the inactive panel is hidden via `display:none` instead of unmounted — its DOM and state survive across selections                           |

**Returns:** the tab tree wrapped in a context provider so the
sub-components can share the current selection.

## Tabs.selected

`Tabs.selected()` returns the selected-tab [signal](/signal) object
for the nearest `<Tabs>` ancestor. Read it (reactively) to know which
tab is active — `Tabs.selected().read()` yields `{ id, name }`, so
`Tabs.selected().read().id` is the active index and
`Tabs.selected().read().name` the active label's `name`.

`Tabs.selected()` only resolves while rendering **inside** a `<Tabs>`
subtree (it reads the nearest context). To observe selection from a
parent — above the `<Tabs>`, in a sibling, or across two independent
tab groups — use `onSelected` instead and keep the state in a signal
you own.

## onSelected

`onSelected` fires with the picked `{ id, name }` every time a tab is
chosen, so the selection can live in a caller-owned [signal](/signal)
rather than being trapped in the component. It is **not** called on
mount — the initial tab is whatever you passed as `selected`, so
there's nothing to report. Pass `signal.write` directly to mirror the
selection, or a handler to react to it.

## Collapse

Setting `collapse` on a `<Tabs.Panel/>` keeps its DOM mounted and just
hides it via `display: none`, which preserves any state inside (form
drafts, scroll position, mounted iframes). Without it, an inactive
panel is removed from the document and rebuilt when reselected.

## Examples

### Labels and panels

The minimal shape — labels and panels paired by position, with the
first tab active by default.

```jsx
import { render } from 'pota'
import { Tabs } from 'pota/components'

function App() {
	return (
		<Tabs>
			<Tabs.Labels>
				<Tabs.Label>profile</Tabs.Label>
				<Tabs.Label>settings</Tabs.Label>
				<Tabs.Label>billing</Tabs.Label>
			</Tabs.Labels>
			<Tabs.Panels>
				<Tabs.Panel>
					<p>your profile</p>
				</Tabs.Panel>
				<Tabs.Panel>
					<p>preferences and account</p>
				</Tabs.Panel>
				<Tabs.Panel>
					<p>plan and invoices</p>
				</Tabs.Panel>
			</Tabs.Panels>
		</Tabs>
	)
}

render(App)
```

### Reading the active tab

Reads the current selection reactively through `Tabs.selected()` and
shows the `name` of the active label. `selected` on the second label
makes it active on mount, and `hidden` drops the third tab.

```jsx
import { render } from 'pota'
import { Tabs } from 'pota/components'

function App() {
	return (
		<Tabs>
			<div>
				{() => `Selected tab is: ${Tabs.selected().read().name}`}
			</div>

			<Tabs.Labels>
				<Tabs.Label name="one">one</Tabs.Label>
				<Tabs.Label
					name="two"
					selected
				>
					two
				</Tabs.Label>
				<Tabs.Label
					name="three"
					hidden
				>
					three
				</Tabs.Label>
			</Tabs.Labels>
			<Tabs.Panels>
				<Tabs.Panel>one</Tabs.Panel>
				<Tabs.Panel>two</Tabs.Panel>
				<Tabs.Panel>three</Tabs.Panel>
			</Tabs.Panels>
		</Tabs>
	)
}

render(App)
```

### Lifting selection into your own signal

`onSelected` writes each pick into a caller-owned signal, so the
current tab can be read from **outside** the `<Tabs>` subtree — here a
sibling heading that `Tabs.selected()` couldn't reach.

```jsx
import { render, signal } from 'pota'
import { Tabs } from 'pota/components'

function App() {
	const selected = signal({ id: 0, name: 'profile' })

	return (
		<div>
			<h1>{() => `editing: ${selected.read().name}`}</h1>

			<Tabs onSelected={selected.write}>
				<Tabs.Labels>
					<Tabs.Label name="profile">profile</Tabs.Label>
					<Tabs.Label name="settings">settings</Tabs.Label>
					<Tabs.Label name="billing">billing</Tabs.Label>
				</Tabs.Labels>
				<Tabs.Panels>
					<Tabs.Panel>your profile</Tabs.Panel>
					<Tabs.Panel>preferences and account</Tabs.Panel>
					<Tabs.Panel>plan and invoices</Tabs.Panel>
				</Tabs.Panels>
			</Tabs>
		</div>
	)
}

render(App)
```

### Collapse to preserve panel state

`collapse` keeps an inactive panel mounted and just hides it, so the
textarea draft and the iframe survive switching away and back. Starts
on the editor tab via `selected={1}`.

```jsx
import { render } from 'pota'
import { Tabs } from 'pota/components'

function App() {
	return (
		<Tabs selected={1}>
			<Tabs.Labels>
				<Tabs.Label name="overview">overview</Tabs.Label>
				<Tabs.Label name="editor">editor</Tabs.Label>
				<Tabs.Label name="preview">preview</Tabs.Label>
			</Tabs.Labels>
			<Tabs.Panels>
				<Tabs.Panel>
					<p>read-only summary</p>
				</Tabs.Panel>
				<Tabs.Panel collapse>
					<textarea>draft preserved when hidden</textarea>
				</Tabs.Panel>
				<Tabs.Panel collapse>
					<iframe
						src="about:blank"
						style={{ width: '100%', height: '200px' }}
					/>
				</Tabs.Panel>
			</Tabs.Panels>
		</Tabs>
	)
}

render(App)
```
