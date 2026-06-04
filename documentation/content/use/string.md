---
title: string
subpath: pota/use/string
topic: Utilities
desc:
  Small string utilities — case conversion, light validation,
  clipboard, hashing, and diff.
---

# `pota/use/string`

`pota/use/string` collects the small string utilities that come up
over and over when building UIs: case conversion, light validation,
clipboard, hashing, and a multi-line `diff` used by
[`pota/use/test`](/use/test).

## Exports

- [`dashesToCamelCase(s)`](/use/string/dashesToCamelCase) — kebab-case
  → camelCase
- [`capitalizeFirstLetter(s)`](/use/string/capitalizeFirstLetter) —
  uppercase the first char
- [`label(s)`](/use/string/label) — slug → human label
- [`short(s)`](/use/string/short) — truncate to 40 chars with `…`
- [`ensureString(s)`](/use/string/ensureString) — coerce to a string,
  falsy → `''`
- [`toString(s, length?)`](/use/string/toString) — coerce + trim, with
  optional max length
- [`wholeNumber(n)`](/use/string/wholeNumber) — drop the fractional
  part, `NaN` → `0`
- [`validateEmail(s)`](/use/string/validateEmail) — normalized email
  or `false`
- [`validatePassword(s)`](/use/string/validatePassword) — trimmed
  password (len ≥ 6) or `false`
- [`isEmoji(s)`](/use/string/isEmoji) — does the string contain emoji?
- [`copyToClipboard(s)`](/use/string/copyToClipboard) — write text to
  the clipboard
- [`hash(value, algo?)`](/use/string/hash) — WebCrypto digest as hex
- [`diff(a, b)`](/use/string/diff) — mark line divergence between two
  multi-line strings
