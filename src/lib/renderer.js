import { createRoot, createEffect, onCleanup } from './flimsy.js'

export function createFragment(props, ...children) {
  return children
}

export function createElement(tag, props, ...children) {
  // should return wrapped so the code runs from parent to child
  return () => {
    // a component function
    if (typeof tag === 'function') {
      return () => tag(props, children)
    }

    // a regular html tag
    console.log('creating tag', tag)

    const element = document.createElement(tag)

    // naive assign props to the tag
    if (props) {
      Object.entries(props).forEach(([name, value]) => {
        if (name === 'onMount') {
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

export function insertChildren(parent, child) {
  // placeholder so elements stay in position
  const placeholder = document.createTextNode('')
  parent.appendChild(placeholder)

  createEffect(() => {
    let childNode = children(child)
    if (childNode !== undefined && childNode !== null) {
      if (Array.isArray(childNode)) {
        childNode.forEach(childNode => insertChildren(parent, childNode))
      } else {
        // create text node if isnt a dom element
        const element = childNode.nodeType
          ? childNode
          : document.createTextNode(childNode)

        // put the node in place
        parent.insertBefore(element, placeholder)

        // call onMount if defined
        childNode.onMount && childNode.onMount(childNode)

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

export function render(child, parent) {
  insertChildren(parent, child)
}

// helpers

export function children(child) {
  while (typeof child === 'function') child = child()
  return child
}

// control flow

export function Show(props, children) {
  return props.when() ? children[0] : null
}
export function For(props, children) {
  return props.each().map(children[0])
}
