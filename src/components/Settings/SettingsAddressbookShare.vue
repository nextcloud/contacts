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
		<multiselect
			id="users-groups-search"
			:options="usersOrGroups"
			:searchable="true"
			:internal-search="false"
			:options-limit="250"
			:limit="3"
			:max-height="600"
			:show-no-results="true"
			:placeholder="placeholder"
			:class="{ 'showContent': inputGiven, 'icon-loading': isLoading }"
			open-direction="bottom"
			@search-change="asyncFind"
			@input="shareAddressbook">
			<template slot="singleLabel" slot-scope="props">
				<span class="option__desc">
					<span class="option__title">{{ props.option.matchpattern }}</span>
				</span>
			</template>
			<template slot="option" slot-scope="props">
				<div class="option__desc">
					<span>{{ props.option.matchstart }}</span><span class="addressbook-shares__shareematch--bold">{{ props.option.matchpattern }}</span><span>{{ props.option.matchend }} {{ props.option.matchtag }}</span>
				</div>
			</template>
			<span slot="noResult">{{ noResult }} </span>
		</multiselect>
		<!-- list of user or groups addressbook is shared with -->
		<ul v-if="addressbook.shares.length > 0" class="addressbook-shares__list">
			<address-book-sharee v-for="sharee in addressbook.shares" :key="sharee.displayname + sharee.group" :sharee="sharee" />
		</ul>
	</div>
</template>

<script>

import api from 'Services/api'

import addressBookSharee from './SettingsAddressbookSharee'
import debounce from 'debounce'

export default {
	name: 'SettingsShareAddressbook',
	components: {
		addressBookSharee
	},
	props: {
		addressbook: {
			type: Object,
			default() {
				return {}
			}
		}
	},
	data() {
		return {
			isLoading: false,
			inputGiven: false,
			usersOrGroups: []
		}
	},
	computed: {
		placeholder() {
			return t('contacts', 'Share with users or groups')
		},
		noResult() {
			return t('contacts', 'No users or groups')
		}
	},
	mounted() {
		// This ensures that the multiselect input is in focus as soon as the user clicks share
		document.getElementById('users-groups-search').focus()
	},
	methods: {
		/**
		 * Share addressbook
		 *
		 * @param {Object} data destructuring object
		 * @param {string} data.sharee the sharee
		 * @param {string} data.id id
		 * @param {Boolean} data.group group
		 */
		shareAddressbook({ sharee, id, group }) {
			let addressbook = this.addressbook
			this.$store.dispatch('shareAddressbook', { addressbook, sharee, id, group })
		},
		/**
		 * Format responses from axios.all and add them to the option array
		 *
		 * @param {Array} matches array of matches returned from the axios request
		 * @param {String} query the search query
		 * @param {Boolean} group Is this a group?
		 */
		formatMatchResults(matches, query, group) {
			if (matches.length < 1) {
				return
			}
			let regex = new RegExp(query, 'i')
			let existingSharees = this.addressbook.shares.map(share => share.id + share.group)
			matches = matches.filter(share => existingSharees.indexOf(share.id + group) === -1)
			// this.usersOrGroups.concat(
			this.usersOrGroups = this.usersOrGroups.concat(matches.map(match => {
				let matchResult = match.displayname.split(regex)
				if (matchResult.length < 1) {
					return
				}
				return {
					sharee: match.displayname,
					id: match.id,
					matchstart: matchResult[0],
					matchpattern: match.displayname.match(regex)[0],
					matchend: matchResult[1],
					matchtag: group ? '(group)' : '(user)',
					group
				}
			}))
		},

		/**
		 * Use Axios api call to find matches to the query from the existing Users & Groups
		 *
		 * @param {String} query
		 */
		asyncFind: debounce(function(query) {
			this.isLoading = true
			this.usersOrGroups = []
			if (query.length > 0) {
				api.all([
					api.get(OC.linkToOCS('cloud', 2) + 'users/details?search=' + query),
					api.get(OC.linkToOCS('cloud', 2) + 'groups/details?search=' + query)
				]).then(response => {
					let matchingUsers = Object.values(response[0].data.ocs.data.users)
					let matchingGroups = response[1].data.ocs.data.groups
					try {
						this.formatMatchResults(matchingUsers, query, false)
					} catch (error) {
						console.debug(error)
					}
					try {
						this.formatMatchResults(matchingGroups, query, true)
					} catch (error) {
						console.debug(error)
					}
				}).then(() => {
					this.isLoading = false
					this.inputGiven = true
				})
			} else {
				this.inputGiven = false
				this.isLoading = false
			}
		}, 500)
	}
}
</script>
