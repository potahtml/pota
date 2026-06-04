---
title: hash
subpath: pota/use/string
topic: Utilities
desc: WebCrypto digest of a string as a lowercase hex string.
---

# hash

`hash(value)` returns the WebCrypto digest of `value` as a lowercase
hex string. It is `async` — `crypto.subtle.digest` returns a promise —
so `await` the result. Pass a different algorithm name as the second
argument to switch from the default `'SHA-256'`.

Part of [`pota/use/string`](/use/string); pairs well with
[`copyToClipboard`](/use/string/copyToClipboard).

## Arguments

| Argument | Type     | Description                                                |
| -------- | -------- | ---------------------------------------------------------- |
| `value`  | `string` | The string to digest.                                      |
| `algo`   | `string` | Algorithm name passed to WebCrypto. Defaults to `SHA-256`. |

**Returns:** `Promise<string>` — the digest as a lowercase hex string.

## Examples

### Digest a string

Hashes a value with the default `SHA-256`, then again with `SHA-1`.

```jsx
import { hash } from 'pota/use/string'

const digest = await hash('hello') // 64-char SHA-256 hex string
const sha1 = await hash('hello', 'SHA-1') // 40-char SHA-1 hex string
```
