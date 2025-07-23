import { memo, untrack } from '../reactive.js'

import {
  isArray,
  isObject,
  reflectApply,
  reflectGet,
  reflectGetOwnPropertyDescriptor,
  reflectHas,
  reflectIsExtensible,
  reflectOwnKeys,
} from '../std.js'

import { mutable } from './mutable.js'

// TODO: replace with `createFirewall`
export function projection(fn, state = {}) {
  const projection = project(state)
  let returned

  memo(function () {
    returned = fn(projection, returned)
  })()

  return projection
}

const isProjection = Symbol('isProjection')

function project(value, proxies = new Map()) {
  if (!isObject(value)) {
    return value
  }

  return untrack(() => {
    if (proxies.has(value)) {
      return proxies.get(value)
    }

    if (value[isProjection]) {
      return value
    }
    const proxy = new Proxy(
      mutable(isArray(value) ? [] : {}),
      new Projection(value, proxies),
    )
    proxies.set(value, proxy)
    proxies.set(proxy, proxy)

    if (isArray(value)) {
      for (const k in value) {
        proxy[k] = value[k]
      }
    }

    return proxy
  })
}

class Projection {
  constructor(source, root) {
    this.source = source
    this.root = root
  }
  set(target, key, value, proxy) {
    target[key] = project(value, this.root)
    return true
  }
  get(target, key, proxy) {
    if (key === isProjection) {
      return true
    }

    if (!(key in target) && target !== this.source) {
      // project
      return this.get(this.source, key, proxy)
    }

    const value = reflectGet(target, key, proxy)

    if (typeof value === 'function') {
      return this.returnFunction(target, key, value)
    }

    return this.returnValue(target, key, value)
  }
  getOwnPropertyDescriptor(target, key) {
    if (!(key in target) && target !== this.source) {
      return this.getOwnPropertyDescriptor(this.source, key)
    }

    return reflectGetOwnPropertyDescriptor(target, key)
  }
  ownKeys(target) {
    return [
      ...new Set(
        reflectOwnKeys(target).concat(reflectOwnKeys(this.source)),
      ),
    ]
  }
  has(target, key) {
    return reflectHas(target, key) || reflectHas(this.source, key)
  }

  returnValue(target, key, value) {
    return !reflectIsExtensible(target) ||
      reflectGetOwnPropertyDescriptor(target, key)?.configurable ===
        false
      ? (project(value, this.root), value)
      : project(value, this.root)
  }
  returnFunction(target, key, value) {
    const root = this.root
    return (...args) =>
      project(reflectApply(value, target, args), root)
  }
}
