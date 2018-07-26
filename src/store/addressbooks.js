/*
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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */
// import uuid from 'uuid'
/* eslint-disable-next-line import/no-webpack-loader-syntax */
import vcfFile from '!raw-loader!./FakeName.vcf'
import parseVcf from '../services/parseVcf'

const state = {
	addressbooks: []
}
const mutations = {
	/**
	 * Store addressbooks into state
	 * @param {Object} state Default state
	 * @param {Array} addressbooks Addressbooks
	 */
	appendAddressbooks(state, addressbooks) {
		state.addressbooks = addressbooks
	},
	appendContactsToAddressbook(state, { addressbook, contacts }) {
		addressbook = state.addressbooks.filter(adb => adb === addressbook)
		addressbook[0].contacts = contacts
	}
}
const getters = {
	getAddressbooks(state) {
		return state.addressbooks
	}
}
const actions = {
	/**
	 * Retrieve and commit addressbooks
	 * @param {Object} context Current context
	 */
	getAddressbooks(context) {
		// Fake data before using real dav requests
		let addressbooks = [
			{
				id: 'ab1',
				displayName: 'Addressbook 1',
				enabled: true,
				owner: 'admin',
				shares: [
					{ name: 'Bob', edit: true },
					{ name: 'Rita', edit: true },
					{ name: 'Sue', edit: false }
				],
				contacts: []
			},
			{
				id: 'ab2',
				displayName: 'Addressbook 2',
				enabled: false,
				owner: 'admin',
				shares: [],
				contacts: []
			},
			{
				id: 'ab3',
				displayName: 'Addressbook 3',
				enabled: true,
				owner: 'User1',
				shares: [],
				contacts: []
			}
		]
		// fake request
		return new Promise((resolve, reject) => {
			return setTimeout(() => {
				context.commit('appendAddressbooks', addressbooks)
				resolve()
				return addressbooks
			}, 1000)
		})
	},
	getContactsFromAddressBook(context, addressbook) {
		let contacts = parseVcf(vcfFile)
		context.commit('appendContactsToAddressbook', { addressbook, contacts })
		context.commit('appendContacts', contacts)
	}
}

export default { state, mutations, getters, actions }
