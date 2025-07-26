import {
  error,
  isObject,
  isProxyValueReturnInvariant,
  reflectApply,
  reflectGet,
  weakStore,
} from '../std.js'

const [get] = weakStore()

function crerateReadonly(value) {
  return new Proxy(value, ReadOnly)
}

/**
 * Prevents an oject from being writable
 *
 * @template T
 * @param {T} value
 * @returns {Readonly<T>}
 */
export function readonly(value) {
  if (!isObject(value)) {
    return value
  }

  return get(value, crerateReadonly)
}

const ReadOnly = new (class ReadOnly {
  get(target, key, proxy) {
    const value = reflectGet(target, key, proxy)

    return typeof value === 'function'
      ? this.returnFunction(target, key, value)
      : this.returnValue(target, key, value)
  }

  set(target, key, value, proxy) {
    this.log(target, key, value, proxy)
  }
  defineProperty(target, key, descriptor) {
    this.log(target, key, descriptor)
  }

  returnValue(target, key, value) {
    return isProxyValueReturnInvariant(target, key, value)
      ? value
      : readonly(value)
  }
  returnFunction(target, key, value) {
    return (...args) => readonly(reflectApply(value, target, args))
  }

  log(target, key, value, proxy) {
    const s = 'readonly'
    error(s, target, key, value, proxy)
    throw s
  }
})()

/**

 * Prevents an oject from being writable
 *
 * @template T
 * @param {T} value
 * @returns {Readonly<T>}

export function readonly(value) {
  if (isObject(value)) {
    Object.freeze(value)

    for (const key of Object.keys(value)) {
      readonly(value[key])
    }
  }
  return value
}

**/
