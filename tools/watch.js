import { spawn, read, watch } from './utils.js'

/** @type {Map<string, import('child_process').ChildProcess>} */
const running = new Map()

function readScripts() {
	try {
		const pkg = JSON.parse(read('./package.json'))
		return Object.keys(pkg.scripts).filter(k => k.startsWith('watch:'))
	} catch {
		return null
	}
}

function start(script) {
	const child = spawn('npm', ['run', script], {
		stdio: 'inherit',
		shell: true,
	})
	child.on('exit', (code, signal) => {
		if (!running.has(script)) return // intentionally stopped
		if (signal) {
			console.error(`${script} was killed by signal ${signal}, stopping.`)
		} else if (code === 0) {
			console.error(`${script} exited cleanly (unexpected), stopping.`)
		} else {
			console.error(`${script} failed with exit code ${code}, stopping.`)
		}
		process.exit(code ?? 1)
	})
	running.set(script, child)
}

function stop(script) {
	const child = running.get(script)
	if (child) {
		running.delete(script)
		child.kill()
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

function stopAll() {
	for (const script of running.keys()) stop(script)
	process.exit(0)
}

process.on('SIGINT', stopAll)
process.on('SIGTERM', stopAll)
