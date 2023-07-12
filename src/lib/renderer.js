import {
  createRoot,
  createEffect,
  onCleanup,
  createSignal,
  createMemo,
} from './flimsy.js'

export function createFragment(props, ...children) {
  return children
}

export function createElement(tag, props, ...children) {
  // should return wrapped so the code runs from parent to child
  return () => {
    // a component function
    if (typeof tag === 'function') {
      return tag(props, children)
    }

    // a regular html tag
    console.log('creating tag', tag, props)

    const element = document.createElement(tag)

    // naive assign props to the tag
    if (props) {
      Object.entries(props).forEach(([name, value]) => {
        if (name === 'onMount') {
          // not good but for the sake of testing
          element.onMount = value
        } else if (value === null || value === undefined) {
          element.removeAttribute(name)
        } else if (name === 'style') {
          if (typeof value === 'string') {
            element.style.cssText = value
          } else {
            Object.entries(value).forEach(([name, value]) => {
              createEffect(() => {
                if (typeof value === 'function') {
                  element.style[name] = value()
                } else {
                  element.style[name] = value
                }
              })
            })
          }
        } else if (name.startsWith('on') && name.toLowerCase() in window) {
          element.addEventListener(name.toLowerCase().substr(2), value)
        } else {
          // not good but for the sake of testing
          element[name] = value
          element.setAttribute(name, value)
        }
      })
    }
    // insert children
    insertChildren(element, children)

    return element
  }
}

export function insertChildren(parent, children) {
  // placeholder so elements stay in position
  const placeholder = document.createComment('placeholder')
  parent.appendChild(placeholder)

  createEffect(() => {
    let child = unwrap(children)

    // 0 and empty text are valid childs
    if (child !== undefined && child !== null) {
      if (Array.isArray(child)) {
        child.forEach(child => insertChildren(parent, child))
      } else {
        // console.log('rendering', child, child.outerHTML)

        // create text node if isnt a dom element
        const element = child && child.nodeType ? child : document.createTextNode(child)

        // put the node in place
        parent.insertBefore(element, placeholder)

        // call onMount if defined
        child && child.onMount && child.onMount(element)

        // remove the element from the tree on cleanup
        onCleanup(() => {
          if (element.isConnected) {
            parent.removeChild(element)
          }
        })
      }
    }
  })
}

export function render(children, parent) {
  insertChildren(parent, children)
}

// helpers

export function unwrap(children) {
  while (typeof children === 'function') children = children()
  return children
}

// control flow

export function Show(props, children) {
  return props.when() ? children[0] : null
}

export function For(props, children) {
  return props.each().map(children[0])
}
