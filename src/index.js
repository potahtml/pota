import {
  createRoot,
  createEffect,
  onCleanup,
  createSignal,
  createMemo,
} from './lib/reactivity.js'

import { render, createElement, createFragment, Show, For } from './lib/renderer.js'

let disposer = render(
  () => (
    <div>
      <h1>Renderer Test</h1>

      <Test title="Component return types">
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
        <br />
        false:
        <ComponentFalse />
        <br />
        true:
        <ComponentTrue />
        <br />
      </Test>
      <Test title="reactive prop">
        <ComponentStyleChange />
      </Test>
      <Test title="`Show` order, 2 should toggle and keep in between 1 and 3">
        <ComponentShow />
      </Test>
      <Test title="`Show` lonely unwrapped">
        <ComponentLonelyShow />
      </Test>
      <Test title="`Show` function">
        <ComponentShowFunction />
      </Test>
      <Test title="`Show` fallback">
        <ComponentShowFallback />
      </Test>
      <Test title="Deep lonely signal">
        <ComponentLonelySignal />
      </Test>
      <Test title="Naive `For`">
        <ComponentNaiveFor />
      </Test>
      <Test title="Lonely `For` unwrapped">
        <ComponentLonelyFor />
      </Test>
      <Test title="`For` with siblings">
        <ComponentForWithSiblings />
      </Test>
      <Test title="lame counter">
        <ComponentCounter />
      </Test>
      <Test title="fancy For">
        <ComponentFancyFor />
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
function ComponentFalse() {
  return false
}

function ComponentTrue() {
  return true
}

function ComponentStyleChange() {
  const [color, setColor] = createSignal('red')

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
  const [showing, setShowing] = createSignal(true)

  setInterval(function () {
    setShowing(!showing())
  }, 1000)
  console.log('component show 1 running')

  return (
    <div onMount={() => console.log('component show mounted')}>
      1 <Show when={showing}>2</Show> 3
      <br />
      Test nesting a component
      <ComponentLonelyShow />
    </div>
  )
}
function ComponentLonelyShow() {
  console.log('component show 2 running')

  const [showing, setShowing] = createSignal(true)

  setInterval(function () {
    setShowing(!showing())
  }, 1000)

  return <Show when={showing}>2</Show>
}
function ComponentShowFunction() {
  const [showing, setShowing] = createSignal(true)

  setInterval(function () {
    setShowing(!showing())
  }, 1000)

  return (
    <span>
      <Show when={showing}>{() => 'hola'}</Show>
    </span>
  )
}
function ComponentShowFallback() {
  const [showing, setShowing] = createSignal(true)

  setInterval(function () {
    setShowing(!showing())
  }, 1000)

  return (
    <div>
      <Show
        when={false}
        fallback={'ciao'}
      >
        {() => 'hola'}
      </Show>
    </div>
  )
}
function ComponentLonelySignal() {
  const [value, setValue] = createSignal(1)

  setInterval(function () {
    setValue(Math.random())
  }, 1000)

  onCleanup(() => {
    console.log('cleanup on ComponentSignal')
  })
  return (
    <span>
      s s{' '}
      <span>
        deep lonely signal <span>{value}</span>
      </span>{' '}
      {value}s s
    </span>
  )
}

function ComponentNaiveFor() {
  let a = 0
  const content = () => a++
  const [value, setValue] = createSignal([content])

  setInterval(function () {
    a = 0
    setValue(new Array((Math.random() * 10) | 0 || 1).fill(content))
  }, 10000)
  return (
    <>
      <For
        each={value}
        skipLogs={true}
      >
        {item => item}
      </For>
    </>
  )
}

function ComponentLonelyFor() {
  let a = 0
  const content = new Array(10).fill(<span>'wth' + {a++}</span>)

  const [value, setValue] = createSignal(content)

  setInterval(function () {
    a = 0
    setValue(content.slice(0, (Math.random() * 8) | 0 || 1))
  }, 10000)
  return (
    <For
      each={value}
      skipLogs={true}
    >
      {item => item}
    </For>
  )
}

function ComponentForWithSiblings() {
  let a = 0
  const content = () => a++

  const [value, setValue] = createSignal([content])

  setInterval(function () {
    a = 0
    setValue(new Array((Math.random() * 10) | 0 || 1).fill(content))
  }, 10000)
  return (
    <span>
      BEFORE
      <For
        each={value}
        skipLogs={true}
      >
        {item => item}
      </For>
      AFTER
    </span>
  )
}

function ComponentCounter() {
  const [value, setValue] = createSignal(0)

  return (
    <>
      <button
        type="button"
        style="color:black"
        onClick={() => setValue(value() + 1)}
        onMount={() => console.log('mounted button')}
      >
        {value}
      </button>{' '}
      {value}
    </>
  )
}

function ComponentFancyFor() {
  let a = 0

  const content = () => {
    return { content: a++ }
  }

  let arr = [content()]
  const [value, setValue] = createSignal(arr)

  onCleanup(() => {
    console.log('wth this shoulnt be running!')
  })
  return (
    <>
      <button
        style="color:black"
        onClick={() => {
          console.log('-------------------------------------')
          arr = value()

          arr.push(content())
          setValue([...arr])
        }}
      >
        append
      </button>
      <button
        style="color:black"
        onClick={() => {
          console.log('-------------------------------------')
          arr = value()

          arr.unshift(content())
          setValue([...arr])
        }}
      >
        unshift
      </button>
      <button
        style="color:black"
        onClick={() => {
          console.log('-------------------------------------')
          arr = value()

          arr.pop()
          setValue([...arr])
        }}
      >
        pop
      </button>
      <button
        style="color:black"
        onClick={() => {
          console.log('-------------------------------------')
          arr = value()

          arr.shift()
          setValue([...arr])
        }}
      >
        shift
      </button>
      <button
        style="color:black"
        onClick={() => {
          console.log('-------------------------------------')
          arr = value()

          let a = arr[1]
          arr[1] = arr[0]
          arr[0] = a
          setValue([...arr])
        }}
      >
        swap
      </button>
      <button
        style="color:black"
        onClick={() => {
          console.log('-------------------------------------')
          arr = value()

          arr.splice((arr.length / 2) | 0, 0, content())
          setValue([...arr])
        }}
      >
        insert in middle
      </button>
      <button
        style="color:black"
        onClick={() => {
          console.log('-------------------------------------')
          arr = value()

          arr.reverse()
          setValue([...arr])
        }}
      >
        reverse
      </button>
      <button
        style="color:black"
        onClick={() => {
          console.log('-------------------------------------')
          function shuffle(array) {
            let currentIndex = array.length,
              randomIndex

            // While there remain elements to shuffle.
            while (currentIndex != 0) {
              // Pick a remaining element.
              randomIndex = Math.floor(Math.random() * currentIndex)
              currentIndex--

              // And swap it with the current element.
              ;[array[currentIndex], array[randomIndex]] = [
                array[randomIndex],
                array[currentIndex],
              ]
            }

            return array
          }

          setValue([...shuffle(value())])
        }}
      >
        shuffle
      </button>
      <button
        style="color:black"
        onClick={() => {
          console.log('-------------------------------------')
          setValue([])
        }}
      >
        clear
      </button>
      <For each={value}>
        {item => (
          <div>
            <span>
              <span>
                <span>
                  <span onCleanup={() => console.log('onCleanup baby')}>
                    {item.content}
                  </span>
                </span>
              </span>
            </span>
          </div>
        )}
      </For>
    </>
  )
}
