// Runs a command and kills its process group when our own parent
// dies. Covers SIGKILL / segfault / OOM-kill on the parent, which
// can't run Node 'exit' handlers and would otherwise orphan the
// subtree.

import { spawn } from 'child_process'

const [, , cmd, ...args] = process.argv
if (!cmd) {
	console.error('watchdog: no command')
	process.exit(2)
}

const originalPpid = process.ppid

const child = spawn(cmd, args, { stdio: 'inherit' })
child.on('exit', (code, signal) =>
	process.exit(code ?? (signal ? 1 : 0)),
)

// poll for parent death. on Linux with systemd, orphans get reparented
// to systemd-user (not PID 1), so we compare against the original ppid
// rather than checking for 1. we were spawned detached, so -process.pid
// signals our whole subtree.
setInterval(() => {
	if (process.ppid !== originalPpid) {
		try {
			process.kill(-process.pid, 'SIGTERM')
		} catch {}
		process.exit(1)
	}
}, 1000).unref()
