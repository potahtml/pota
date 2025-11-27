import path from 'path'
import fs from 'fs'

/**
 * Reads a UTF-8 encoded file from disk.
 *
 * @param {string} name
 * @returns {string}
 */
export const read = name =>
	fs.readFileSync(name, { encoding: 'utf8' })

/**
 * Writes content to disk only when it changed.
 *
 * @param {string} name
 * @param {string} content
 * @returns {boolean | undefined} True when the file was updated.
 */
export const write = (name, content) => {
	if (!exists(name) || read(name) !== content) {
		fs.writeFileSync(mkdir(name), content)
		return true
	}
}

/**
 * Checks whether a path exists.
 *
 * @param {string} name
 * @returns {boolean}
 */
export const exists = name => fs.existsSync(name)

/**
 * Appends content to a file, creating directories as needed.
 *
 * @param {string} name
 * @param {string} content
 * @returns {void}
 */
export const append = (name, content) =>
	fs.appendFileSync(mkdir(name), content)

/**
 * Determines whether a path points to a directory.
 *
 * @param {string} name
 * @returns {boolean}
 */
export const isDirectory = name => fs.statSync(name).isDirectory()

/**
 * Removes a file or directory tree if it exists.
 *
 * @param {string} name
 * @returns {void}
 */
export const remove = name => {
	try {
		fs.rmSync(name, { recursive: true })
		if (/[^\/]+\.[^\/]+$/.test(name)) {
			fs.rmdirSync(path.dirname(name))
		}
	} catch (e) {}
}

/**
 * Moves a file or directory to a new location.
 *
 * @param {string} source
 * @param {string} destination
 * @returns {void}
 */
export const move = (source, destination) =>
	fs.renameSync(source, mkdir(destination))

/**
 * Copies a file to a new location.
 *
 * @param {string} source
 * @param {string} destination
 * @returns {void}
 */
export const copy = (source, destination) =>
	fs.copyFileSync(source, mkdir(destination))

/**
 * Ensures the directory portion of a path exists and returns the
 * original path.
 *
 * @param {string} dir
 * @returns {string}
 */
export const mkdir = dir => {
	fs.mkdirSync(
		/[^\/]+\.[^\/]+$/.test(dir) ? path.dirname(dir) : dir,
		{
			recursive: true,
		},
	)
	return dir
}

/**
 * Returns absolute file paths for the direct children of a directory.
 *
 * @param {string} dir
 * @returns {string[]}
 */
export const files = dir =>
	fs.readdirSync(dir).map(file => dir + file)

/**
 * Reads a directory and returns the names of its entries.
 *
 * @param {string} dir
 * @returns {string[]}
 */
export const readdir = dir => fs.readdirSync(dir)

/**
 * Recursively lists files under `dir`, returning absolute paths.
 *
 * @param {string} dir
 * @returns {string[]}
 */
export const filesRecursive = dir =>
	fs
		.readdirSync(dir, {
			recursive: true,
		})
		.map(file => dir + file)

/**
 * Watches a directory tree and runs a callback on changes.
 *
 * @param {string} dir
 * @param {(eventType: string, filename: string) => void} fn
 * @returns {import('fs').FSWatcher}
 */
export const watch = (dir, fn) =>
	fs.watch(dir, { recursive: true }, fn)
