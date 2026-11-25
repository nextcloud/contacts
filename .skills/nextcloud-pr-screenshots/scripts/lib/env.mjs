/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export const CACHE_DIR = process.env.NC_SHOTS_CACHE ?? path.join(process.env.XDG_CACHE_HOME ?? path.join(os.homedir(), '.cache'), 'nc-pr-shots')
const ENV_FILE = path.join(CACHE_DIR, 'env.json')

export const VIEWPORTS = {
	desktop: { width: 1440, height: 900 },
	tablet: { width: 768, height: 1024 },
	mobile: { width: 375, height: 812 },
}

/**
 * Settings from env vars, falling back to what preflight.mjs and seed.mjs cached
 */
export function loadEnv() {
	const cached = fs.existsSync(ENV_FILE) ? JSON.parse(fs.readFileSync(ENV_FILE, 'utf8')) : {}
	const url = (process.env.NC_URL ?? cached.url ?? 'http://nextcloud.local').replace(/\/$/, '')
	const userId = process.env.NC_SHOTS_USER ?? 'shotuser'
	const sameUser = cached.url === url && cached.user?.id === userId
	return {
		url,
		prefix: cached.url === url ? cached.prefix : '/index.php',
		admin: { user: process.env.NC_ADMIN_USER ?? 'admin', password: process.env.NC_ADMIN_PASS ?? 'admin' },
		user: {
			id: userId,
			displayName: 'Sam Tester',
			password: sameUser ? cached.user.password : `Shots-${Math.random().toString(36).slice(2, 12)}!`,
		},
	}
}

export function saveEnv({ url, prefix, user }) {
	fs.mkdirSync(CACHE_DIR, { recursive: true })
	fs.writeFileSync(ENV_FILE, JSON.stringify({ url, prefix, user }, null, '\t'), { mode: 0o600 })
}

export async function importPlaywright() {
	const entry = path.join(CACHE_DIR, 'node_modules', 'playwright', 'index.mjs')
	if (!fs.existsSync(entry)) {
		throw new Error('Playwright is not installed. Run preflight.mjs first.')
	}
	return import(pathToFileURL(entry).href)
}

/**
 * Parse `--key value`, `--key=value` and `--flag` arguments
 */
export function parseArgs(argv) {
	const args = { _: [] }
	for (let i = 0; i < argv.length; i++) {
		const [key, inline] = argv[i].startsWith('--') ? argv[i].slice(2).split('=', 2) : []
		if (!key) {
			args._.push(argv[i])
		} else if (inline !== undefined) {
			args[key] = inline
		} else {
			args[key] = argv[i + 1]?.startsWith('--') === false ? argv[++i] : true
		}
	}
	return args
}
