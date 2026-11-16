/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// Shared settings for all scripts, cached in ~/.cache/nc-pr-shots/env.json by preflight.mjs.
// Environment variables always win over the cached file.

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export const CACHE_DIR = process.env.NC_SHOTS_CACHE
	?? path.join(process.env.XDG_CACHE_HOME ?? path.join(os.homedir(), '.cache'), 'nc-pr-shots')
const ENV_FILE = path.join(CACHE_DIR, 'env.json')

export const VIEWPORTS = {
	desktop: { width: 1440, height: 900 },
	tablet: { width: 768, height: 1024 },
	mobile: { width: 375, height: 812 },
}

export function loadEnv() {
	let cached = {}
	try {
		cached = JSON.parse(fs.readFileSync(ENV_FILE, 'utf8'))
	} catch {}
	const url = (process.env.NC_URL ?? cached.url ?? 'http://nextcloud.local').replace(/\/$/, '')
	const sameInstance = cached.url === url
	return {
		url,
		// '' when pretty URLs work, '/index.php' otherwise
		prefix: process.env.NC_URL_PREFIX ?? (sameInstance ? cached.prefix : undefined) ?? '/index.php',
		hostResolverRule: sameInstance ? cached.hostResolverRule : undefined,
		chromePath: process.env.NC_SHOTS_CHROME ?? cached.chromePath,
		admin: {
			user: process.env.NC_ADMIN_USER ?? cached.admin?.user ?? 'admin',
			password: process.env.NC_ADMIN_PASS ?? cached.admin?.password ?? 'admin',
		},
		user: {
			id: process.env.NC_SHOTS_USER ?? cached.user?.id ?? 'shotuser',
			displayName: cached.user?.displayName ?? 'Sam Tester',
			password: cached.user?.password ?? 'Shots-' + Math.random().toString(36).slice(2, 10) + '-2026!',
		},
	}
}

export function saveEnv(env) {
	fs.mkdirSync(CACHE_DIR, { recursive: true })
	fs.writeFileSync(ENV_FILE, JSON.stringify(env, null, '\t'), { mode: 0o600 })
}

/**
 * Import Playwright from the skill's own install, the cache, or the current project
 */
export async function importPlaywright() {
	const candidates = [
		path.join(CACHE_DIR, 'node_modules', 'playwright', 'index.mjs'),
		path.join(process.cwd(), 'node_modules', 'playwright', 'index.mjs'),
	]
	for (const file of candidates) {
		if (fs.existsSync(file)) {
			return import(pathToFileURL(file).href)
		}
	}
	try {
		return await import('playwright')
	} catch {
		throw new Error(`Playwright is not installed. Run: node ${path.join(import.meta.dirname, '..', 'preflight.mjs')}`)
	}
}

/**
 * Parse --key value / --flag arguments
 *
 * @param {string[]} argv process.argv.slice(2)
 */
export function parseArgs(argv) {
	const args = { _: [] }
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i]
		if (!a.startsWith('--')) {
			args._.push(a)
			continue
		}
		const [key, inline] = a.slice(2).split('=', 2)
		if (inline !== undefined) {
			args[key] = inline
		} else if (argv[i + 1] !== undefined && !argv[i + 1].startsWith('--')) {
			args[key] = argv[++i]
		} else {
			args[key] = true
		}
	}
	return args
}
