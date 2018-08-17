<!--
  - @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
  -
  - @author John Molakvoæ <skjnldsv@protonmail.com>
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
	<div v-if="propModel" class="grid-span-1 property">

		<div class="property__row">
			<div class="property__label">{{ propModel.readableName }}</div>
			<multiselect v-model="localValue" :options="groups" :placeholder="t('contacts', 'Add contact in group')"
				:limit="3" :multiple="true" :taggable="true"
				:close-on-select="false" tag-placeholder="create" class="multiselect-vue property__value"
				@tag="createGroup" @select="addContactToGroup" @remove="removeContactToGroup">
				<span v-tooltip.auto="formatGroupsTitle" slot="limit" class="multiselect__limit">+{{ localValue.length - 2 }}</span>
				<span slot="noResult">{{ t('settings', 'No results') }}</span>
			</multiselect>
		</div>
	</div>
</template>

<script>
import Multiselect from 'vue-multiselect'
import debounce from 'debounce'
import Contact from '../../models/contact'

export default {
	name: 'PropertyGroups',

	components: {
		Multiselect
	},

	props: {
		propModel: {
			type: Object,
			default: () => {}
		},
		value: {
			type: Array,
			default: () => []
		},
		contact: {
			type: Contact,
			default: null
		}
	},

	data() {
		return {
			localValue: this.value
		}
	},

	computed: {
		groups() {
			return this.$store.getters.getGroups.slice(0).map(group => group.name)
		},

		/**
		 * Format array of groups objects to a string for the popup
		 * Based on the ultiselect limit
		 */
		formatGroupsTitle() {
			return this.localValue.slice(3).join(', ')
		}
	},

	methods: {

		/**
		 * Debounce and send update event to parent
		 */
		updateProp: debounce(function(e) {
			// https://vuejs.org/v2/guide/components-custom-events.html#sync-Modifier
			this.$emit('update:value', this.localValue)
		}, 500),

		addContactToGroup(group) {
			console.log(group)
			this.$store.dispatch('addContactToGroup', {
				contact: this.contact,
				group
			})
		},

		removeContactToGroup(group) {
			console.log(group)
			this.$store.dispatch('removeContactToGroup', {
				contact: this.contact,
				group
			})
		},

		createGroup(group) {
			console.log(group)
		}
	}
}

</script>
