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
			:options="usersOrGroups"
			:searchable="true"
			:loading="isLoading"
			:internal-search="false"
			:options-limit="250"
			:limit="3"
			:max-height="600"
			:show-no-results="false"
			:placeholder="placeholder"
			track-by="match"
			label="match"
			open-direction="bottom"
			class="multiselect-vue"
			@search-change="asyncFind"
			@input="addSharee">
			<template slot="singleLabel" slot-scope="props"><span class="option__desc"><span class="option__title">{{ props.option.matchpattern }}</span></span></template>
			<template slot="option" slot-scope="props">
				<div class="option__desc">
					<span class="">{{ props.option.matchstart }}</span><span class="" style="font-weight: bold;">{{ props.option.matchpattern }}</span><span class="">{{ props.option.matchend }} {{ props.option.matchtag }}</span>
				</div>
			</template>
			<span slot="noResult">{{ noResult }} </span>
		</multiselect>
		<!-- list of user or groups addressbook is shared with -->
		<ul v-if="addressbook.shares.length > 0" class="addressbook__shares__list">
			<addressbook-sharee v-for="sharee in addressbook.shares" :key="sharee.displayname + sharee.group" :sharee="sharee" />
		</ul>
	</div>
</template>

<script>
import Multiselect from 'vue-multiselect'
import addressbookSharee from './SettingsAddressbookSharee'

import clickOutside from 'vue-click-outside'

import api from '../../services/api'

export default {
	name: 'SettingsShareAddressbook',
	components: {
		clickOutside,
		Multiselect,
		addressbookSharee
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
			usersOrGroups: []
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
		addSharee(chosenUserOrGroup) {
			let payload = []
			payload.push(this.addressbook)
			payload.push(chosenUserOrGroup.match)
			payload.push(chosenUserOrGroup.matchgroup)
			this.$store.dispatch('shareAddressbook', payload)
		},

		formatMatchResults(matches, query, group) {
			// format response from axios.all and add them to the option array
			if (matches.length < 1) {
				return
			}
			let regex = new RegExp(query, 'i')
			for (let i = 0; i < matches.length; i++) {
				for (let j = 0; j < this.addressbook.shares.length; j++) {
					if (this.addressbook.shares[j].displayname === matches[i] && this.addressbook.shares[j].group === group) {
						return
					}
				}
				let matchResult = matches[i].split(regex)
				let newMatch = {
					match: matches[i],
					matchstart: matchResult[0],
					matchpattern: matches[i].match(regex)[0],
					matchend: matchResult[1],
					matchtag: group ? '(group)' : '(user)',
					matchgroup: group
				}
				this.usersOrGroups.push(newMatch)
			}
		},

		asyncFind(query) {
			this.isLoading = true
			this.usersOrGroups = []
			if (query.length > 0) {
				api.all([
					api.get(OC.linkToOCS('cloud', 2) + 'users?search=' + query),
					api.get(OC.linkToOCS('cloud', 2) + 'groups?search=' + query)
				]).then(response => {
					let matchingUsers = response[0].data.ocs.data.users
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
				})
			}
		}
	}
}
</script>
