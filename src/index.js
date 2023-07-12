import {
  createRoot,
  createEffect,
  onCleanup,
  createSignal,
  createMemo,
} from './lib/flimsy.js'

import { render, createElement, createFragment, Show, For } from './lib/renderer.js'

render(
  () => (
    <div>
      <h1>Renderer Test</h1>

      <Test title="Component return types">
        <br />
        text: <ComponentText />
        <br />
        null: <ComponentNull />
        <br />
        undefined: <ComponentUndefined />
        <br />
        number: <ComponentNumber />
        <br />
        0: <ComponentZero />
        <br />
        empty text:
        <ComponentEmptyText />
        <br />
        div:
        <ComponentDiv />
        array:
        <ComponentArray />
      </Test>
      <Test title="reactive prop">
        <ComponentStyleChange />
      </Test>
      <Test title="`Show` order, 2 should toggle and keep in between 1 and 3">
        <ComponentShow />
      </Test>
      <Test title="`Show` lonely unwrapped (doesnt work)">
        <br />
        for some reason the component should be wrapped or wont work
        <br />
        <ComponentLonelyShow />
      </Test>
      <Test title="Deep lonely signal">
        <ComponentLonelySignal />
      </Test>
      <Test title="Naive `For`">
        <br />
        for some reason the component should be wrapped or wont work
        <br />
        <ComponentNaiveFor />
      </Test>
      <Test title="Lonely `For` unwrapped (doesnt work)">
        <br />
        for some reason the component should be wrapped or wont work
        <br />
        <ComponentLonelyFor />
      </Test>
      <Test title="lame counter">
        <ComponentCounter />
      </Test>
    </div>
  ),
  document.body,
)

function Test(props, children) {
  return (
    <>
      <fieldset
        onMount={() => {
          console.log('Test mounted:', props.title)
        }}
      >
        <b>{props.title}</b>:{children}
      </fieldset>
      <br />
    </>
  )
}
function ComponentText() {
  return 'Lorem'
}
function ComponentNull() {
  return null
}
function ComponentUndefined() {
  return undefined
}
function ComponentNumber() {
  return 1
}
function ComponentZero() {
  return 0
}
function ComponentEmptyText() {
  return ''
}
function ComponentDiv() {
  return <div>a div here</div>
}
function ComponentArray() {
  return [1, 2, 3]
}

function ComponentStyleChange() {
  let [color, setColor] = createSignal('red')

  setInterval(function () {
    setColor(
      'rgb(' +
        Math.random() * 255 +
        ',' +
        Math.random() * 255 +
        ',' +
        Math.random() * 255,
    )
  }, 1000)

  return <span style={{ color: color }}>text</span>
}

function ComponentShow() {
  let [showing, setShowing] = createSignal(true)

  setInterval(function () {
    setShowing(!showing())
  }, 1000)

  return (
    <div onMount={() => console.log('mounting the parent of show update? ')}>
      1 <Show when={showing}>2</Show> 3
    </div>
  )
}
function ComponentLonelyShow() {
  let [showing, setShowing] = createSignal(true)

  setInterval(function () {
    setShowing(!showing())
  }, 1000)

  return <Show when={showing}>2</Show>
}
function ComponentLonelySignal() {
  let [value, setValue] = createSignal(Math.random())

  setInterval(function () {
    setValue(Math.random())
  }, 1000)

  onCleanup(() => {
    console.log('cleanup on ComponentSignal')
  })
  return (
    <span onMount={() => console.log('mounting on lonely signal update? ')}>
      s s{' '}
      <span onMount={() => console.log('mounting on lonely signal update? ')}>
        deep lonely signal{' '}
        <span onMount={() => console.log('mounting on lonely signal update? ')}>
          {value}
        </span>
      </span>{' '}
      s s
    </span>
  )
}

function ComponentNaiveFor() {
  let [value, setValue] = createSignal([1, 1, 1])

  setInterval(function () {
    setValue(new Array((Math.random() * 10) | 0 || 1).fill(1))
  }, 1000)
  return (
    <>
      <For each={value}>{item => item}</For>
    </>
  )
}
function ComponentLonelyFor() {
  let [value, setValue] = createSignal([1, 1, 1])

  setInterval(function () {
    setValue(new Array((Math.random() * 10) | 0 || 1).fill(1))
  }, 1000)
  return <For each={value}>{item => item}</For>
}

function ComponentCounter() {
  let [value, setValue] = createSignal(0)

  return (
    <>
      <button
        type="button"
        style="color:black"
        onClick={() => setValue(value() + 1)}
        onMount={() => console.log('mounted the button of the lame counter')}
      >
        {value}
      </button>{' '}
      {value}
    </>
  )
}
