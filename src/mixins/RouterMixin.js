/**
 * SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
export default {
	computed: {
		// router variables
		selectedContact() {
			return this.$route.params.selectedContact
		},
		selectedGroup() {
			return this.$route.params.selectedGroup
		},
		selectedCircle() {
			return this.$route.params.selectedCircle
		},
		selectedUserGroup() {
			return this.$route.params.selectedUserGroup
		},
		selectedChart() {
			return this.$route.params.selectedChart
		},
		selectedAddressbook() {
			return this.$route.params.selectedAddressbook
		},
	},

	methods: {
		/**
		 * Location of the current contacts list, address book or group
		 *
		 * @return {object} a vue-router location
		 */
		listRoute() {
			return this.selectedAddressbook
				? { name: 'addressbook', params: { selectedAddressbook: this.selectedAddressbook } }
				: { name: 'group', params: { selectedGroup: this.selectedGroup } }
		},

		/**
		 * Location of a contact within the current list, address book or group
		 *
		 * @param {string} selectedContact the key of the contact
		 * @return {object} a vue-router location
		 */
		contactRoute(selectedContact) {
			return this.selectedAddressbook
				? { name: 'addressbook-contact', params: { selectedAddressbook: this.selectedAddressbook, selectedContact } }
				: { name: 'contact', params: { selectedGroup: this.selectedGroup, selectedContact } }
		},
	},
}
