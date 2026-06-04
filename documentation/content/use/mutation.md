---
title: mutation
subpath: pota/use/mutation
topic: Observers
desc:
  MutationObserver behind a use*/on* pair, plus a mutated ref factory.
---

# `pota/use/mutation`

`pota/use/mutation` wraps `MutationObserver` behind the same
`use* / on*` pair as the other emitter modules, plus a `mutated` ref
factory you attach with `use:ref`.

## Exports

- [`useMutations(node, init?)`](/use/mutation/useMutations) — signal
  accessor of the latest records
- [`onMutations(node, fn, init?)`](/use/mutation/onMutations) —
  callback fired with each batch
- [`mutated(handler, init?)`](/use/mutation/mutated) — `use:ref`
  factory

## Notes

Default `init` is `{ childList: true, subtree: true }`. Pass your own
to narrow the scope (attribute changes only, character data, a
specific attribute filter, etc.). Multiple subscribers on the same
node share one observer, so `init` from later calls is ignored — the
first subscriber wins. The observer disconnects once the last
subscriber's scope disposes.
