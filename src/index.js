import { createSignal, onCleanup } from './lib/flimsy.js'

import { render, createElement, createFragment, Show, For } from './lib/renderer.js'

render(
  () => (
    <div>
      <h1>Renderer Test</h1>
      <hr />
      Components testing:
      <br /> <br />
      <Test title="Component that returns text">
        <ComponentText />
      </Test>
      <Test title="Component that returns null">
        <ComponentNull />
      </Test>
      <Test title="Component that returns undefined">
        <ComponentUndefined />
      </Test>
      <Test title="Component that returns a number">
        <ComponentNumber />
      </Test>
      <Test title="Component that returns a 0">
        <ComponentZero />
      </Test>
      <Test title="Component that returns a div">
        <ComponentDiv />
      </Test>
      <Test title="Component that changes text color at random">
        <ComponentStyleChange />
      </Test>
      <Test title="Show order, 2 should toggle and keep in between 1 and 3">
        <ComponentShow />
      </Test>
      <Test title="Show lonely">
        <br />
        for some reason the component should be wrapped or wont work
        <br />
        <ComponentLonelyShow />
      </Test>
      <Test title="Deep lonely signal">
        <ComponentLonelySignal />
      </Test>
      <Test title="Naive For ">
        <br />
        for some reason the component should be wrapped or wont work
        <br />
        <ComponentNaiveFor />
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
function ComponentDiv() {
  return <div>a div here</div>
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
  let [value, setValue] = createSignal(true)

  setInterval(function () {
    setValue(Math.random())
  }, 1000)

  onCleanup(() => {
    console.log('cleanup on ComponentSignal')
  })
  return (
    <div onMount={() => console.log('mounting on lonely signal update? ')}>
      something something
      <div onMount={() => console.log('mounting on lonely signal update? ')}>
        deep lonely signal{' '}
        <div onMount={() => console.log('mounting on lonely signal update? ')}>
          {value}
        </div>
      </div>
      something something
    </div>
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

function ComponentCounter() {
  let [value, setValue] = createSignal(0)

  return (
    <button
      type="button"
      style="color:black"
      onClick={() => setValue(value() + 1)}
      onMount={() => console.log('mounted the button of the lame counter')}
    >
      {value}
    </button>
  )
}
