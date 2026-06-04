---
title: replaceParams
subpath: pota/use/url
topic: Routing
desc:
  Substitute :name placeholders in a route pattern with URL-encoded
  values.
---

# replaceParams

`replaceParams(href, params)` substitutes named `:name` placeholders
in a route pattern with URL-encoded values from `params`. Placeholders
are matched by [`paramsRegExp`](/use/url/paramsRegExp)
(`/\:([a-z0-9_\-]+)/gi`). Keys missing from `params` are left intact,
so partial substitution works. This is the same primitive
[`<A/>`](/components/A) uses internally. Part of
[`pota/use/url`](/use/url).

## Arguments

| Argument | Type     | Description                                                |
| -------- | -------- | ---------------------------------------------------------- |
| `href`   | `string` | The route pattern containing `:name` placeholders.         |
| `params` | `object` | Optional. Key-value pairs; each value replaces its `:key`. |

**Returns:** the URL with matched params replaced by their
`encodeURIComponent` form. When `params` is omitted, `href` is
returned unchanged.

## Examples

### Substitute route params

Replaces `:id` and `:page` with encoded values from the params object.

```js
import { replaceParams } from 'pota/use/url'

replaceParams('/users/:id/posts/:page', { id: 7, page: 'latest' })
// '/users/7/posts/latest'
```

### Partial substitution

Keys absent from `params` keep their placeholder, so you can fill in a
URL across several passes.

```js
import { replaceParams } from 'pota/use/url'

replaceParams('/users/:id/posts/:page', { id: 7 })
// '/users/7/posts/:page'
```
