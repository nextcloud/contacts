<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="addressbook-shares">
		<NcSelectUsers id="users-groups-search"
			:options="usersOrGroups"
			:searchable="true"
			:internal-search="false"
			:max-height="600"
			:show-no-results="true"
			:placeholder="placeholder"
			:class="{ 'showContent': inputGiven, 'icon-loading': isLoading }"
			:get-option-key="(option) => option.user"
			open-direction="bottom"
			label="displayName"
			@search="findSharee"
			@update:model-value="shareAddressbook" />
		<!-- list of user or groups addressbook is shared with -->
		<ul v-if="addressbook.shares.length > 0" class="addressbook-shares__list">
			<addressBookSharee v-for="sharee in addressbook.shares"
				:key="sharee.uri"
				:sharee="sharee"
				:addressbook="addressbook" />
		</ul>
	</div>
</template>

<script>
import { NcSelectUsers } from '@nextcloud/vue'
import client from '../../../services/cdav.js'
import isGroupSharingEnabled from '../../../services/isGroupSharingEnabled.js'

import addressBookSharee from './SettingsAddressbookSharee.vue'
import debounce from 'debounce'
import { urldecode } from '../../../utils/url.js'

export default {
	name: 'SettingsAddressbookShare',

	components: {
		NcSelectUsers,
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
			if (isGroupSharingEnabled) {
				return t('contacts', 'Share with users or groups')
			} else {
				return t('contacts', 'Share with users')
			}
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
				this.usersOrGroups = results
					.filter((result) => {
						const allowedCalendarUserTypes = ['INDIVIDUAL']
						if (isGroupSharingEnabled) {
							allowedCalendarUserTypes.push('GROUP')
						}
						return allowedCalendarUserTypes.includes(result.calendarUserType)
							&& !this.addressbook.shares.some((share) => share.uri === result.principalScheme)
					})
					.map((result) => {
						const isGroup = result.calendarUserType === 'GROUP'
						return {
							user: urldecode(result[isGroup ? 'groupId' : 'userId']),
							displayName: result.displayname,
							icon: isGroup ? 'icon-group' : 'icon-user',
							uri: urldecode(result.principalScheme),
							isGroup,
						}
					})
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
	margin-inline-start: calc(var(--default-grid-baseline) * -2);
	width: 282px;
}
</style>
