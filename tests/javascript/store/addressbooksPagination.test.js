/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// The store index has to be imported first to avoid a circular import issue
import store from '../../../src/store/index.js'
import { namespaces } from '@nextcloud/cdav-library'
import { CONTACTS_PAGE_SIZE } from '../../../src/models/constants.ts'
import { MinimalContactProperties } from '../../../src/models/contact.js'
import client from '../../../src/services/cdav.js'
import { SearchContactProperties } from '../../../src/store/addressbooks.js'

const CARDDAV = 'urn:ietf:params:xml:ns:carddav'
namespaces.IETF_CARDDAV = CARDDAV

/**
 * @param {string} uid the contact uid
 * @param {string} fullName the contact name
 * @param {string[]} categories the contact groups
 * @return {object} a VCard object as returned by the cdav library
 */
function vcard(uid, fullName, categories = []) {
	const lines = ['BEGIN:VCARD', 'VERSION:4.0', `UID:${uid}`, `FN:${fullName}`]
	if (categories.length > 0) {
		lines.push(`CATEGORIES:${categories.join(',')}`)
	}
	lines.push('END:VCARD')
	return { data: lines.join('\n'), url: `/remote.php/dav/addressbooks/users/admin/ab1/${uid}.vcf` }
}

/**
 * @return {{promise: Promise, resolve: Function}}
 */
function deferred() {
	let resolve
	const promise = new Promise((res) => {
		resolve = res
	})
	return { promise, resolve }
}

let dav

const addressbook = () => store.getters.getAddressbooks[0]
const sortedNames = () => store.getters.getSortedContacts.map((entry) => entry.value)

beforeEach(() => {
	dav = {
		findPageAndFilterBySimpleProperties: jest.fn(),
		findAllAndFilterBySimpleProperties: jest.fn(),
		addressbookQuery: jest.fn(),
	}
	client.isAddressBookQueryContinuationSupported = jest.fn(() => true)

	store.state.addressbooks.addressbooks.splice(0)
	store.commit('resetContactSearch', '')
	store.state.contacts.contacts = {}
	store.state.contacts.sortedContacts.splice(0)
	store.state.groups.groups.splice(0)
	store.commit('addAddressbook', {
		id: 'ab1',
		displayName: 'Address book',
		enabled: true,
		url: '/remote.php/dav/addressbooks/users/admin/ab1/',
		dav,
	})
})

describe('contacts paging', () => {
	test('the first page stores the continuation token', async () => {
		dav.findPageAndFilterBySimpleProperties.mockResolvedValueOnce({
			vcards: [vcard('a', 'Alice'), vcard('b', 'Bob')],
			continuationToken: 'token-1',
		})

		await store.dispatch('getContactsFromAddressBook', { addressbook: addressbook() })

		expect(dav.findPageAndFilterBySimpleProperties).toHaveBeenCalledWith(MinimalContactProperties, {
			limit: CONTACTS_PAGE_SIZE,
			continuationToken: null,
		})
		expect(dav.findAllAndFilterBySimpleProperties).not.toHaveBeenCalled()
		expect(addressbook().continuationToken).toBe('token-1')
		expect(addressbook().paginated).toBe(true)
		expect(sortedNames()).toEqual(['Alice', 'Bob'])
		expect(store.getters.hasMoreContacts).toBe(true)
	})

	test('loadMoreContacts appends the next page and clears the token on the last page', async () => {
		dav.findPageAndFilterBySimpleProperties
			.mockResolvedValueOnce({ vcards: [vcard('b', 'Bob'), vcard('c', 'Carol')], continuationToken: 'token-1' })
			.mockResolvedValueOnce({ vcards: [vcard('a', 'Alice')], continuationToken: null })

		await store.dispatch('getContactsFromAddressBook', { addressbook: addressbook() })
		const hasMore = await store.dispatch('loadMoreContacts')

		expect(dav.findPageAndFilterBySimpleProperties).toHaveBeenLastCalledWith(MinimalContactProperties, {
			limit: CONTACTS_PAGE_SIZE,
			continuationToken: 'token-1',
		})
		expect(hasMore).toBe(false)
		expect(addressbook().continuationToken).toBeNull()
		expect(store.getters.hasMoreContacts).toBe(false)
		expect(sortedNames()).toEqual(['Alice', 'Bob', 'Carol'])
		expect(Object.keys(addressbook().contacts)).toHaveLength(3)

		// nothing left to load
		await store.dispatch('loadMoreContacts')
		expect(dav.findPageAndFilterBySimpleProperties).toHaveBeenCalledTimes(2)
	})

	test('legacy servers get everything without a limit', async () => {
		client.isAddressBookQueryContinuationSupported.mockReturnValue(false)
		dav.findAllAndFilterBySimpleProperties.mockResolvedValueOnce([vcard('a', 'Alice'), vcard('b', 'Bob')])

		await store.dispatch('getContactsFromAddressBook', { addressbook: addressbook() })

		expect(dav.findAllAndFilterBySimpleProperties).toHaveBeenCalledWith(MinimalContactProperties)
		expect(dav.findPageAndFilterBySimpleProperties).not.toHaveBeenCalled()
		expect(addressbook().continuationToken).toBeNull()
		expect(addressbook().paginated).toBe(false)
		expect(store.getters.hasMoreContacts).toBe(false)
		expect(sortedNames()).toEqual(['Alice', 'Bob'])
	})

	test('contacts returned again are not duplicated', async () => {
		dav.findPageAndFilterBySimpleProperties
			.mockResolvedValueOnce({ vcards: [vcard('a', 'Alice'), vcard('b', 'Bob', ['Friends'])], continuationToken: 'token-1' })
			.mockResolvedValueOnce({ vcards: [vcard('b', 'Bob', ['Friends']), vcard('c', 'Carol', ['Friends'])], continuationToken: null })
			.mockResolvedValueOnce({ vcards: [vcard('a', 'Alice'), vcard('c', 'Carol', ['Friends'])], continuationToken: null })

		await store.dispatch('getContactsFromAddressBook', { addressbook: addressbook() })
		await store.dispatch('loadMoreContacts')
		const keys = await store.dispatch('queryContacts', { filter: [], test: 'anyof' })

		expect(sortedNames()).toEqual(['Alice', 'Bob', 'Carol'])
		expect(Object.keys(addressbook().contacts)).toHaveLength(3)
		const friends = store.getters.getGroups.find((group) => group.name === 'Friends')
		expect(friends.contacts).toHaveLength(2)
		expect(keys).toHaveLength(2)
		expect(keys.map((key) => store.getters.getContact(key).displayName)).toEqual(['Alice', 'Carol'])
	})

	test('only one page of an address book is loaded at a time', async () => {
		dav.findPageAndFilterBySimpleProperties.mockResolvedValueOnce({ vcards: [vcard('a', 'Alice')], continuationToken: 'token-1' })
		await store.dispatch('getContactsFromAddressBook', { addressbook: addressbook() })

		const page = deferred()
		dav.findPageAndFilterBySimpleProperties.mockReturnValueOnce(page.promise)
		const first = store.dispatch('loadMoreContacts')
		const second = store.dispatch('loadMoreContacts')
		page.resolve({ vcards: [vcard('b', 'Bob')], continuationToken: null })
		await Promise.all([first, second])

		expect(dav.findPageAndFilterBySimpleProperties).toHaveBeenCalledTimes(2)
		expect(sortedNames()).toEqual(['Alice', 'Bob'])
	})

	test('loadAllContacts drains the remaining pages', async () => {
		dav.findPageAndFilterBySimpleProperties
			.mockResolvedValueOnce({ vcards: [vcard('a', 'Alice')], continuationToken: 'token-1' })
			.mockResolvedValueOnce({ vcards: [vcard('b', 'Bob')], continuationToken: 'token-2' })
			.mockResolvedValueOnce({ vcards: [vcard('c', 'Carol')], continuationToken: null })

		await store.dispatch('loadAllContacts')

		expect(dav.findPageAndFilterBySimpleProperties).toHaveBeenCalledTimes(3)
		expect(sortedNames()).toEqual(['Alice', 'Bob', 'Carol'])
		expect(store.getters.hasMoreContacts).toBe(false)
	})
})

describe('server side search', () => {
	test('searchContacts sends a contains text-match on every searchable property', async () => {
		dav.findPageAndFilterBySimpleProperties.mockResolvedValueOnce({ vcards: [vcard('a', 'Alice')], continuationToken: 'search-1' })

		const keys = await store.dispatch('searchContacts', { query: ' ali ' })

		const textMatch = {
			name: [CARDDAV, 'text-match'],
			attributes: [
				['collation', 'i;unicode-casemap'],
				['match-type', 'contains'],
			],
			value: 'ali',
		}
		const filter = SearchContactProperties.map((name) => ({
			name: [CARDDAV, 'prop-filter'],
			attributes: [['name', name]],
			children: [textMatch],
		}))
		expect(dav.findPageAndFilterBySimpleProperties).toHaveBeenCalledWith(MinimalContactProperties, {
			limit: CONTACTS_PAGE_SIZE,
			continuationToken: null,
			filter,
			test: 'anyof',
		})
		expect(SearchContactProperties).toEqual(expect.arrayContaining(['FN', 'EMAIL', 'TEL', 'ORG', 'NOTE']))
		expect(SearchContactProperties).not.toContain('KIND')
		expect(keys).toHaveLength(1)
		expect(sortedNames()).toEqual(['Alice'])
		expect(store.getters.hasMoreSearchResults).toBe(true)
		// the regular paging is not affected by the search
		expect(addressbook().continuationToken).toBeNull()

		dav.findPageAndFilterBySimpleProperties.mockResolvedValueOnce({ vcards: [vcard('b', 'Alicia')], continuationToken: null })
		const hasMore = await store.dispatch('loadMoreSearchResults')

		expect(dav.findPageAndFilterBySimpleProperties).toHaveBeenLastCalledWith(MinimalContactProperties, {
			limit: CONTACTS_PAGE_SIZE,
			continuationToken: 'search-1',
			filter,
			test: 'anyof',
		})
		expect(hasMore).toBe(false)
		expect(sortedNames()).toEqual(['Alice', 'Alicia'])
	})

	test('an empty query only resets the search', async () => {
		dav.findPageAndFilterBySimpleProperties.mockResolvedValueOnce({ vcards: [], continuationToken: 'search-1' })
		await store.dispatch('searchContacts', { query: 'ali' })
		expect(store.getters.hasMoreSearchResults).toBe(true)

		const keys = await store.dispatch('searchContacts', { query: '  ' })

		expect(keys).toEqual([])
		expect(dav.findPageAndFilterBySimpleProperties).toHaveBeenCalledTimes(1)
		expect(store.getters.hasMoreSearchResults).toBe(false)
	})

	test('a stale search response is ignored', async () => {
		const stale = deferred()
		dav.findPageAndFilterBySimpleProperties
			.mockReturnValueOnce(stale.promise)
			.mockResolvedValueOnce({ vcards: [vcard('b', 'Bob')], continuationToken: null })

		const staleSearch = store.dispatch('searchContacts', { query: 'ali' })
		const keys = await store.dispatch('searchContacts', { query: 'bob' })
		stale.resolve({ vcards: [vcard('a', 'Alice')], continuationToken: 'stale-token' })
		const staleKeys = await staleSearch

		expect(staleKeys).toEqual([])
		expect(keys).toHaveLength(1)
		expect(sortedNames()).toEqual(['Bob'])
		expect(store.state.addressbooks.search.query).toBe('bob')
		expect(store.getters.hasMoreSearchResults).toBe(false)
	})
})
