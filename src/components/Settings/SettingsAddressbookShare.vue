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
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  - GNU Affero General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with this program. If not, see <http://www.gnu.org/licenses/>.
  -
-->

<template>
	<div class="addressbook__shares">
		<multiselect
			id="users-groups-search"
			v-model="selectedUserOrGroup"
			:options="usersOrGroups"
			:multiple="true"
			:searchable="true"
			:loading="isLoading"
			:internal-search="false"
			:clear-on-select="false"
			:close-on-select="false"
			:options-limit="250"
			:limit="3"
			:max-height="600"
			:show-no-results="false"
			:hide-selected="true"
			:placeholder="placeholder"
			open-direction="bottom"
			@search-change="asyncFind">
			<template slot="option" slot-scope="props">
				<span class="">{{ props.option.matchstart }}</span><span class="" style="font-weight: bold;">{{ props.option.matchpattern }}</span><span class="">{{ props.option.matchend }} {{ props.option.matchtag }}</span>
			</template>
			<template slot="clear" slot-scope="props">
				<div v-if="selectedUserOrGroup.length" class="multiselect__clear" @mousedown.prevent.stop="clearAll(props.search)" />
			</template>
			<span slot="noResult">{{ noResult }} </span>
		</multiselect>
		<!-- <pre class="language-json"><code>{{ selectedUserOrGroup }}</code></pre> -->
		<!-- list of user or groups addressbook is shared with -->
		<ul v-if="addressbook.shares.length > 0" class="addressbook__shares__list">
			<address-book-sharee v-for="sharee in addressbook.shares" :key="sharee.name" :sharee="sharee" />
		</ul>
	</div>
</template>

<script>
import Multiselect from 'vue-multiselect'
import addressBookSharee from './SettingsAddressbookSharee'

import clickOutside from 'vue-click-outside'
import api from '../../services/api'

export default {
	name: 'SettingsShareAddressBook',
	components: {
		clickOutside,
		Multiselect,
		addressBookSharee
	},
	directives: {
		clickOutside
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
			usersOrGroups: [],
			selectedUserOrGroup: [],
			templateSharee: { displayname: '', writeable: false }
		}
	},
	computed: {
		placeholder() {
			return t('contacts', 'Share with users or groups')
		},
		noResult() {
			return t('contacts', 'Oops! No elements found. Consider changing the search query.')
		}
	},
	methods: {
		addSharee(sharee) {
			let newSharee = {}
			Object.assign({}, this.templateSharee, newSharee)
			// not working yet need to work on!
			this.$store.dispatch('shareAddressbook', newSharee)
		},

		processMatchResults(matches, query, matchTag) {
			for (let i = 0; i < matches.length; i++) {
				let regex = new RegExp(query, 'i')
				let matchResult = matches[i].split(regex)
				let newMatch = {
					matchstart: matchResult[0],
					matchpattern: query,
					matchend: matchResult[1],
					matchtag: matchTag
				}
				this.usersOrGroups.push(newMatch)
			}
		},

		asyncFind(query) {
			this.isLoading = true
			this.usersOrGroups = []
			if (query.length > 0) {
				/*
				* Case issue for query, matchpattern should reflect case in match not the query
				*/

				api.all([api.get(OC.linkToOCS('cloud', 2) + 'users?search=' + query), api.get(OC.linkToOCS('cloud', 2) + 'groups?search=' + query)]).then(response => {
					let matchingUsers = response[0].data.ocs.data.users
					let matchingGroups = response[1].data.ocs.data.groups
					try {
						this.processMatchResults(matchingUsers, query, '(user)')
					} catch (error) {
						console.debug(error)
					}
					try {
						this.processMatchResults(matchingGroups, query, '(group)')
					} catch (error) {
						console.debug(error)
					}
				}).then(() => {
					this.isLoading = false
				})
			}
		},

		clearAll() {
			this.selectedUserOrGroup = []
		}
	}
}
</script>
