/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { namespaces as NS } from '@nextcloud/cdav-library'
import { Buffer } from 'buffer'
import { GROUP_NO_GROUP_CONTACTS } from '../models/constants.ts'
import client from './cdav.js'

/**
 * Queries currently running, by query id and address book id
 *
 * @type {Map<string, Promise>}
 */
const pendingQueries = new Map()

/**
 * Group queries that completed, by query id and address book id
 *
 * @type {Set<string>}
 */
const completedGroupQueries = new Set()

/**
 * Whether the server pages addressbook-query results, so that address books are loaded page by page
 *
 * @return {boolean}
 */
export function isContactsPagingEnabled() {
	return client.isAddressBookQueryContinuationSupported?.() === true
}

/**
 * Whether every contact of the address book has been loaded through paging
 *
 * @param {object} addressbook the store address book
 * @return {boolean}
 */
export function isAddressbookFullyLoaded(addressbook) {
	return addressbook.paginated === true && addressbook.continuationToken === null
}

/**
 * Build a text-match element of an addressbook-query filter
 *
 * @param {string} value the text to match
 * @param {string} matchType one of equals, contains, starts-with, ends-with
 * @return {object}
 */
function textMatch(value, matchType) {
	return {
		name: [NS.IETF_CARDDAV, 'text-match'],
		attributes: [
			['collation', 'i;unicode-casemap'],
			['match-type', matchType],
		],
		value,
	}
}

/**
 * Filter matching the contacts of a group
 *
 * @param {string} groupName the name of the group
 * @return {object[]}
 */
export function groupFilter(groupName) {
	return [{
		name: [NS.IETF_CARDDAV, 'prop-filter'],
		attributes: [['name', 'CATEGORIES']],
		children: [textMatch(groupName, 'contains')],
	}]
}

/**
 * Filter matching the contacts without any group
 *
 * @return {object[]}
 */
export function notGroupedFilter() {
	return [{
		name: [NS.IETF_CARDDAV, 'prop-filter'],
		attributes: [['name', 'CATEGORIES']],
		children: [{ name: [NS.IETF_CARDDAV, 'is-not-defined'] }],
	}]
}

/**
 * Filter matching the contact with the given uid
 *
 * @param {string} uid the uid of the contact
 * @return {object[]}
 */
export function uidFilter(uid) {
	return [{
		name: [NS.IETF_CARDDAV, 'prop-filter'],
		attributes: [['name', 'UID']],
		children: [textMatch(uid, 'equals')],
	}]
}

/**
 * Decode a contact key built by generateContactKey
 *
 * @param {string} key the contact key
 * @return {{uid: string, addressbookId: string}|null} null when the key is not a contact key
 */
export function parseContactKey(key) {
	if (typeof key !== 'string' || key === '') {
		return null
	}

	const decoded = Buffer.from(key, 'base64').toString('utf8')
	const separator = decoded.lastIndexOf('~')
	if (separator <= 0 || Buffer.from(decoded, 'utf8').toString('base64') !== key) {
		return null
	}

	return {
		uid: decoded.slice(0, separator),
		addressbookId: decoded.slice(separator + 1),
	}
}

/**
 * Run a queryContacts store action once at a time per query id and address book
 *
 * @param {object} store the vuex store
 * @param {string} id the query id
 * @param {object} addressbook the address book to query
 * @param {object[]} filter the addressbook-query filter
 * @return {Promise<string[]>} the keys of the matching contacts
 */
function queryAddressbook(store, id, addressbook, filter) {
	const queryKey = `${id}\n${addressbook.id}`
	if (!pendingQueries.has(queryKey)) {
		pendingQueries.set(queryKey, store.dispatch('queryContacts', { addressbook, filter })
			.finally(() => pendingQueries.delete(queryKey)))
	}
	return pendingQueries.get(queryKey)
}

/**
 * Load every contact of a group, or every contact without group, from the enabled address books
 * that are not fully loaded yet. Each group is only queried once per address book.
 *
 * @param {object} store the vuex store
 * @param {string} groupName the group name, or GROUP_NO_GROUP_CONTACTS
 * @return {Promise<void>}
 */
export async function loadGroupContacts(store, groupName) {
	if (!isContactsPagingEnabled()) {
		return
	}

	const id = groupName === GROUP_NO_GROUP_CONTACTS ? 'not-grouped' : `group:${groupName}`
	const filter = groupName === GROUP_NO_GROUP_CONTACTS ? notGroupedFilter() : groupFilter(groupName)

	await Promise.all(store.getters.getAddressbooks
		.filter((addressbook) => addressbook.enabled && !isAddressbookFullyLoaded(addressbook))
		.filter((addressbook) => !completedGroupQueries.has(`${id}\n${addressbook.id}`))
		.map(async (addressbook) => {
			await queryAddressbook(store, id, addressbook, filter)
			completedGroupQueries.add(`${id}\n${addressbook.id}`)
		}))
}

/**
 * Load a contact that is not loaded yet from an enabled address book
 *
 * @param {object} store the vuex store
 * @param {string} addressbookId the id of the address book
 * @param {string} uid the uid of the contact
 * @return {Promise<boolean>} whether the contact is loaded
 */
export async function loadContactByUid(store, addressbookId, uid) {
	const addressbook = store.getters.getAddressbooks
		.find((addressbook) => addressbook.id === addressbookId && addressbook.enabled)
	if (!addressbook) {
		return false
	}
	if (addressbook.contacts[uid]) {
		return true
	}
	if (!isContactsPagingEnabled() || isAddressbookFullyLoaded(addressbook)) {
		return false
	}

	await queryAddressbook(store, `uid:${uid}`, addressbook, uidFilter(uid))
	return !!addressbook.contacts[uid]
}

/**
 * Load a contact that is not in the store yet from its address book
 *
 * @param {object} store the vuex store
 * @param {string} key the contact key
 * @return {Promise<boolean>} whether the contact is in the store
 */
export async function loadContactByKey(store, key) {
	if (store.getters.getContact(key)) {
		return true
	}
	if (!isContactsPagingEnabled()) {
		return false
	}

	const contactId = parseContactKey(key)
	if (!contactId) {
		return false
	}

	await loadContactByUid(store, contactId.addressbookId, contactId.uid)
	return !!store.getters.getContact(key)
}
