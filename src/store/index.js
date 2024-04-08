/**
 * @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
 *
 * @author John Molakvoæ <skjnldsv@protonmail.com>
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */

import Vue from 'vue'
import Vuex, { Store } from 'vuex'

import addressbooks from './addressbooks.js'
import circles from './circles.js'
import contacts from './contacts.js'
import groups from './groups.js'
import importState from './importState.js'

import isCirclesEnabled from '../services/isCirclesEnabled.js'

Vue.use(Vuex)

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
