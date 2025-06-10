import path from 'path'
import fs from 'fs'

export const read = name =>
	fs.readFileSync(name, { encoding: 'utf8' })

export const write = (name, content) => {
	if (!exists(name) || read(name) !== content) {
		fs.writeFileSync(mkdir(name), content)
		return true
	}
}

export const exists = name => fs.existsSync(name)

export const append = (name, content) =>
	fs.appendFileSync(mkdir(name), content)

export const isDirectory = name => fs.statSync(name).isDirectory()

export const remove = name => {
	try {
		fs.rmSync(name, { recursive: true })
		if (/[^\/]+\.[^\/]+$/.test(name)) {
			fs.rmdirSync(path.dirname(name))
		}
	} catch (e) {}
}

export const move = (source, destination) =>
	fs.renameSync(source, mkdir(destination))

export const copy = (source, destination) =>
	fs.copyFileSync(source, mkdir(destination))

export const mkdir = dir => {
	fs.mkdirSync(
		/[^\/]+\.[^\/]+$/.test(dir) ? path.dirname(dir) : dir,
		{
			recursive: true,
		},
	)
	return dir
}

export const files = dir =>
	fs.readdirSync(dir).map(file => dir + file)

export const readdir = dir => fs.readdirSync(dir)

export const filesRecursive = dir =>
	fs
		.readdirSync(dir, {
			recursive: true,
		})
		.map(file => dir + file)

export const watch = (dir, fn) =>
	fs.watch(dir, { recursive: true }, fn)
