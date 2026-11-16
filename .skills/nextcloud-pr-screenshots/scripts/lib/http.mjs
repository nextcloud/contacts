/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// Minimal OCS and DAV clients with basic auth, for seeding and settings

function authHeader({ user, password }) {
	return 'Basic ' + Buffer.from(`${user}:${password}`).toString('base64')
}

/**
 * Call an OCS endpoint and return { status, ocsStatus, data }
 *
 * @param {object} env from loadEnv()
 * @param {{user: string, password: string}} auth credentials
 * @param {string} method HTTP method
 * @param {string} path path after /ocs/v2.php, e.g. /cloud/users
 * @param {object} [body] sent as form data
 */
export async function ocs(env, auth, method, path, body) {
	const res = await fetch(`${env.url}/ocs/v2.php${path}${path.includes('?') ? '&' : '?'}format=json`, {
		method,
		headers: {
			Authorization: authHeader(auth),
			'OCS-APIRequest': 'true',
			Accept: 'application/json',
			...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
		},
		body: body ? new URLSearchParams(body) : undefined,
	})
	let json = {}
	try {
		json = await res.json()
	} catch {}
	return { status: res.status, ocsStatus: json.ocs?.meta?.statuscode, data: json.ocs?.data }
}

/**
 * Send a DAV request and return { status, text }
 *
 * @param {object} env from loadEnv()
 * @param {{user: string, password: string}} auth credentials
 * @param {string} method HTTP or DAV method
 * @param {string} path path after /remote.php/dav, e.g. /files/alice/a.txt
 * @param {string|Buffer} [body] request body
 * @param {object} [headers] extra headers
 */
export async function dav(env, auth, method, path, body, headers = {}) {
	const res = await fetch(`${env.url}/remote.php/dav${path}`, {
		method,
		headers: { Authorization: authHeader(auth), ...headers },
		body,
	})
	return { status: res.status, text: await res.text() }
}

/**
 * List the hrefs one level below a DAV collection
 */
export async function davList(env, auth, path) {
	const { status, text } = await dav(env, auth, 'PROPFIND', path, undefined, { Depth: '1' })
	if (status >= 400) {
		return []
	}
	return [...text.matchAll(/<d:href>([^<]+)<\/d:href>/g)]
		.map((m) => decodeURIComponent(m[1]).replace(/^.*\/remote\.php\/dav/, ''))
		.filter((href) => href.replace(/\/$/, '') !== path.replace(/\/$/, ''))
}

/**
 * Run async tasks with limited concurrency. Dev instances often take ~0.5 s per request,
 * so seeding sequentially is slow.
 *
 * @param {Array} items inputs
 * @param {Function} fn async function called with each item
 * @param {number} [limit] parallel requests
 */
export async function pool(items, fn, limit = 8) {
	const results = []
	let next = 0
	await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
		while (next < items.length) {
			const i = next++
			results[i] = await fn(items[i], i)
		}
	}))
	return results
}

export const userAuth = (env) => ({ user: env.user.id, password: env.user.password })
export const adminAuth = (env) => ({ user: env.admin.user, password: env.admin.password })
