#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// Create the test user (or reset its theme and language) and load fixtures.
// Usage: node seed.mjs [--fixtures contacts:some,files:empty] | --delete
// Only ever touches an account this script created: an existing account is used only if the
// cached password works, and a password is never reset.

import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadEnv, parseArgs, saveEnv } from './lib/env.mjs'
import { adminAuth, dav, davList, ocs, pool, userAuth } from './lib/http.mjs'

const args = parseArgs(process.argv.slice(2))
const env = loadEnv()
const admin = adminAuth(env)
const user = userAuth(env)
const uid = encodeURIComponent(env.user.id)

const exists = (await ocs(env, admin, 'GET', `/cloud/users/${uid}`)).status === 200
if (exists && (env.user.id === admin.user || (await ocs(env, user, 'GET', '/cloud/user')).status !== 200)) {
	console.error(`"${env.user.id}" is an existing account that seed.mjs did not create. Set NC_SHOTS_USER to an unused id.`)
	process.exit(1)
}

if (args.delete) {
	if (exists) {
		await ocs(env, admin, 'DELETE', `/cloud/users/${uid}`)
	}
	console.log(`Deleted ${env.user.id}`)
	process.exit(0)
}

if (!exists) {
	const res = await ocs(env, admin, 'POST', '/cloud/users', { userid: env.user.id, password: env.user.password, displayName: env.user.displayName })
	if (res.status !== 200) {
		throw new Error(`Creating ${env.user.id} failed (HTTP ${res.status})`)
	}
	saveEnv({ ...loadEnv(), user: env.user })
}

// English, and the default theme, which follows the browser's light/dark preference
await Promise.all([
	ocs(env, admin, 'PUT', `/cloud/users/${uid}`, { key: 'language', value: 'en' }),
	ocs(env, admin, 'PUT', `/cloud/users/${uid}`, { key: 'locale', value: 'en_US' }),
	...['light', 'dark', 'light-highcontrast', 'dark-highcontrast', 'opendyslexic']
		.map((theme) => ocs(env, user, 'DELETE', `/apps/theming/api/v1/theme/${theme}`)),
	// Don't show the first-run wizard (if that app is installed)
	fetch(`${env.url}${env.prefix}/apps/firstrunwizard/wizard`, {
		method: 'DELETE',
		headers: { Authorization: 'Basic ' + Buffer.from(`${user.user}:${user.password}`).toString('base64'), 'OCS-APIRequest': 'true' },
	}),
])
console.log(`User ${env.user.id} ready`)

// Fixtures fail on any rejected write (an existing folder on MKCOL is fine)
async function checkedDav(...a) {
	const res = await dav(...a)
	if (res.status >= 400 && a[2] !== 'DELETE' && !(a[2] === 'MKCOL' && res.status === 405)) {
		throw new Error(`${a[2]} ${a[3]} failed (HTTP ${res.status})`)
	}
	return res
}

const fixtureDir = path.join(import.meta.dirname, 'fixtures')
await Promise.all((typeof args.fixtures === 'string' ? args.fixtures.split(',') : []).map(async (spec) => {
	const [name, set = 'some'] = spec.split(':')
	if (!fs.existsSync(path.join(fixtureDir, `${name}.mjs`))) {
		throw new Error(`Unknown fixture "${name}". Available: ${fs.readdirSync(fixtureDir).map((f) => f.slice(0, -4)).join(', ')}`)
	}
	const { default: load } = await import(pathToFileURL(path.join(fixtureDir, `${name}.mjs`)).href)
	await load({ env, auth: user, dav: checkedDav, davList, ocs, pool }, set)
	console.log(`Fixture ${name}:${set} loaded`)
}))
