/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const basic = ({ user, password }) => 'Basic ' + Buffer.from(`${user}:${password}`).toString('base64')

/**
 * OCS request; `body` is sent as form data (an object or [[key, value], …] for arrays)
 *
 * @return {Promise<{status: number, data: any}>}
 */
export async function ocs(env, auth, method, path, body) {
	const res = await fetch(`${env.url}/ocs/v2.php${path}${path.includes('?') ? '&' : '?'}format=json`, {
		method,
		headers: { Authorization: basic(auth), 'OCS-APIRequest': 'true', Accept: 'application/json' },
		body: body ? new URLSearchParams(body) : undefined,
	})
	const json = await res.json().catch(() => ({}))
	return { status: res.status, data: json.ocs?.data }
}

/**
 * DAV request; `path` is relative to /remote.php/dav
 */
export async function dav(env, auth, method, path, body, headers = {}) {
	const res = await fetch(`${env.url}/remote.php/dav${path}`, { method, headers: { Authorization: basic(auth), ...headers }, body })
	return { status: res.status, text: await res.text() }
}

/**
 * Paths of the direct children of a DAV collection
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
 * Map over items with limited concurrency; dev instances often take ~0.5 s per request
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
export const adminAuth = (env) => env.admin
