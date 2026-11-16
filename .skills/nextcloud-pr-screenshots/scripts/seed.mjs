#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// Create or reset the screenshot test user, and load neutral data for the apps under test.
// Usage: node seed.mjs [--fixtures contacts:some,files:empty] [--user shotuser]
//        node seed.mjs --delete            remove the test user again
// Every run is idempotent: it resets the user's theme and language and replaces fixture data.

import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadEnv, parseArgs, saveEnv } from './lib/env.mjs'
import { adminAuth, dav, davList, ocs, pool, userAuth } from './lib/http.mjs'

const args = parseArgs(process.argv.slice(2))
const env = loadEnv()
if (args.user) {
	env.user.id = args.user
}
const admin = adminAuth(env)
const uid = encodeURIComponent(env.user.id)

if (args.delete) {
	const res = await ocs(env, admin, 'DELETE', `/cloud/users/${uid}`)
	console.log(res.status === 200 ? `Deleted ${env.user.id}` : `Could not delete ${env.user.id} (HTTP ${res.status})`)
	process.exit(res.status === 200 ? 0 : 1)
}

const THEMES = ['light', 'dark', 'light-highcontrast', 'dark-highcontrast', 'opendyslexic']

// User: create, or reset the password of an existing one so we can log in
const created = await ocs(env, admin, 'POST', '/cloud/users', { userid: env.user.id, password: env.user.password, displayName: env.user.displayName })
if (created.status !== 200) {
	const reset = await ocs(env, admin, 'PUT', `/cloud/users/${uid}`, { key: 'password', value: env.user.password })
	if (reset.status !== 200) {
		throw new Error(`Could not create or reset user ${env.user.id} (HTTP ${created.status}/${reset.status})`)
	}
}
// Language back to English and theme back to the default ("auto": follows the browser's light/dark preference)
const user = userAuth(env)
await Promise.all([
	...[['displayname', env.user.displayName], ['language', 'en'], ['locale', 'en_US']]
		.map(([key, value]) => ocs(env, admin, 'PUT', `/cloud/users/${uid}`, { key, value })),
	...THEMES.map((theme) => ocs(env, user, 'DELETE', `/apps/theming/api/v1/theme/${theme}`)),
])
await ocs(env, user, 'PUT', '/apps/theming/api/v1/theme/default/enable')
console.log(`User ${env.user.id} ("${env.user.displayName}") ready, theme and language reset`)

// Fixtures
const fixtureDir = path.join(import.meta.dirname, 'fixtures')
const available = fs.readdirSync(fixtureDir).filter((f) => f.endsWith('.mjs')).map((f) => f.slice(0, -4))
const requested = typeof args.fixtures === 'string' ? args.fixtures.split(',').filter(Boolean) : []
await Promise.all(requested.map(async (spec) => {
	const [name, set = 'some'] = spec.split(':')
	if (!available.includes(name)) {
		throw new Error(`Unknown fixture "${name}". Available: ${available.join(', ')}`)
	}
	const { default: apply } = await import(pathToFileURL(path.join(fixtureDir, `${name}.mjs`)).href)
	await apply({ env, auth: user, admin, dav, davList, ocs, pool }, set)
	console.log(`Fixture ${name}:${set} loaded`)
}))

saveEnv(env)
