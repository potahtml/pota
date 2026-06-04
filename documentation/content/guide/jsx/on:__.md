---
title: on:__
subpath: pota
topic: Events
desc:
  Attach a native or custom event listener, with optional listener
  options or multiple handlers.
---

# `on:__`

Attaches a native or custom event listener. The part after `on:` is
the event name and is **case-sensitive** (`on:click` and `on:Click`
listen to different events). The value can be a function, an object
with `{ handleEvent, once?, passive?, capture? }`, or an array of
either to register multiple handlers on the same event.

For the imperative equivalent (adding listeners from effects or
standalone code, tied to the reactive scope) see [addEvent](/addEvent)
/ [removeEvent](/removeEvent).

## Examples

### Native events

Native elements use namespaced `on:` props; an array registers more
than one handler on the same event.

```jsx
import { render } from 'pota'

function App() {
	const filter = e => {
		const search = e.currentTarget.value
		for (const item of document.querySelectorAll('li')) {
			item.style.display =
				!search || item.textContent?.indexOf(search) !== -1
					? ''
					: 'none'
		}
	}

	const say = (kind, e) =>
		render(
			<div>
				You {e.type} {kind}
			</div>,
		)

	return (
		<main>
			<label>
				Filter list:{' '}
				<input
					on:input={filter}
					placeholder="Filter"
				/>
			</label>
			<ul>
				<li on:click={e => say('duck', e)}>duck</li>
				<li on:click={e => say('dog', e)}>dog</li>
				<li on:click={e => say('bird', e)}>bird</li>
				<li
					on:click={[
						e => say('one handler', e),
						e => say('two handlers', e),
					]}
				>
					two handlers, one click
				</li>
			</ul>
		</main>
	)
}

render(App)
```

### Listener options

Pass an object instead of a function to set listener options — the
same `{ handleEvent, once?, passive?, capture? }` shape the DOM
accepts. Here `once: true` makes the handler fire a single time.

```jsx
import { render } from 'pota'

function App() {
	return (
		<button
			on:click={{
				handleEvent: () => render(<div>boo!</div>),
				once: true,
			}}
		>
			I work only once
		</button>
	)
}

render(App)
```
