<!--
  - @copyright Copyright (c) 2018 Team Popcorn <teampopcornberlin@gmail.com>
  -
  - @author Team Popcorn <teampopcornberlin@gmail.com>
  -
  - @license GNU AGPL version 3 or any later version
  -
  - This program is free software: you can redistribute it and/or modify
  - it under the terms of the GNU Affero General Public License as
  - published by the Free Software Foundation, either version 3 of the
  - License, or (at your option) any later version.
  -
  - This program is distributed in the hope that it will be useful,
  - but WITHOUT ANY WARRANTY; without even the implied warranty of
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  - GNU Affero General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with this program. If not, see <http://www.gnu.org/licenses/>.
  -
-->

<template>
	<div class="addressbook-shares">
		<Multiselect id="users-groups-search"
			:options="usersOrGroups"
			:searchable="true"
			:internal-search="false"
			:max-height="600"
			:show-no-results="true"
			:placeholder="placeholder"
			:class="{ 'showContent': inputGiven, 'icon-loading': isLoading }"
			:user-select="true"
			open-direction="bottom"
			track-by="user"
			label="displayName"
			@search-change="findSharee"
			@input="shareAddressbook" />
		<!-- list of user or groups addressbook is shared with -->
		<ul v-if="addressbook.shares.length > 0" class="addressbook-shares__list">
			<address-book-sharee v-for="sharee in addressbook.shares"
				:key="sharee.uri"
				:sharee="sharee"
				:addressbook="addressbook" />
		</ul>
	</div>
</template>

<script>
import Multiselect from '@nextcloud/vue/dist/Components/NcMultiselect.js'
import client from '../../../services/cdav.js'

import addressBookSharee from './SettingsAddressbookSharee.vue'
import debounce from 'debounce'
import { urldecode } from '../../../utils/url.js'

export default {
	name: 'SettingsAddressbookShare',

	components: {
		Multiselect,
		addressBookSharee,
	},

	props: {
		addressbook: {
			type: Object,
			default() {
				return {}
			},
		},
	},
	data() {
		return {
			isLoading: false,
			inputGiven: false,
			usersOrGroups: [],
		}
	},
	computed: {
		placeholder() {
			return t('contacts', 'Share with users or groups')
		},
		noResult() {
			return t('contacts', 'No users or groups')
		},
	},
	mounted() {
		// This ensures that the multiselect input is in focus as soon as the user clicks share
		document.getElementById('users-groups-search').focus()
	},
	methods: {
		/**
		 * Share addressbook
		 *
		 * @param {object} data destructuring object
		 * @param {string} data.user the userId
		 * @param {string} data.displayName the displayName
		 * @param {string} data.uri the sharing principalScheme uri
		 * @param {boolean} data.isGroup is this a group ?
		 */
		shareAddressbook({ user, displayName, uri, isGroup }) {
			this.$store.dispatch('shareAddressbook', { addressbook: this.addressbook, user, displayName, uri, isGroup })
		},

		/**
		 * Use the cdav client call to find matches to the query from the existing Users & Groups
		 *
		 * @param {string} query
		 */
		findSharee: debounce(async function(query) {
			this.isLoading = true
			this.usersOrGroups = []
			if (query.length > 0) {
				const results = await client.principalPropertySearchByDisplayname(query)
				this.usersOrGroups = results.reduce((list, result) => {
					if (['GROUP', 'INDIVIDUAL'].indexOf(result.calendarUserType) > -1
					&& !this.addressbook.shares.some((share) => share.uri === result.principalScheme)) {
						const isGroup = result.calendarUserType === 'GROUP'
						list.push({
							user: urldecode(result[isGroup ? 'groupId' : 'userId']),
							displayName: result.displayname,
							icon: isGroup ? 'icon-group' : 'icon-user',
							uri: urldecode(result.principalScheme),
							isGroup,
						})
					}
					return list
				}, [])
				this.isLoading = false
				this.inputGiven = true
			} else {
				this.inputGiven = false
				this.isLoading = false
			}
		}, 500),
	},
}
</script>
<style lang="scss" scoped>
.addressbook-shares__list {
	margin-left: -8px;
	width: 282px;
}
</style>
