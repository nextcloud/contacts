/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { showError } from '@nextcloud/dialogs'
import ICAL from 'ical.js'
import { toRaw } from 'vue'
import Contact from '../models/contact.js'
import logger from '../services/logger.js'
import validate from '../services/validate.js'

/*
 * Currently ical.js does not serialize parameters with multiple values correctly. This is
 * especially problematic for the type parmeter which frequently is used with multiple values
 * (e.g. "HOME" and "VOICE"). A phone number for example shoud be serialized as
 * 'TEL;TYPE=HOME,VOICE:0815 123456' OR 'TEL;TYPE="HOME","VOICE":0815 123456' according to
 * https://tools.ietf.org/html/rfc2426#section-4. Unfortunately currently it is serialized as
 * 'TEL;TYPE="HOME,VOICE":0815 123456', which makes the value appear as a single value
 * containing a comma instead of two separate values. By forcing all values being escaped by
 * double quotes the string serialization can be fixed.
 *
 * However there is a pull request (https://github.com/mozilla-comm/ical.js/pull/460) waiting
 * to be merged for ical.js. Until this fix is merged and released the following configuration
 * changes apply the workaround described above.
 */
ICAL.design.vcard3.param.type.multiValueSeparateDQuote = true
ICAL.design.vcard.param.type.multiValueSeparateDQuote = true

function sortData(a, b) {
	// contacts without a value always come last
	if ((a.value === '') !== (b.value === '')) {
		return a.value === '' ? 1 : -1
	}

	// a malformed rev is indexed as a string, so never compare a timestamp with text:
	// that would be non-transitive. Timestamps come first, text keeps its own ordering
	const aIsTime = typeof a.value === 'number'
	const bIsTime = typeof b.value === 'number'
	if (aIsTime !== bIsTime) {
		return aIsTime ? -1 : 1
	}

	const score = aIsTime
		? b.value - a.value // timestamps (rev), most recent first
		: a.value.toUpperCase().localeCompare(b.value.toUpperCase()) // ignore upper and lowercase

	// if equal, fallback to the key
	return score !== 0
		? score
		: a.key.localeCompare(b.key)
}

/**
 * Favorites first, then by the current order key.
 *
 * @param {object} a a sorted contacts index entry
 * @param {object} b a sorted contacts index entry
 * @return {number}
 */
function sortByFavoriteAndData(a, b) {
	if (a.favorite !== b.favorite) {
		return a.favorite ? -1 : 1
	}
	return sortData(a, b)
}

/**
 * Insert an entry at its sorted position in the sorted contacts index
 *
 * @param {object} state the store data
 * @param {object} entry a sorted contacts index entry
 */
function insertSortedEntry(state, entry) {
	const index = state.sortedContacts.findIndex((other) => sortByFavoriteAndData(other, entry) >= 0)
	if (index === -1) {
		state.sortedContacts.push(entry)
	} else {
		state.sortedContacts.splice(index, 0, entry)
	}
}

/**
 * Build an entry of the sorted contacts index
 *
 * @param {Contact} contact the contact to index
 * @param {string} orderKey the contact property to sort on
 * @return {object}
 */
function sortedEntry(contact, orderKey) {
	let value
	try {
		value = contact[orderKey]
	} catch (error) {
		// a malformed property (an invalid REV for instance) throws when ical.js decodes it
		logger.warn('Could not read the sort value of a contact', { key: contact.key, orderKey, error })
		value = ''
	}

	return {
		key: contact.key,
		// vCardTime values (rev) are indexed as timestamps, anything else as a string:
		// structured name components can be arrays (multiple given names in vCard 4.0).
		// ical.js reads its own internals, which fails through the reactive proxy, so unwrap first
		value: value?.toUnixTime ? toRaw(value).toUnixTime() : String(value ?? ''),
		favorite: contact.favorite || false,
	}
}

const state = {
	// Using objects for performance
	// https://codepen.io/skjnldsv/pen/ZmKvQo
	contacts: {},
	sortedContacts: [],
	orderKey: 'displayName',
}

const mutations = {
	/**
	 * Store raw contacts into state
	 * Used by the first contact fetch
	 *
	 * @param {object} state Default state
	 * @param {Array<Contact>} contacts Contacts
	 */
	appendContacts(state, contacts = []) {
		state.contacts = contacts.reduce(function(list, contact) {
			if (contact instanceof Contact) {
				list[contact.key] = contact
			} else {
				logger.error('Invalid contact object', { contact })
			}
			return list
		}, state.contacts)
	},

	/**
	 * Store favorite state into store
	 *
	 * @param {object} state Default state
	 * @param {Contact} contact Contact
	 */
	updateContactFavorite(state, contact) {
		if (!state.contacts[contact.key] || !(contact instanceof Contact)) {
			logger.error('Invalid contact update', { contact })
			return
		}

		if (state.contacts[contact.key].dav) {
			state.contacts[contact.key].dav.favorite = contact.dav.favorite
		}

		const sortedContact = state.sortedContacts.find((c) => c.key === contact.key)
		if (sortedContact) {
			sortedContact.favorite = contact.favorite || false
			state.sortedContacts.sort(sortByFavoriteAndData)
		}
	},
	/**
	 * Delete a contact from the global contacts list
	 *
	 * @param {object} state the store data
	 * @param {Contact} contact the contact to delete
	 */
	deleteContact(state, contact) {
		if (state.contacts[contact.key] && contact instanceof Contact) {
			const index = state.sortedContacts.findIndex((search) => search.key === contact.key)
			if (index !== -1) {
				state.sortedContacts.splice(index, 1)
			}
			delete state.contacts[contact.key]
		} else {
			logger.error('Error while deleting the following contact', { contact })
		}
	},

	/**
	 * Insert new contact into sorted array
	 *
	 * @param {object} state the store data
	 * @param {Contact} contact the contact to add
	 */
	addContact(state, contact) {
		// Checking contact validity 🔍🙈
		if (contact instanceof Contact) {
			validate(contact)

			insertSortedEntry(state, sortedEntry(contact, state.orderKey))

			state.contacts[contact.key] = contact
		} else {
			logger.error('Error while adding the following contact', { contact })
		}
	},

	/**
	 * Update a contact
	 *
	 * @param {object} state the store data
	 * @param {Contact} contact the contact to update
	 */
	updateContact(state, contact) {
		if (state.contacts[contact.key] && contact instanceof Contact) {
			const existingFavorite = state.contacts[contact.key].dav?.favorite || false
			state.contacts[contact.key].updateContact(contact.jCal)

			// restore favorite on dav if it was lost during the update
			if (state.contacts[contact.key].dav && state.contacts[contact.key].dav.favorite === undefined) {
				state.contacts[contact.key].dav.favorite = existingFavorite
			}

			const sortedContact = state.sortedContacts.find((search) => search.key === contact.key)

			if (!sortedContact) {
				logger.warn('sortedContact not found for', { key: contact.key })
				return
			}

			const updatedEntry = sortedEntry(state.contacts[contact.key], state.orderKey)

			if (sortedContact.value !== updatedEntry.value || sortedContact.favorite !== updatedEntry.favorite) {
				sortedContact.value = updatedEntry.value
				sortedContact.favorite = updatedEntry.favorite

				state.sortedContacts.sort(sortByFavoriteAndData)
			}
		} else {
			logger.error('Error while replacing the following contact', { contact })
		}
	},

	/**
	 * Update a contact addressbook
	 *
	 * @param {object} state the store data
	 * @param {object} data destructuring object
	 * @param data.contact
	 * @param {Contact} contact the contact to update
	 * @param {object} addressbook the addressbook to set
	 * @param data.addressbook
	 */
	updateContactAddressbook(state, { contact, addressbook }) {
		if (state.contacts[contact.key] && contact instanceof Contact) {
			// replace contact object data by creating a new contact
			const oldKey = contact.key

			// hijack reference
			const newContact = contact

			// delete old key, cut reference
			delete state.contacts[oldKey]

			// replace addressbook
			newContact.addressbook = addressbook

			// set new key, re-assign reference
			state.contacts[newContact.key] = newContact

			// the new key can order differently against equal sort values, so reinsert
			const index = state.sortedContacts.findIndex((search) => search.key === oldKey)
			if (index !== -1) {
				state.sortedContacts.splice(index, 1)
				insertSortedEntry(state, sortedEntry(newContact, state.orderKey))
			}
		} else {
			logger.error('Error while replacing the addressbook of following contact', { contact })
		}
	},

	/**
	 * Update a contact etag
	 *
	 * @param {object} state the store data
	 * @param {object} data destructuring object
	 * @param data.contact
	 * @param {Contact} contact the contact to update
	 * @param {string} etag the contact etag
	 * @param data.etag
	 */
	updateContactEtag(state, { contact, etag }) {
		if (state.contacts[contact.key] && contact instanceof Contact) {
			// replace contact object data
			state.contacts[contact.key].dav.etag = etag
		} else {
			logger.error('Error while replacing the etag of following contact', { contact })
		}
	},

	/**
	 * Order the contacts list. Filters have terrible performances.
	 * We do not want to run the sorting function every time.
	 * Let's only run it on additions and create an index
	 *
	 * @param {object} state the store data
	 */
	sortContacts(state) {
		state.sortedContacts = Object.values(state.contacts)
			.filter((contact) => contact.kind !== 'group')
			.map((contact) => sortedEntry(contact, state.orderKey))
			.sort(sortByFavoriteAndData)
	},

	/**
	 * Set the order key
	 *
	 * @param {object} state the store data
	 * @param {string} [orderKey] the order key to sort by
	 */
	setOrder(state, orderKey = 'displayName') {
		state.orderKey = orderKey
	},

	/**
	 * Set a contact as `in conflict` with the server data
	 *
	 * @param {object} state the store data
	 * @param {object} data destructuring object
	 * @param {Contact} data.contact the contact to update
	 * @param {string} data.etag the etag to set
	 */
	setContactAsConflict(state, { contact, etag }) {
		if (state.contacts[contact.key] && contact instanceof Contact) {
			state.contacts[contact.key].conflict = etag
		} else {
			logger.error('Error while handling the following contact', { contact })
		}
	},

	/**
	 * Set a contact dav property
	 *
	 * @param {object} state the store data
	 * @param {object} data destructuring object
	 * @param {Contact} data.contact the contact to update
	 * @param {object} data.dav the dav object returned by the cdav library
	 */
	setContactDav(state, { contact, dav }) {
		if (state.contacts[contact.key] && contact instanceof Contact) {
			contact = state.contacts[contact.key]
			contact.dav = dav
		} else {
			logger.error('Error while handling the following contact', { contact })
		}
	},
}

const getters = {
	getContacts: (state) => state.contacts,
	getSortedContacts: (state) => state.sortedContacts,
	getContact: (state) => (key) => state.contacts[key],
	getOrderKey: (state) => state.orderKey,
}

const actions = {

	/**
	 * Toggle the favorite state of a contact.
	 * Updates the store
	 *
	 * @param {object} context the store mutations
	 * @param {object} contact the contact key to toggle
	 */
	async toggleFavorite(context, contact) {
		if (!contact.dav) {
			throw new Error(`Missing DAV object for contact ${contact.key}`)
		}

		const oldValue = contact.dav.favorite || false
		const newValue = !oldValue

		try {
			contact.dav.favorite = newValue
			await contact.dav.updateProperties()
			context.commit('updateContactFavorite', contact)
		} catch (error) {
			contact.dav.favorite = oldValue
			context.commit('updateContactFavorite', contact)
			showError(t('contacts', 'Could not update favorite state'))
			logger.error('Could not toggle favorite state', { error })
		}
	},

	/**
	 * Delete a contact from the list and from the associated addressbook
	 *
	 * @param {object} context the store mutations
	 * @param {object} data destructuring object
	 * @param {Contact} data.contact the contact to delete
	 * @param {boolean} [data.dav] trigger a dav deletion
	 */
	async deleteContact(context, { contact, dav = true }) {
		// only local delete if the contact doesn't exists on the server
		if (contact.dav && dav) {
			await contact.dav.delete()
				.catch((error) => {
					logger.error(error)
					showError(t('contacts', 'Unable to delete contact'))
				})
		}
		context.commit('deleteContact', contact)
		context.commit('deleteContactFromAddressbook', contact)
		context.commit('removeContactFromGroups', contact)
	},

	/**
	 * Add a contact to the list, the associated addressbook and to the groups
	 *
	 * @param {object} context the store mutations
	 * @param {Contact} contact the contact to delete
	 */
	async addContact(context, contact) {
		await context.commit('addContact', contact)
		await context.commit('addContactToAddressbook', contact)
		await context.commit('extractGroupsFromContacts', [contact])
	},

	/**
	 * Replace a contact by this new object
	 *
	 * @param {object} context the store mutations
	 * @param {Contact} contact the contact to update
	 * @return {Promise}
	 */
	async updateContact(context, contact) {
		// Checking contact validity 🙈
		validate(contact)

		// Update REV
		if (contact.version === '4.0') {
			contact.rev = ICAL.Time.fromJSDate(new Date(), true)
		}
		if (contact.version === '3.0') {
			contact.rev = ICAL.VCardTime.fromDateAndOrTimeString(new Date().toISOString(), 'date-time')
		}

		const vData = contact.toStringStripQuotes()

		// if no dav key, contact does not exists on server
		if (!contact.dav) {
			// create contact
			const dav = await contact.addressbook.dav.createVCard(vData)
			context.commit('setContactDav', { contact, dav })
			return
		}

		// if contact already exists
		if (!contact.conflict) {
			contact.dav.data = vData
			try {
				await contact.dav.update()
				// all clear, let's update the store
				context.commit('updateContact', contact)
			} catch (error) {
				logger.error(error)

				// wrong etag, we most likely have a conflict
				if (error && error?.status === 412) {
					// saving the new etag so that the user can manually
					// trigger a fetchCompleteData without any further errors
					context.commit('setContactAsConflict', { contact, etag: error.xhr.getResponseHeader('etag') })
					logger.error('This contact is outdated, the server refused it', { contact })
				}
				throw (error)
			}
		} else {
			logger.error('This contact is outdated, refusing to push', { contact })
		}
	},

	/**
	 * Fetch the full vCard from the dav server
	 *
	 * @param {object} context the store mutations
	 * @param {object} data destructuring object
	 * @param {Contact} data.contact the contact to fetch
	 * @param {string} data.etag the contact etag to override in case of conflict
	 * @param data.forceReFetch
	 * @return {Promise}
	 */
	async fetchFullContact(context, { contact, etag = '', forceReFetch = false }) {
		if (etag.trim() !== '') {
			await context.commit('updateContactEtag', { contact, etag })
		}

		const storeContact = context.getters.getContact(contact.key)
		const davObject = storeContact?.dav || contact.dav

		const savedFavorite = davObject.favorite

		return davObject.fetchCompleteData(forceReFetch)
			.then(() => {
				const newContact = new Contact(davObject.data, contact.addressbook)
				newContact.dav = davObject
				newContact.dav.favorite = savedFavorite
				context.commit('updateContact', newContact)
			})
			.catch((error) => { throw error })
	},
}

export default { state, mutations, getters, actions }
