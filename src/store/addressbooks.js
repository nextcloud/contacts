/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { namespaces as NS } from '@nextcloud/cdav-library'
import { showError } from '@nextcloud/dialogs'
import pLimit from 'p-limit'
import { CONTACTS_PAGE_SIZE } from '../models/constants.ts'
import Contact, { MinimalContactProperties } from '../models/contact.js'
import client from '../services/cdav.js'
import logger from '../services/logger.js'
import parseVcf from '../services/parseVcf.js'
import { sortAddressbooks } from '../utils/addressbookUtils.js'

const addressbookModel = {
	id: '',
	displayName: '',
	enabled: true,
	owner: '',
	shares: [],
	contacts: {},
	url: '',
	readOnly: false,
	canCreateCard: false,
	canModifyCard: false,
	canDeleteCard: false,
	writeProps: false,
	dav: false,
	// token of the next contacts page, null when fully loaded or never paged
	continuationToken: null,
	// whether the contacts were loaded page by page
	paginated: false,
}

const state = {
	addressbooks: [],
	addressbooksFetched: false,
	// server side search over the enabled address books
	search: {
		query: '',
		// address book id => token of the next search results page
		continuationTokens: {},
	},
}

// vCard properties matched by the server side search. Must only contain properties
// indexed in oc_cards_properties (CardDavBackend::INDEXED_PROPERTIES); otherwise the
// server cannot push the anyof filter down to SQL and parses every card instead.
export const SearchContactProperties = ['FN', 'N', 'EMAIL', 'TEL', 'ORG', 'TITLE', 'CATEGORIES', 'NOTE']

// address book id => promise of the contacts page being loaded
const pageLoads = new Map()

// address book id => promise of the search results page being loaded
let searchPageLoads = new Map()

// incremented on every search, responses of older searches are ignored
let searchGeneration = 0

/**
 * Whether the server can return address book queries page by page
 *
 * @return {boolean}
 */
function isPagingSupported() {
	return client.isAddressBookQueryContinuationSupported()
}

/**
 * Build the CardDAV filter matching contacts with any searchable property containing the query
 *
 * @param {string} query the search query
 * @return {object[]} the children of the CARDDAV:filter element
 */
export function buildSearchFilter(query) {
	return SearchContactProperties.map((name) => ({
		name: [NS.IETF_CARDDAV, 'prop-filter'],
		attributes: [['name', name]],
		children: [{
			name: [NS.IETF_CARDDAV, 'text-match'],
			attributes: [
				['collation', 'i;unicode-casemap'],
				['match-type', 'contains'],
			],
			value: query,
		}],
	}))
}

/**
 * Parse the vCards returned by the server into contacts
 *
 * @param {object[]} vcards the VCard objects from the cdav library
 * @param {object} addressbook the addressbook the vCards belong to
 * @return {Contact[]}
 */
function parseVCards(vcards, addressbook) {
	// We don't want to lose the url information
	// so we need to parse one by one
	let failed = 0
	const contacts = vcards.reduce((contacts, item) => {
		try {
			const contact = new Contact(item.data, addressbook)
			contact.dav = item
			contacts.push(contact)
		} catch (error) {
			// PARSING FAILED
			logger.error('Error reading contact', { url: item.url, data: item.data })
			logger.error(error)
			failed++
		}
		return contacts
	}, [])

	if (failed > 0) {
		showError(n(
			'contacts',
			'{failed} contact failed to be read',
			'{failed} contacts failed to be read',
			failed,
			{ failed },
		))
	}

	return contacts
}

/**
 * Merge loaded contacts into the store.
 * Contacts already in the address book are kept as they are, so a contact returned
 * again by another page, query or search is never duplicated.
 *
 * @param {object} context the store context
 * @param {object} addressbook the addressbook the contacts belong to
 * @param {Contact[]} contacts the loaded contacts
 * @return {string[]} the keys of the loaded contacts
 */
function mergeContacts(context, addressbook, contacts) {
	const storedAddressbook = context.state.addressbooks.find((search) => search.id === addressbook.id)
	if (!storedAddressbook) {
		return []
	}

	const uids = new Set()
	const newContacts = contacts.filter((contact) => {
		if (storedAddressbook.contacts[contact.uid] || uids.has(contact.uid)) {
			return false
		}
		uids.add(contact.uid)
		return true
	})

	if (newContacts.length > 0) {
		context.commit('appendContactsToAddressbook', { addressbook: storedAddressbook, contacts: newContacts })
		context.commit('extractGroupsFromContacts', newContacts)

		// don't add contacts from disabled address book to contacts store
		if (storedAddressbook.enabled) {
			context.commit('appendContacts', newContacts)
			context.commit('sortContacts')
		}
	}

	return [...new Set(contacts.map((contact) => contact.key))]
}

/**
 * Load the next contacts page of an address book, or its first page.
 * Only one page of an address book is loaded at a time, concurrent calls share the running load.
 *
 * @param {object} context the store context
 * @param {object} addressbook the addressbook to load
 * @param {boolean} firstPage load the first page instead of the next one
 * @return {Promise<Contact[]>}
 */
function loadContactsPage(context, addressbook, firstPage) {
	// the continuation token is read from the stored address book
	addressbook = context.state.addressbooks.find((search) => search.id === addressbook.id) ?? addressbook
	const running = pageLoads.get(addressbook.id)
	if (running) {
		return running
	}

	const load = (async () => {
		const page = await addressbook.dav.findPageAndFilterBySimpleProperties(MinimalContactProperties, {
			limit: CONTACTS_PAGE_SIZE,
			continuationToken: firstPage ? null : addressbook.continuationToken,
		})
		const contacts = parseVCards(page.vcards, addressbook)
		mergeContacts(context, addressbook, contacts)
		context.commit('setAddressbookContinuationToken', { addressbook, continuationToken: page.continuationToken })
		return contacts
	})().finally(() => {
		pageLoads.delete(addressbook.id)
	})

	pageLoads.set(addressbook.id, load)
	return load
}

/**
 * Run an addressbook query on one address book and return the matching contacts
 *
 * @param {object} addressbook the addressbook to query
 * @param {object} query destructuring object
 * @param {object[]} query.filter the children of the CARDDAV:filter element
 * @param {string} query.test either anyof or allof
 * @param {boolean} query.all load every page instead of the first one
 * @return {Promise<Contact[]>}
 */
async function queryAddressbook(addressbook, { filter, test, all }) {
	if (!isPagingSupported()) {
		const vcards = await addressbook.dav.addressbookQuery(filter, null, null, test)
		return parseVCards(vcards, addressbook)
	}

	const contacts = []
	let continuationToken = null
	do {
		const page = await addressbook.dav.findPageAndFilterBySimpleProperties(MinimalContactProperties, {
			limit: CONTACTS_PAGE_SIZE,
			continuationToken,
			filter,
			test,
		})
		contacts.push(...parseVCards(page.vcards, addressbook))
		continuationToken = page.continuationToken
	} while (all && continuationToken)
	return contacts
}

/**
 * Load a page of the current search results of an address book.
 * Only one search page of an address book is loaded at a time, results of an outdated search are ignored.
 *
 * @param {object} context the store context
 * @param {object} addressbook the addressbook to search
 * @param {string|null} continuationToken token of the page to load, null for the first page
 * @return {Promise<string[]>} the keys of the found contacts
 */
function loadSearchPage(context, addressbook, continuationToken) {
	const running = searchPageLoads.get(addressbook.id)
	if (running) {
		return running
	}

	const generation = searchGeneration
	const loads = searchPageLoads
	const query = context.state.search.query
	const load = (async () => {
		const page = await addressbook.dav.findPageAndFilterBySimpleProperties(MinimalContactProperties, {
			limit: CONTACTS_PAGE_SIZE,
			continuationToken,
			filter: buildSearchFilter(query),
			test: 'anyof',
		})
		if (generation !== searchGeneration) {
			return []
		}
		const keys = mergeContacts(context, addressbook, parseVCards(page.vcards, addressbook))
		context.commit('setSearchContinuationToken', { addressbook, continuationToken: page.continuationToken })
		return keys
	})().finally(() => {
		loads.delete(addressbook.id)
	})

	loads.set(addressbook.id, load)
	return load
}

/**
 * Wait for all promises and throw the first failure, if any
 *
 * @param {Promise[]} promises the promises to wait for
 * @return {Promise<Array>} the results of the promises
 */
async function settleAll(promises) {
	const results = await Promise.allSettled(promises)
	const failure = results.find((result) => result.status === 'rejected')
	if (failure) {
		throw failure.reason
	}
	return results.map((result) => result.value)
}

/**
 * map a dav collection to our addressbook object model
 *
 * @param {object} addressbook the addressbook object from the cdav library
 * @return {object}
 */
export function mapDavCollectionToAddressbook(addressbook) {
	return {
		// get last part of url
		id: addressbook.url.split('/').slice(-2, -1)[0],
		displayName: addressbook.displayname,
		enabled: addressbook.enabled !== false,
		owner: addressbook.owner,
		readOnly: addressbook.readOnly === true,
		writeProps: addressbook.currentUserPrivilegeSet.includes('{DAV:}write-properties'),
		canCreateCard: addressbook.currentUserPrivilegeSet.includes('{DAV:}bind') || addressbook.currentUserPrivilegeSet.includes('{DAV:}write') || addressbook.currentUserPrivilegeSet.includes('{DAV:}all'),
		canModifyCard: addressbook.currentUserPrivilegeSet.includes('{DAV:}write-content') || addressbook.currentUserPrivilegeSet.includes('{DAV:}write') || addressbook.currentUserPrivilegeSet.includes('{DAV:}all'),
		canDeleteCard: addressbook.currentUserPrivilegeSet.includes('{DAV:}unbind') || addressbook.currentUserPrivilegeSet.includes('{DAV:}write') || addressbook.currentUserPrivilegeSet.includes('{DAV:}all'),
		url: addressbook.url,
		dav: addressbook,
		shares: addressbook.shares
			? addressbook.shares.map((sharee) => ({ ...mapDavShareeToSharee(sharee) }))
			: [],
	}
}

/**
 * map a dav collection to our addressbook object model
 *
 * @param {object} sharee the sharee object from the cdav library shares
 * @return {object}
 */
export function mapDavShareeToSharee(sharee) {
	const id = sharee.href.split('/').slice(-1)[0]
	const name = sharee['common-name']
		? sharee['common-name']
		: id
	return {
		displayName: name,
		id,
		writeable: sharee.access[0].endsWith('read-write'),
		isGroup: sharee.href.startsWith('principal:principals/groups/'),
		uri: sharee.href,
	}
}

const mutations = {

	/**
	 * Add addressbook into state
	 *
	 * @param {object} state the store data
	 * @param {object} addressbook the addressbook to add
	 */
	addAddressbook(state, addressbook) {
		// extend the addressbook to the default model
		const newAddressbook = { ...addressbookModel, ...addressbook }
		// force reinit of the contacts object to prevent
		// data passed as references
		newAddressbook.contacts = {}
		state.addressbooks.push(newAddressbook)
	},

	/**
	 * Delete addressbook
	 *
	 * @param {object} state the store data
	 * @param {object} addressbook the addressbook to delete
	 */
	deleteAddressbook(state, addressbook) {
		state.addressbooks.splice(state.addressbooks.indexOf(addressbook), 1)
	},

	/**
	 * Toggle whether a Addressbook is Enabled
	 *
	 * @param {object} state the store data
	 * @param {object} addressbook the addressbook to toggle
	 */
	toggleAddressbookEnabled(state, addressbook) {
		const storedAddressbook = state.addressbooks.find((search) => search.id === addressbook.id)
		storedAddressbook.enabled = !storedAddressbook.enabled
	},

	/**
	 * Rename a Addressbook
	 *
	 * @param {object} state the store data
	 * @param {object} data destructuring object
	 * @param {object} data.addressbook the addressbook to rename
	 * @param {string} data.newName the new name of the addressbook
	 */
	renameAddressbook(state, { addressbook, newName }) {
		const storedAddressbook = state.addressbooks.find((search) => search.id === addressbook.id)
		storedAddressbook.displayName = newName
	},

	/**
	 * Append a list of contacts to an addressbook
	 * and remove duplicates
	 *
	 * @param {object} state the store data
	 * @param {object} data destructuring object
	 * @param {object} data.addressbook the addressbook to add the contacts to
	 * @param {Contact[]} data.contacts array of contacts to append
	 */
	appendContactsToAddressbook(state, { addressbook, contacts }) {
		addressbook = state.addressbooks.find((search) => search.id === addressbook.id)

		// convert list into an array and remove duplicate
		addressbook.contacts = contacts.reduce((list, contact) => {
			if (list[contact.uid]) {
				logger.info('Duplicate contact overrided', { previous: list[contact.uid], contact })
			}
			list[contact.uid] = contact
			return list
		}, addressbook.contacts)
	},

	/**
	 * Add a contact to an addressbook and overwrite if duplicate uid
	 *
	 * @param {object} state the store data
	 * @param {Contact} contact the contact to add
	 */
	addContactToAddressbook(state, contact) {
		const addressbook = state.addressbooks.find((search) => search.id === contact.addressbook.id)
		addressbook.contacts[contact.uid] = contact
	},

	/**
	 * Delete a contact in a specified addressbook
	 *
	 * @param {object} state the store data
	 * @param {Contact} contact the contact to delete
	 */
	deleteContactFromAddressbook(state, contact) {
		const addressbook = state.addressbooks.find((search) => search.id === contact.addressbook.id)
		delete addressbook.contacts[contact.uid]
	},

	/**
	 * Share addressbook with a user or group
	 *
	 * @param {object} state the store data
	 * @param {object} data destructuring object
	 * @param {object} data.addressbook the addressbook
	 * @param {string} data.user the userId
	 * @param {string} data.displayName the displayName
	 * @param {string} data.uri the sharing principalScheme uri
	 * @param {boolean} data.isGroup is this a group ?
	 */
	shareAddressbook(state, { addressbook, user, displayName, uri, isGroup }) {
		addressbook = state.addressbooks.find((search) => search.id === addressbook.id)
		const newSharee = {
			displayName,
			id: user,
			writeable: false,
			isGroup,
			uri,
		}
		if (!addressbook.shares.some((share) => share.uri === uri)) {
			addressbook.shares.push(newSharee)
		}
	},

	/**
	 * Remove Sharee from addressbook shares list
	 *
	 * @param {object} state the store data
	 * @param {object} data destructuring object
	 * @param {object} data.addressbook the addressbook
	 * @param {string} data.uri the sharee uri
	 */
	removeSharee(state, { addressbook, uri }) {
		addressbook = state.addressbooks.find((search) => search.id === addressbook.id)
		const shareIndex = addressbook.shares.findIndex((sharee) => sharee.uri === uri)
		addressbook.shares.splice(shareIndex, 1)
	},

	/**
	 * Toggle sharee's writable permission
	 *
	 * @param {object} state the store data
	 * @param {object} data destructuring object
	 * @param {object} data.addressbook the addressbook
	 * @param {string} data.uri the sharee uri
	 */
	updateShareeWritable(state, { addressbook, uri }) {
		addressbook = state.addressbooks.find((search) => search.id === addressbook.id)
		const sharee = addressbook.shares.find((sharee) => sharee.uri === uri)
		sharee.writeable = !sharee.writeable
	},

	/**
	 * Needed to track indirect state changes for addressbook sorting
	 *
	 * @param state
	 */
	resortAddressbooks(state) {
		state.addressbooks = sortAddressbooks(state.addressbooks)
	},

	/**
	 * Store the token of the next contacts page of an addressbook
	 *
	 * @param {object} state the store data
	 * @param {object} data destructuring object
	 * @param {object} data.addressbook the addressbook
	 * @param {string|null} data.continuationToken the token, null when the last page was loaded
	 */
	setAddressbookContinuationToken(state, { addressbook, continuationToken }) {
		addressbook = state.addressbooks.find((search) => search.id === addressbook.id)
		if (addressbook) {
			addressbook.continuationToken = continuationToken
			addressbook.paginated = true
		}
	},

	/**
	 * Start a new server side search
	 *
	 * @param {object} state the store data
	 * @param {string} query the search query
	 */
	resetContactSearch(state, query) {
		state.search.query = query
		state.search.continuationTokens = {}
	},

	/**
	 * Store the token of the next search results page of an addressbook
	 *
	 * @param {object} state the store data
	 * @param {object} data destructuring object
	 * @param {object} data.addressbook the addressbook
	 * @param {string|null} data.continuationToken the token, null when the last page was loaded
	 */
	setSearchContinuationToken(state, { addressbook, continuationToken }) {
		state.search.continuationTokens[addressbook.id] = continuationToken
	},
}

const getters = {
	getAddressbooks: (state) => state.addressbooks,
	hasMoreContacts: (state) => state.addressbooks
		.some((addressbook) => addressbook.enabled && !!addressbook.continuationToken),
	hasMoreSearchResults: (state) => state.addressbooks
		.some((addressbook) => addressbook.enabled && !!state.search.continuationTokens[addressbook.id]),
}

const actions = {

	/**
	 * Retrieve and commit addressbooks
	 *
	 * @param {object} context the store mutations
	 * @return {object[]} the addressbooks
	 */
	async getAddressbooks(context) {
		if (context.state.addressbooksFetched) {
			return context.getters.getAddressbooks
		}

		const addressbooks = await client.addressBookHomes[0]
			.findAllAddressBooks()
			.then((addressbooks) => {
				return addressbooks.map((addressbook) => {
					// formatting addressbooks
					return mapDavCollectionToAddressbook(addressbook)
				})
			})

		addressbooks.forEach((addressbook) => {
			context.commit('addAddressbook', addressbook)
		})

		context.commit('resortAddressbooks')

		context.state.addressbooksFetched = true

		return addressbooks
	},

	/**
	 * Append a new address book to array of existing address books
	 *
	 * @param {object} context the store mutations
	 * @param {object} addressbook The address book to append
	 * @return {Promise}
	 */
	async appendAddressbook(context, addressbook) {
		return client.addressBookHomes[0]
			.createAddressBookCollection(addressbook.displayName)
			.then((response) => {
				addressbook = mapDavCollectionToAddressbook(response)
				context.commit('addAddressbook', addressbook)
			})
			.catch((error) => { throw error })
	},

	/**
	 * Delete Addressbook
	 *
	 * @param {object} context the store mutations Current context
	 * @param {object} addressbook the addressbool to delete
	 * @return {Promise}
	 */
	async deleteAddressbook(context, addressbook) {
		return addressbook.dav
			.delete()
			.then(() => {
				// delete all the contacts from the store that belong to this addressbook
				Object.values(addressbook.contacts)
					.forEach((contact) => context.commit('deleteContact', contact))
				// then delete the addressbook
				context.commit('deleteAddressbook', addressbook)
			})
			.catch((error) => { throw error })
	},

	/**
	 * Toggle whether a Addressbook is Enabled
	 *
	 * @param {object} context the store mutations Current context
	 * @param {object} addressbook the addressbook to toggle
	 * @return {Promise}
	 */
	async toggleAddressbookEnabled(context, addressbook) {
		addressbook.dav.enabled = !addressbook.enabled
		return addressbook.dav
			.update()
			.then(async (response) => {
				context.commit('toggleAddressbookEnabled', addressbook)
				if (addressbook.enabled) {
					const contacts = Object.values(addressbook.contacts)

					// If the address book is disabled on first load, the store does not fetch/store the AB's contacts.
					// The fetched contacts are added to the contacts store, as the address book is enabled now
					if (contacts.length === 0) {
						await context.dispatch('getContactsFromAddressBook', { addressbook })
						return
					}

					// Add contacts from the just enabled address book to the contacts store
					Object.values(addressbook.contacts).forEach((contact) => {
						context.commit('addContact', contact)
					})
				} else {
					// Remove contacts from the just disabled address book from the contacts store
					Object.values(addressbook.contacts).forEach((contact) => {
						context.commit('deleteContact', contact)
					})
				}
			})
			.catch((error) => { throw error })
	},

	/**
	 * Rename a Addressbook
	 *
	 * @param {object} context the store mutations Current context
	 * @param {object} data.addressbook the addressbook to rename
	 * @param {string} data.newName the new name of the addressbook
	 * @param data.addressbook.addressbook
	 * @param data.addressbook.newName
	 * @param root0
	 * @param root0.addressbook
	 * @param root0.newName
	 * @return {Promise}
	 */
	async renameAddressbook(context, { addressbook, newName }) {
		addressbook.dav.displayname = newName
		return addressbook.dav
			.update()
			.then((response) => context.commit('renameAddressbook', { addressbook, newName }))
			.catch((error) => { throw error })
	},

	/**
	 * Retrieve the contacts of the specified addressbook
	 * and commit the results.
	 * Only the first page is loaded when the server supports paging, everything otherwise.
	 *
	 * @param {object} context the store mutations
	 * @param {object} data destructuring object
	 * @param {object} data.addressbook the addressbook to load
	 * @return {Promise<Contact[]|undefined>}
	 */
	async getContactsFromAddressBook(context, { addressbook }) {
		try {
			if (isPagingSupported()) {
				return await loadContactsPage(context, addressbook, true)
			}

			const vcards = await addressbook.dav.findAllAndFilterBySimpleProperties(MinimalContactProperties)
			const contacts = parseVCards(vcards, addressbook)
			mergeContacts(context, addressbook, contacts)
			return contacts
		} catch (error) {
			// unrecoverable error, if no contacts were loaded,
			// remove the addressbook
			// TODO: create a failed addressbook state and show that there was an issue?
			context.commit('deleteAddressbook', addressbook)
			logger.error(error)
		}
	},

	/**
	 * Load the next contacts page of every enabled addressbook with remaining contacts
	 *
	 * @param {object} context the store mutations
	 * @return {Promise<boolean>} whether contacts remain to be loaded
	 */
	async loadMoreContacts(context) {
		const addressbooks = context.state.addressbooks
			.filter((addressbook) => addressbook.enabled && addressbook.continuationToken)
		await settleAll(addressbooks.map((addressbook) => loadContactsPage(context, addressbook, false)))
		return context.getters.hasMoreContacts
	},

	/**
	 * Load all remaining contacts pages of an addressbook, or of every enabled addressbook
	 *
	 * @param {object} context the store mutations
	 * @param {object} [data] destructuring object
	 * @param {object} [data.addressbook] the addressbook to load, every enabled addressbook if omitted
	 * @return {Promise}
	 */
	async loadAllContacts(context, { addressbook } = {}) {
		const addressbooks = addressbook
			? context.state.addressbooks.filter((search) => search.id === addressbook.id)
			: context.state.addressbooks.filter((search) => search.enabled)

		await settleAll(addressbooks.map(async (addressbook) => {
			if (!isPagingSupported()) {
				// everything is loaded at once, unless the address book was never loaded
				if (Object.keys(addressbook.contacts).length === 0) {
					await context.dispatch('getContactsFromAddressBook', { addressbook })
				}
				return
			}

			if (!addressbook.paginated) {
				await loadContactsPage(context, addressbook, true)
			}
			while (addressbook.continuationToken) {
				await loadContactsPage(context, addressbook, false)
			}
		}))
	},

	/**
	 * Run an addressbook query and merge the matching contacts into the store
	 *
	 * @param {object} context the store mutations
	 * @param {object} data destructuring object
	 * @param {object} [data.addressbook] the addressbook to query, every enabled addressbook if omitted
	 * @param {object[]} data.filter the children of the CARDDAV:filter element
	 * @param {string} [data.test] either anyof or allof
	 * @param {boolean} [data.all] load every page of the results instead of the first one
	 * @return {Promise<string[]>} the keys of the matching contacts
	 */
	async queryContacts(context, { addressbook, filter, test = 'anyof', all = true }) {
		const addressbooks = addressbook
			? context.state.addressbooks.filter((search) => search.id === addressbook.id)
			: context.state.addressbooks.filter((search) => search.enabled)

		const keys = await settleAll(addressbooks.map(async (addressbook) => {
			const contacts = await queryAddressbook(addressbook, { filter, test, all })
			return mergeContacts(context, addressbook, contacts)
		}))
		return keys.flat()
	},

	/**
	 * Search the enabled addressbooks on the server and merge the first page of results into the store.
	 * An empty query only resets the search.
	 *
	 * @param {object} context the store mutations
	 * @param {object} data destructuring object
	 * @param {string} data.query the search query
	 * @return {Promise<string[]>} the keys of the found contacts, empty when the search was replaced meanwhile
	 */
	async searchContacts(context, { query }) {
		query = query.trim()
		searchGeneration++
		searchPageLoads = new Map()
		context.commit('resetContactSearch', query)

		if (query === '' || !isPagingSupported()) {
			return []
		}

		const generation = searchGeneration
		const keys = await settleAll(context.state.addressbooks
			.filter((addressbook) => addressbook.enabled)
			.map((addressbook) => loadSearchPage(context, addressbook, null)))
		return generation === searchGeneration ? keys.flat() : []
	},

	/**
	 * Load the next page of the current search results of every enabled addressbook with remaining results
	 *
	 * @param {object} context the store mutations
	 * @return {Promise<boolean>} whether search results remain to be loaded
	 */
	async loadMoreSearchResults(context) {
		const { continuationTokens } = context.state.search
		await settleAll(context.state.addressbooks
			.filter((addressbook) => addressbook.enabled && continuationTokens[addressbook.id])
			.map((addressbook) => loadSearchPage(context, addressbook, continuationTokens[addressbook.id])))
		return context.getters.hasMoreSearchResults
	},

	/**
	 *
	 * @param {object} context the store mutations
	 * @param {object} importDetails = { vcf, addressbook }
	 * @param importDetails.vcf
	 * @param importDetails.addressbook
	 */
	async importContactsIntoAddressbook(context, { vcf, addressbook }) {
		const contacts = parseVcf(vcf, addressbook)
		context.commit('changeStage', 'importing')

		// max simultaneous requests
		const limit = pLimit(3)
		const requests = []

		// create the array of requests to send
		contacts.map(async (contact) => {
			logger.info('Importing contact', { contact })

			// Get vcard string
			try {
				const vData = contact.toStringStripQuotes()
				// push contact to server and use limit
				requests.push(limit(() => contact.addressbook.dav.createVCard(vData)
					.then((response) => {
						// setting the contact dav property
						contact.dav = response

						// success, update store
						context.commit('addContact', contact)
						context.commit('addContactToAddressbook', contact)
						context.commit('extractGroupsFromContacts', [contact])
						context.commit('incrementAccepted')
					})
					.catch((error) => {
						// error
						context.commit('incrementDenied')
						logger.error(error)
					})))
			} catch (e) {
				context.commit('incrementDenied')
			}
		})

		Promise.all(requests).then(() => {
			context.commit('changeStage', 'done')
		})
	},

	/**
	 * Remove sharee from Addressbook
	 *
	 * @param {object} context the store mutations Current context
	 * @param {object} data destructuring object
	 * @param {object} data.addressbook the addressbook
	 * @param {string} data.uri the sharee uri
	 */
	async removeSharee(context, { addressbook, uri }) {
		try {
			await addressbook.dav.unshare(uri)
			context.commit('removeSharee', { addressbook, uri })
		} catch (error) {
			logger.error(error)
			throw error
		}
	},

	/**
	 * Toggle permissions of Addressbook Sharees writeable rights
	 *
	 * @param {object} context the store mutations Current context
	 * @param {object} data destructuring object
	 * @param {object} data.addressbook the addressbook
	 * @param {string} data.uri the sharee uri
	 * @param {boolean} data.writeable the sharee permission
	 */
	async toggleShareeWritable(context, { addressbook, uri, writeable }) {
		try {
			await addressbook.dav.share(uri, writeable)
			context.commit('updateShareeWritable', { addressbook, uri, writeable })
		} catch (error) {
			logger.error(error)
			throw error
		}
	},

	/**
	 * Share Adressbook with User or Group
	 *
	 * @param {object} context the store mutations Current context
	 * @param {object} data.addressbook the addressbook
	 * @param {string} data.user the userId
	 * @param {string} data.displayName the displayName
	 * @param {string} data.uri the sharing principalScheme uri
	 * @param {boolean} data.isGroup is this a group ?
	 * @param data.addressbook.addressbook
	 * @param data.addressbook.user
	 * @param data.addressbook.displayName
	 * @param data.addressbook.uri
	 * @param data.addressbook.isGroup
	 * @param root0
	 * @param root0.addressbook
	 * @param root0.user
	 * @param root0.displayName
	 * @param root0.uri
	 * @param root0.isGroup
	 */
	async shareAddressbook(context, { addressbook, user, displayName, uri, isGroup }) {
		// Share addressbook with entered group or user
		try {
			await addressbook.dav.share(uri)
			context.commit('shareAddressbook', { addressbook, user, displayName, uri, isGroup })
		} catch (error) {
			logger.error(error)
			throw error
		}
	},

	/**
	 * Move a contact to the provided addressbook
	 *
	 * @param {object} context the store mutations
	 * @param {object} data destructuring object
	 * @param {Contact} data.contact the contact to move
	 * @param {object} data.addressbook the addressbook to move the contact to
	 * @return {Contact} the new contact object
	 */
	async moveContactToAddressbook(context, { contact, addressbook }) {
		// only local move if the contact doesn't exists on the server
		if (contact.dav) {
			try {
				await contact.dav.move(addressbook.dav)
			} catch (error) {
				logger.error(error)
				throw error
			}
		}
		const groups = contact.groups
		await context.commit('deleteContactFromAddressbook', contact)
		await context.commit('removeContactFromGroups', contact)
		await context.commit('updateContactAddressbook', { contact, addressbook })
		await context.commit('addContactToAddressbook', contact)
		await context.commit('addContactToGroups', { contact, groupNames: groups })
		return contact
	},

	/**
	 * Copy a contact to the provided addressbook
	 *
	 * @param {object} context the store mutations
	 * @param {object} data destructuring object
	 * @param {Contact} data.contact the contact to copy
	 * @param {object} data.addressbook the addressbook to move the contact to
	 * @return {Contact} the new contact object
	 */
	async copyContactToAddressbook(context, { contact, addressbook }) {
		// init new contact & strip old uid
		const vData = contact.vCard.toString().replace(/^UID.+/im, '')
		const newContact = new Contact(vData, addressbook)

		try {
			const response = await contact.dav.copy(addressbook.dav)
			// setting the contact dav property
			newContact.dav = response
		} catch (error) {
			logger.error(error)
			throw error
		}
		// success, update store
		await context.commit('addContact', newContact)
		await context.commit('addContactToAddressbook', newContact)
		return newContact
	},
}

export default { state, mutations, getters, actions }
