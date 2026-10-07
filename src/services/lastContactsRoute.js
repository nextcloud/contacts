/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const LAST_CONTACTS_ROUTE_KEY = 'contacts:lastRoute'

/**
 * Routes we persist across visits (group / contact / address book views).
 */
const PERSISTABLE_ROUTE_NAMES = new Set([
	'group',
	'contact',
	'addressbook',
	'addressbook-contact',
])

/**
 * Default landing route when nothing is stored yet.
 *
 * @return {{ name: string, params: Record<string, string> }}
 */
export function getDefaultContactsRoute() {
	return {
		name: 'group',
		params: { selectedGroup: t('contacts', 'All contacts') },
	}
}

/**
 * Read the last selected group/contact route from localStorage.
 *
 * @return {{ name: string, params: Record<string, string> }}
 */
export function getLastContactsRoute() {
	try {
		const raw = localStorage.getItem(LAST_CONTACTS_ROUTE_KEY)
		if (!raw) {
			return getDefaultContactsRoute()
		}
		const parsed = JSON.parse(raw)
		if (!parsed || typeof parsed !== 'object' || typeof parsed.name !== 'string') {
			return getDefaultContactsRoute()
		}
		if (!PERSISTABLE_ROUTE_NAMES.has(parsed.name)) {
			return getDefaultContactsRoute()
		}
		const params = parsed.params && typeof parsed.params === 'object' ? parsed.params : {}
		return { name: parsed.name, params }
	} catch {
		return getDefaultContactsRoute()
	}
}

/**
 * Persist the current contacts route for the next visit.
 *
 * @param {{ name?: string | null, params?: Record<string, string> }} route
 */
export function persistContactsRoute(route) {
	if (!route?.name || !PERSISTABLE_ROUTE_NAMES.has(route.name)) {
		return
	}
	try {
		localStorage.setItem(LAST_CONTACTS_ROUTE_KEY, JSON.stringify({
			name: route.name,
			params: route.params || {},
		}))
	} catch {
		// ignore quota / private mode
	}
}
