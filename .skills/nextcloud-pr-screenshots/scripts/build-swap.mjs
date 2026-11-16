#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// Before/after without checkout → rebuild → checkout: build the base ref once in a worktree
// inside the repo, then switch which build the instance serves by symlinking the build output.
// Only valid when the change is frontend-only; `prepare` warns otherwise.
//
// Usage (run in the repo, with the PR branch checked out and built):
//   node build-swap.mjs prepare origin/main   worktree + build of the base (reuses node_modules if the lockfile is unchanged)
//   node build-swap.mjs use base              serve the base build
//   node build-swap.mjs use head              serve the PR build again
//   node build-swap.mjs clean                 serve head and remove the worktree

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { parseArgs } from './lib/env.mjs'

const args = parseArgs(process.argv.slice(2))
const [cmd, arg] = args._
const repo = path.resolve(args['app-dir'] ?? process.cwd())
const WT = '.nc-shots-base'
const wt = path.join(repo, WT)
const git = (...a) => execFileSync('git', ['-C', repo, ...a], { encoding: 'utf8' }).trim()
const HEAD_SUFFIX = '.nc-shots-head'

// Build output = top-level dirs the build writes that git ignores (js/, dist/, css/ in some apps).
// Detected once by `prepare`, while they are still real directories, and saved next to the worktree.
const stateFile = path.join(repo, `${WT}.json`)
function detectOutputDirs() {
	return ['js', 'dist', 'css'].filter((d) => {
		if (!fs.existsSync(path.join(wt, d)) || fs.lstatSync(path.join(repo, d), { throwIfNoEntry: false })?.isSymbolicLink()) { return false }
		try {
			git('check-ignore', '-q', `${d}/`)
			return true
		} catch {
			return false
		}
	})
}
const outputDirs = () => JSON.parse(fs.readFileSync(stateFile, 'utf8')).dirs

function use(which) {
	if (!fs.existsSync(stateFile)) {
		throw new Error('Run "node build-swap.mjs prepare <base-ref>" first')
	}
	for (const d of outputDirs()) {
		const served = path.join(repo, d)
		const kept = served + HEAD_SUFFIX
		const isLink = fs.existsSync(served) && fs.lstatSync(served).isSymbolicLink()
		if (which === 'base') {
			if (!isLink && fs.existsSync(served)) {
				fs.renameSync(served, kept)
			}
			if (isLink) {
				fs.unlinkSync(served)
			}
			fs.symlinkSync(path.join(WT, d), served)
		} else {
			if (isLink) {
				fs.unlinkSync(served)
			}
			if (fs.existsSync(kept)) {
				fs.renameSync(kept, served)
			}
		}
	}
	console.log(`Serving the ${which} build`)
}

if (cmd === 'prepare') {
	if (!arg) {
		throw new Error('Usage: node build-swap.mjs prepare <base-ref>')
	}
	const changed = git('diff', '--name-only', `${arg}...HEAD`).split('\n').filter(Boolean)
	const backend = changed.filter((f) => !/^(src|css|img|l10n|tests?|cypress|playwright|\.github)\/|\.(md|json|js|mjs|ts|vue|scss|css)$/.test(f) || /^(lib|appinfo|templates)\//.test(f))
	if (backend.length) {
		console.log(`warn  the PR also changes non-frontend files, so "before" shots need a real checkout of ${arg}:\n      ${backend.slice(0, 8).join('\n      ')}`)
	}
	const exclude = path.join(git('rev-parse', '--git-common-dir').replace(/^(?!\/)/, repo + '/'), 'info', 'exclude')
	const excluded = fs.readFileSync(exclude, 'utf8').split('\n')
	const missing = [`/${WT}/`, `/${WT}.json`, `/*${HEAD_SUFFIX}`].filter((l) => !excluded.includes(l))
	if (missing.length) {
		fs.appendFileSync(exclude, `\n${missing.join('\n')}\n`)
	}
	if (fs.existsSync(stateFile)) {
		use('head')
	}
	if (fs.existsSync(wt)) {
		git('worktree', 'remove', '--force', WT)
	}
	git('worktree', 'add', '--detach', WT, arg)
	let lockChanged = true
	try {
		git('diff', '--quiet', arg, 'HEAD', '--', 'package-lock.json')
		lockChanged = false
	} catch {}
	if (!lockChanged && fs.existsSync(path.join(repo, 'node_modules'))) {
		fs.symlinkSync(path.join(repo, 'node_modules'), path.join(wt, 'node_modules'))
		console.log('…     lockfile unchanged, reusing node_modules')
	} else {
		execFileSync('npm', ['ci', '--no-audit', '--no-fund'], { cwd: wt, stdio: 'inherit' })
	}
	execFileSync('npm', ['run', 'build'], { cwd: wt, stdio: 'inherit' })
	fs.writeFileSync(stateFile, JSON.stringify({ base: arg, dirs: detectOutputDirs() }))
	console.log(`Base ${arg} built in ${wt}. Now: use base → run.mjs --tag before → use head → run.mjs --tag after`)
} else if (cmd === 'use' && ['base', 'head'].includes(arg)) {
	use(arg)
} else if (cmd === 'clean') {
	if (fs.existsSync(stateFile)) {
		use('head')
		fs.unlinkSync(stateFile)
	}
	if (fs.existsSync(wt)) {
		git('worktree', 'remove', '--force', WT)
	}
	console.log('Worktree removed')
} else {
	console.error('Usage: node build-swap.mjs prepare <base-ref> | use base|head | clean')
	process.exit(2)
}
