// CPU profiler — captures a V8 sample profile of one bench cycle on
// the benchmark page and prints the top hot self-time functions.
//
// Where the regular `runner.mjs` reports deopt counts (a coarse
// proxy), this script tells you where time is actually spent. Use
// it when bench timings refuse to move and you want to know whether
// the engine, JSX runtime, DOM ops, or the framework itself is the
// bottleneck.
//
// Run from repo root: `node tools/bench/prof.mjs`
// Compiles and serves the standalone benchmark page itself (see
// `serve.mjs`) — same page as `runner.mjs`, no external dev server.

import puppeteer from 'puppeteer'
import { startBenchServer } from './serve.mjs'
import { installLatestChrome } from './browser.mjs'

// Same flags as runner.mjs — disable background work that injects
// noise into samples.
const STABILIZATION_FLAGS = [
	'--disable-background-networking',
	'--disable-background-timer-throttling',
	'--disable-backgrounding-occluded-windows',
	'--disable-breakpad',
	'--disable-component-update',
	'--disable-default-apps',
	'--disable-domain-reliability',
	'--disable-extensions',
	'--disable-features=Translate,AutofillServerCommunication',
	'--disable-hang-monitor',
	'--disable-ipc-flooding-protection',
	'--disable-renderer-backgrounding',
	'--disable-sync',
	'--metrics-recording-only',
	'--mute-audio',
	'--no-default-browser-check',
	'--no-first-run',
	'--password-store=basic',
	'--use-mock-keychain',
]

const ROWS_FULL = expr =>
	`() => document.querySelectorAll('tbody tr').length === ${expr}`

async function cycle(page) {
	await page.click('#runlots')
	await page.waitForFunction(ROWS_FULL(10_000), { timeout: 0 })
	await page.click('#clear')
	await page.waitForFunction(ROWS_FULL(0), { timeout: 0 })
}

console.log('[prof] compiling + serving benchmark page...')
const { url: URL, close: closeServer } = await startBenchServer()

console.log('[prof] updating Chrome to latest stable...')
const { executablePath: chromePath, buildId: chromeBuild } =
	await installLatestChrome('prof')

console.log(`[prof] target: ${URL}`)
if (chromeBuild) console.log(`[prof] chrome: ${chromeBuild} (stable)`)

// `--no-inlining` is exposed via `--js-flags`. Setting it makes the
// CPU profile attribute samples to the actual function they fall in,
// not to the function that V8 inlined them into. If toDiff's
// self-time drops noticeably with this flag, it means part of what
// we were calling "toDiff JS work" was actually V8 inlining its
// helpers (`includes`, `for-of` step, etc.) into toDiff's optimized
// code. Pass `--prof-no-inlining` (or `-i`) to enable.
const NO_INLINING =
	process.argv.includes('--prof-no-inlining') ||
	process.argv.includes('-i')

const jsFlags = NO_INLINING
	? ['--js-flags=--no-turbo-inlining --no-maglev-inlining']
	: []

if (NO_INLINING) console.log('[prof] inlining disabled')

// --trace mode: capture devtools.timeline events instead of CPU
// samples. Trace events have explicit start/end timestamps, so we
// can decompose the cycle into JS vs Layout vs Paint vs Style vs
// GC vs DOM events vs idle. This decomposition is what the CPU
// profiler hides inside `(program)`. Use this when you want to
// answer "is toDiff actually doing 70ms of JS, or is the time in
// DOM API calls underneath it?".
const TRACE_MODE =
	process.argv.includes('--trace') || process.argv.includes('-t')

if (TRACE_MODE) console.log('[prof] tracing mode')

// --heap mode: capture an allocation sampling profile. The CPU
// profile tells us where time is spent; the heap profile tells us
// where bytes are allocated. Less allocation → less GC pressure,
// better cache locality, fewer stop-the-world pauses. Often the
// best wins come from removing allocations on a hot path even
// when CPU samples don't flag the allocator itself.
const HEAP_MODE =
	process.argv.includes('--heap') || process.argv.includes('-h')

if (HEAP_MODE) console.log('[prof] heap allocation mode')

const browser = await puppeteer.launch({
	headless: true,
	executablePath: chromePath,
	args: ['--no-sandbox', ...jsFlags, ...STABILIZATION_FLAGS],
})

if (HEAP_MODE) {
	const page = await browser.newPage()
	const client = await page.createCDPSession()
	await client.send('HeapProfiler.enable')
	await page.goto(URL, { waitUntil: 'load' })
	for (let i = 0; i < 2; i++) await cycle(page) // warmup
	await client.send('HeapProfiler.collectGarbage')

	console.log('[prof] capturing allocations...')
	// 64-byte sampling interval — very fine. Default is 32KB which
	// misses everything except multi-KB allocs. We want per-row /
	// per-signal granularity, so we trade probe overhead for
	// resolution. Larger pages may want to bump this up.
	await client.send('HeapProfiler.startSampling', {
		samplingInterval: 64,
	})
	await cycle(page)
	const { profile } = await client.send('HeapProfiler.stopSampling')
	await browser.close()

	// Same shape as CPU profile: head node + tree of children with
	// callFrame and selfSize. Each child is one allocation site.
	// Compute self + inclusive size by post-order traversal.
	const flat = []
	function walk(node, parent) {
		const item = {
			callFrame: node.callFrame,
			selfSize: node.selfSize,
			inclusiveSize: 0,
			children: node.children || [],
		}
		flat.push(item)
		item._parent = parent
		for (const c of item.children) walk(c, item)
	}
	walk(profile.head, null)

	// Post-order: children before parent.
	function postOrder(start) {
		const out = []
		const stack = [[start, false]]
		while (stack.length) {
			const [n, v] = stack.pop()
			if (v) {
				out.push(n)
				continue
			}
			stack.push([n, true])
			for (const c of n.children) stack.push([c, false])
		}
		return out
	}
	for (const n of postOrder(flat[0])) {
		let inc = n.selfSize
		for (const c of n.children) inc += c.inclusiveSize
		n.inclusiveSize = inc
	}

	const totalSize = flat[0].inclusiveSize

	// Show top by self size and top by inclusive size.
	const SYNTHETIC_HEAP = new Set(['(root)', '(program)', ''])
	const sortedSelf = flat
		.filter(
			n =>
				n.selfSize > 0 &&
				!SYNTHETIC_HEAP.has(n.callFrame.functionName),
		)
		.sort((a, b) => b.selfSize - a.selfSize)
	const sortedIncl = flat
		.filter(
			n =>
				n.inclusiveSize > 0 &&
				!SYNTHETIC_HEAP.has(n.callFrame.functionName),
		)
		.sort((a, b) => b.inclusiveSize - a.inclusiveSize)

	function fmtSize(bytes) {
		if (bytes >= 1024 * 1024)
			return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
		if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB'
		return bytes + ' B'
	}

	function frameRow(n, denom) {
		const fn = n.callFrame
		const name = fn.functionName || '(anonymous)'
		const url = (fn.url || '').replace(/^https?:\/\/[^/]+/, '')
		const loc = fn.lineNumber >= 0 ? `:${fn.lineNumber + 1}` : ''
		const sz = (
			n.selfSize > 0 ? fmtSize(n.selfSize) : fmtSize(n.inclusiveSize)
		).padStart(10)
		const pct = (
			((n.selfSize > 0 ? n.selfSize : n.inclusiveSize) / denom) *
			100
		)
			.toFixed(1)
			.padStart(5)
		return `  ${sz}  ${pct}%  ${name}  ${url}${loc}`
	}

	console.log()
	console.log(
		`Heap allocations during one cycle: ${fmtSize(totalSize)} (sampled at 1024B interval).`,
	)
	console.log()
	console.log('Top 25 allocation sites by SELF size:')
	console.log('  size       % total  function — file:line')
	console.log('  ---------- -------  ---------------------')
	for (let i = 0; i < Math.min(25, sortedSelf.length); i++) {
		console.log(frameRow(sortedSelf[i], totalSize))
	}

	console.log()
	console.log(
		'Top 25 allocation sites by INCLUSIVE size (self + descendants):',
	)
	console.log('  size       % total  function — file:line')
	console.log('  ---------- -------  ---------------------')
	for (let i = 0; i < Math.min(25, sortedIncl.length); i++) {
		const n = sortedIncl[i]
		const fn = n.callFrame
		const name = fn.functionName || '(anonymous)'
		const url = (fn.url || '').replace(/^https?:\/\/[^/]+/, '')
		const loc = fn.lineNumber >= 0 ? `:${fn.lineNumber + 1}` : ''
		const sz = fmtSize(n.inclusiveSize).padStart(10)
		const pct = ((n.inclusiveSize / totalSize) * 100)
			.toFixed(1)
			.padStart(5)
		console.log(`  ${sz}  ${pct}%  ${name}  ${url}${loc}`)
	}

	await closeServer()
	process.exit(0)
}

if (TRACE_MODE) {
	const page = await browser.newPage()
	const client = await page.createCDPSession()
	await page.goto(URL, { waitUntil: 'load' })
	for (let i = 0; i < 2; i++) await cycle(page) // warmup

	// Buffer the trace events. Tracing emits chunks as
	// `Tracing.dataCollected`, then signals completion with
	// `Tracing.tracingComplete`.
	const events = []
	client.on('Tracing.dataCollected', e => events.push(...e.value))
	const done = new Promise(res => {
		client.once('Tracing.tracingComplete', res)
	})

	console.log('[prof] capturing trace...')
	await client.send('Tracing.start', {
		categories:
			'devtools.timeline,disabled-by-default-devtools.timeline',
		options: 'record-as-much-as-possible',
		transferMode: 'SendEvents',
	})
	await cycle(page)
	await client.send('Tracing.end')
	await done
	await browser.close()

	// Filter to "X" (complete) events that have a duration. Each event
	// covers a specific phase. We bucket by category/name.
	const buckets = new Map()
	let cycleStart = Infinity
	let cycleEnd = -Infinity
	for (const e of events) {
		if (e.ph !== 'X' || typeof e.dur !== 'number') continue
		const key = e.name
		const cur = buckets.get(key) || { total: 0, count: 0 }
		cur.total += e.dur
		cur.count++
		buckets.set(key, cur)
		if (e.ts < cycleStart) cycleStart = e.ts
		if (e.ts + e.dur > cycleEnd) cycleEnd = e.ts + e.dur
	}

	const wall = cycleEnd - cycleStart
	const sorted = [...buckets.entries()].sort(
		(a, b) => b[1].total - a[1].total,
	)

	console.log()
	console.log(
		`Trace wall-clock window: ${(wall / 1000).toFixed(2)}ms (${events.length} events)`,
	)
	console.log()
	console.log('Time by trace event name (sums of `dur`, top 25):')
	console.log('   total ms   % wall   count   event name')
	console.log('  ---------  --------  ------  ----------')
	for (let i = 0; i < Math.min(25, sorted.length); i++) {
		const [name, b] = sorted[i]
		const ms = (b.total / 1000).toFixed(2).padStart(8)
		const pct = ((b.total / wall) * 100).toFixed(1).padStart(6)
		const cnt = String(b.count).padStart(6)
		console.log(`  ${ms}ms  ${pct}%  ${cnt}  ${name}`)
	}

	// Roll up into the categories most useful for our question:
	const ROLLUPS = {
		'JS execution': [
			'FunctionCall',
			'EvaluateScript',
			'V8.Execute',
			'RunTask',
			'RunMicrotasks',
			'TimerFire',
			'EventDispatch',
		],
		Layout: ['Layout', 'UpdateLayoutTree', 'InvalidateLayout'],
		Style: [
			'UpdateLayerTree',
			'RecalculateStyles',
			'ParseAuthorStyleSheet',
			'ScheduleStyleRecalculation',
		],
		Paint: [
			'Paint',
			'CompositeLayers',
			'PaintImage',
			'PrePaint',
			'Rasterize',
		],
		GC: [
			'MajorGC',
			'MinorGC',
			'V8.GCScavenger',
			'V8.GCCompactor',
			'V8.GCFinalizeMC',
		],
		'DOM events': ['DOMContentLoaded', 'load', 'beforeunload'],
		'V8 compile': ['V8.CompileScript', 'V8.OptimizeCode'],
	}

	console.log()
	console.log('Rollups (categories most relevant to our question):')
	console.log('   total ms   % wall   category')
	console.log('  ---------  --------  --------')
	for (const [label, names] of Object.entries(ROLLUPS)) {
		let sum = 0
		for (const n of names) {
			const b = buckets.get(n)
			if (b) sum += b.total
		}
		if (sum === 0) continue
		const ms = (sum / 1000).toFixed(2).padStart(8)
		const pct = ((sum / wall) * 100).toFixed(1).padStart(6)
		console.log(`  ${ms}ms  ${pct}%  ${label}`)
	}

	await closeServer()
	process.exit(0)
}

const profile = await (async () => {
	const page = await browser.newPage()
	const client = await page.createCDPSession()
	await client.send('Profiler.enable')
	// 1 microsecond — finest sampling V8 supports. Default is 1000us
	// (1ms), which is too coarse for a cycle that runs in <100ms.
	await client.send('Profiler.setSamplingInterval', { interval: 100 })
	await page.goto(URL, { waitUntil: 'load' })

	// Warmup so V8 has tiered up the hot paths.
	for (let i = 0; i < 2; i++) await cycle(page)

	console.log('[prof] capturing...')
	await client.send('Profiler.start')
	await cycle(page)
	const { profile } = await client.send('Profiler.stop')
	return profile
})()

await browser.close()

// Aggregate self-time AND inclusive time per profile node.
//
// CDP profile structure:
//  - `nodes[]` — each has `id`, `callFrame`, `children: number[]`
//  - `samples[]` — one node id per sample (samples are ALWAYS leaves
//    in the call tree)
//  - `timeDeltas[]` — microseconds between samples; `timeDeltas[i]`
//    credits `samples[i]`. (Spec is fuzzy on whether it's i or i-1;
//    practical Chrome behavior: index i.)
//
// Self-time: sum of timeDeltas where the leaf landed on this node.
// Inclusive time: self-time + sum(inclusive time of all descendants).
//
// Why both: a function whose self-time is small but whose inclusive
// time is large is calling expensive things — the cost is "in" it
// from a wall-clock perspective even if V8 attributes the samples
// to the callees. Conversely, a function with high self-time that
// matches its inclusive time IS the cost.
const byId = new Map()
for (const node of profile.nodes) {
	byId.set(node.id, {
		...node,
		selfTime: 0,
		inclusiveTime: 0,
		parent: null,
	})
}

// Wire up parent pointers (CDP gives only children).
for (const node of byId.values()) {
	if (node.children) {
		for (const c of node.children) {
			const child = byId.get(c)
			if (child) child.parent = node.id
		}
	}
}

const samples = profile.samples
const deltas = profile.timeDeltas
let total = 0
for (let i = 0; i < samples.length; i++) {
	const delta = deltas[i] || 0
	const node = byId.get(samples[i])
	if (node) node.selfTime += delta
	total += delta
}

// Compute inclusive time via iterative post-order traversal.
// Find roots (nodes nobody references as a child).
const childIds = new Set()
for (const node of byId.values()) {
	if (node.children) for (const c of node.children) childIds.add(c)
}
const roots = [...byId.values()].filter(n => !childIds.has(n.id))

for (const root of roots) {
	const stack = [[root.id, false]]
	while (stack.length) {
		const [id, visited] = stack.pop()
		const n = byId.get(id)
		if (!n) continue
		if (visited) {
			let inc = n.selfTime
			if (n.children) {
				for (const c of n.children) {
					const child = byId.get(c)
					if (child) inc += child.inclusiveTime
				}
			}
			n.inclusiveTime = inc
		} else {
			stack.push([id, true])
			if (n.children)
				for (const c of n.children) stack.push([c, false])
		}
	}
}

const sorted = [...byId.values()]
	.filter(n => n.selfTime > 0)
	.sort((a, b) => b.selfTime - a.selfTime)

console.log()
console.log(
	`Cycle profile: ${(total / 1000).toFixed(2)}ms total, ${samples.length} samples`,
)
console.log()
// Helper — render a row for a node by self+inclusive time.
function row(n, denomSelf, denomIncl) {
	const fn = n.callFrame
	const name = fn.functionName || '(anonymous)'
	const url = (fn.url || '').replace(/^https?:\/\/[^/]+/, '')
	const loc = fn.lineNumber >= 0 ? `:${fn.lineNumber + 1}` : ''
	const sm = (n.selfTime / 1000).toFixed(2).padStart(7)
	const sp = ((n.selfTime / denomSelf) * 100).toFixed(1).padStart(5)
	const im = (n.inclusiveTime / 1000).toFixed(2).padStart(7)
	const ip = ((n.inclusiveTime / denomIncl) * 100)
		.toFixed(1)
		.padStart(5)
	return `  ${sm}ms  ${sp}%   ${im}ms  ${ip}%   ${name}  ${url}${loc}`
}

const HEADER =
	'  self ms   self%   incl ms   incl%    function — file:line\n' +
	'  --------  ------  --------  ------   ---------------------'

// Filter "synthetic" frames — V8 reports a few non-JS buckets that
// dominate the top of the list and obscure where actual JS work
// happens. Listed:
//   (program)     — V8 internals / DOM / browser code
//   (idle)        — CPU asleep
//   (garbage collector) — GC ticks
//   (root)        — synthetic root of the call tree
const SYNTHETIC = new Set([
	'(program)',
	'(idle)',
	'(garbage collector)',
	'(root)',
])

const realFrames = sorted.filter(
	n => !SYNTHETIC.has(n.callFrame.functionName),
)

console.log()
console.log(
	'Top 20 real (non-synthetic) frames by SELF time — JS only:',
)
console.log(HEADER)
for (let i = 0; i < Math.min(20, realFrames.length); i++) {
	console.log(row(realFrames[i], total, total))
}

const byInclusive = [...byId.values()]
	.filter(
		n =>
			n.inclusiveTime > 0 && !SYNTHETIC.has(n.callFrame.functionName),
	)
	.sort((a, b) => b.inclusiveTime - a.inclusiveTime)

console.log()
console.log(
	'Top 20 real frames by INCLUSIVE time (self + all callees, including DOM):',
)
console.log(HEADER)
for (let i = 0; i < Math.min(20, byInclusive.length); i++) {
	console.log(row(byInclusive[i], total, total))
}

// User-JS-only view: frames whose URL is the bundle.
const userFrames = sorted.filter(n =>
	/\/main\.js$/.test(n.callFrame.url || ''),
)
const userTotal = userFrames.reduce((a, n) => a + n.selfTime, 0)
const userInclTotal = userFrames.reduce(
	(a, n) => Math.max(a, n.inclusiveTime),
	0,
)
console.log()
console.log(
	`User-JS only (main.js): ${(userTotal / 1000).toFixed(2)}ms self / ${(total / 1000).toFixed(2)}ms cycle (${((userTotal / total) * 100).toFixed(1)}%).`,
)
console.log('Top 20 user-JS by SELF time:')
console.log(HEADER)
for (let i = 0; i < Math.min(20, userFrames.length); i++) {
	console.log(row(userFrames[i], userTotal, total))
}

console.log()
console.log('Top 20 user-JS by INCLUSIVE time:')
console.log(HEADER)
const userByIncl = [...userFrames].sort(
	(a, b) => b.inclusiveTime - a.inclusiveTime,
)
for (let i = 0; i < Math.min(20, userByIncl.length); i++) {
	console.log(row(userByIncl[i], userTotal, total))
}

await closeServer()
