---
title: action
subpath: pota
topic: Reactive core
desc:
  Builds a handler that chains callbacks, unwrapping returned
  functions and promises, and cancels on disposal.
---

# action

Builds a handler that chains callbacks into a pipeline. Calling the
returned function runs the first callback with the received arguments;
each subsequent callback receives the previous one's _resolved_ value
— returned functions are unwrapped (called) and returned promises are
awaited before the next stage runs. Each call is one-shot: signals
read inside a stage do not re-trigger the pipeline.

The pipeline runs under the current owner, so it cancels automatically
if that owner is disposed mid-flight — handy for async event handlers
on components that may unmount. Errors thrown in any stage route to
the nearest [catchError](/catchError) /
[`<Errored/>`](/components/Errored). For an effect with explicit async
tracking instead, see [asyncEffect](/asyncEffect).

## Arguments

| name     | type                   | description                                                                                                                             |
| -------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `...cbs` | `Array<(arg?) => any>` | one or more callbacks run in order. The first receives the call arguments; each later one receives the previous stage's resolved value. |

**Returns:** a function. Call it (with any arguments) to start the
pipeline.

## Examples

### Form submit pipeline

Validation, fetch, and the success-side write all live on a single
chain. The pipeline runs under the component's owner, so unmounting
cancels in-flight work, and a thrown `invalid email` bubbles up to the
surrounding `<Errored/>` boundary.

```jsx
import { action, render, signal } from 'pota'
import { Errored } from 'pota/components'

function Form() {
	const email = signal('')
	const status = signal('idle')

	const submit = action(
		() => email.read(),
		value => {
			if (!value.includes('@')) throw new Error('invalid email')
			return fetch('/subscribe', {
				method: 'POST',
				body: JSON.stringify({ email: value }),
			})
		},
		res => res.json(),
		result => status.write(`subscribed: ${result.id}`),
	)

	return (
		<form on:submit={e => (e.preventDefault(), submit())}>
			<input
				prop:value={email.read}
				on:input={e => email.write(e.currentTarget.value)}
			/>
			<button>subscribe</button>
			<p>{status.read}</p>
		</form>
	)
}

function App() {
	return (
		<Errored
			fallback={(err, reset) => (
				<div>
					<p>oops: {String(err)}</p>
					<button on:click={reset}>try again</button>
				</div>
			)}
		>
			<Form />
		</Errored>
	)
}

render(App)
```
