import { spawn, read, watch } from './utils.js'

/** @type {Map<string, import('child_process').ChildProcess>} */
const running = new Map()

function readScripts() {
	try {
		const pkg = JSON.parse(read('./package.json'))
		return Object.keys(pkg.scripts).filter(k =>
			k.startsWith('watch:'),
		)
	} catch {
		return null
	}
}

function start(script) {
	// detached creates a new process group so that stop() can signal
	// the whole subtree (watchdog → npm → node). watchdog.js also
	// self-terminates the group if we get SIGKILLed and can't run
	// our 'exit' handler.
	const child = spawn(
		'node',
		['tools/watchdog.js', 'npm', 'run', script],
		{
			stdio: 'inherit',
			detached: true,
		},
	)
	child.on('exit', (code, signal) => {
		if (!running.has(script)) return // intentionally stopped
		if (signal) {
			console.error(
				`${script} was killed by signal ${signal}, stopping.`,
			)
		} else if (code === 0) {
			console.error(
				`${script} exited cleanly (unexpected), stopping.`,
			)
		} else {
			console.error(
				`${script} failed with exit code ${code}, stopping.`,
			)
		}
		process.exit(code ?? 1)
	})
	running.set(script, child)
}

function stop(script) {
	const child = running.get(script)
	if (child) {
		running.delete(script)
		// kill the whole process group (negative pid)
		try {
			if (child.pid) process.kill(-child.pid, 'SIGTERM')
		} catch {
			child.kill()
		}
	}
}

function sync() {
	const scripts = readScripts()
	if (!scripts) return

	const current = new Set(running.keys())
	const next = new Set(scripts)

	for (const script of current) {
		if (!next.has(script)) stop(script)
	}
	for (const script of next) {
		if (!current.has(script)) start(script)
	}
}

sync()

let timeout
watch('./package.json', () => {
	clearTimeout(timeout)
	timeout = setTimeout(sync, 200)
})

// synchronous cleanup — 'exit' handlers can't await, but process.kill
// is sync and signals are delivered by the kernel.
function stopAllSync() {
	for (const script of [...running.keys()]) stop(script)
}

// cover every exit path (child crash, SIGINT/SIGTERM, uncaught) so
// detached children are never left behind in their own groups.
process.on('exit', stopAllSync)
process.on('SIGINT', () => process.exit(0))
process.on('SIGTERM', () => process.exit(0))
