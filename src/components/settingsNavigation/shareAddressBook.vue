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
		<div class="dropdown-menu">
			<label class="typo__label" for="ajax">Async multiselect</label>
			<multiselect
				id="ajax"
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
				:limit-text="limitText"
				:max-height="600"
				:show-no-results="false"
				:hide-selected="true"
				label="name"
				track-by="code"
				placeholder="Type to search"
				open-direction="bottom"
				@search-change="asyncFind">
				<template slot="clear" slot-scope="props">
					<div v-if="selectedUserOrGroup.length" class="multiselect__clear" @mousedown.prevent.stop="clearAll(props.search)" />
				</template>
				<span slot="noResult">Oops! No elements found. Consider changing the search query.</span>
			</multiselect>
			<pre class="language-json"><code>{{ selectedUserOrGroup }}</code></pre>
		</div>
		<!-- list of user or groups addressbook is shared with -->
		<ul v-if="addressbook.shares.length > 0" class="addressbook__shares__list">
			<sharee v-for="sharee in addressbook.shares" :key="sharee.name" :sharee="sharee" />
		</ul>
	</div>
</template>

<script>
import clickOutside from 'vue-click-outside'
import Multiselect from 'vue-multiselect'
import Sharee from './sharee'

export default {
	components: {
		clickOutside,
		Multiselect,
		Sharee
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
			selectedUserOrGroup: []
		}
	},
	methods: {
		limitText(count) {
			return `and ${count} other users or groups`
		},

		/* example :OC.linkToOCS('cloud', 2)+ 'groups?search=Test' */
		asyncFind(query) {
			this.isLoading = true
			this.usersOrGroups = []
			// let response = OC.linkToOCS('cloud', 2) + 'groups?search=' + query
			fetch(OC.linkToOCS('cloud', 2) + 'groups?search=' + query).then(response => {
				this.usersOrGroups.push(response)
				this.isLoading = false
			})
			console.log(this.usersOrGroups) // eslint-disable-line
			/* ajaxFindCountry(query).then(response => {
				this.countries = response
				this.isLoading = false
			}) */
		},
		clearAll() {
			this.selectedUserOrGroup = []
		}
	}
}
</script>
