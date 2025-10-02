/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Store } from 'vuex'
import isCirclesEnabled from '../services/isCirclesEnabled.js'
import addressbooks from './addressbooks.js'
import circles from './circles.js'
import contacts from './contacts.js'
import groups from './groups.js'
import importState from './importState.js'

const mutations = {}

const modules = {
	addressbooks,
	contacts,
	groups,
	importState,
}

// If circles is enabled let's init the store
if (isCirclesEnabled) {
	modules.circles = circles
}

export default new Store({
	modules,
	mutations,

	/**
	 * the contat ical update itself on property getters
	 * this is causing issues with the strict mode.
	 * Since we're only getting the data for the contacts list
	 * and considering we're initiating an independent contact
	 * class for the details which replace itself into the
	 * store by mutations we can ignore this and say that
	 * the risk of losing track of changes is expandable.
	 *
	 * strict: process.env.NODE_ENV !== 'production'
	 */
})
