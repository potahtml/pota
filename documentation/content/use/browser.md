---
title: browser
subpath: pota/use/browser
topic: Environment
desc: Simple user-agent booleans evaluated once at module load.
---

# `pota/use/browser`

`pota/use/browser` exposes simple user-agent booleans, evaluated
once at module load. They are convenient guards for tiny per-browser
branches; for anything richer reach for a real UA-parsing library.

## Exports

- [`isMobile`](/use/browser/isMobile) — `true` when the user agent
  looks like a mobile device
- [`isFirefox`](/use/browser/isFirefox) — `true` when the user agent
  contains `firefox`
- [`isMac`](/use/browser/isMac) — `true` when the user agent contains
  `mac`
