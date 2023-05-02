<!--
  - @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
  -
  - @author John Molakvoæ <skjnldsv@protonmail.com>
  - @author Richard Steinmetz <richard@steinmetz.cloud>
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
	<div v-if="propModel" class="property">
		<PropertyTitle icon="icon-contacts-dark"
			:readable-name="t('contacts', 'Contact groups')"
			:is-read-only="isReadOnly" />

		<div class="property__row">
			<div class="property__label">
				<span>{{ propModel.readableName }}</span>
			</div>

			<!-- multiselect taggable groups with a limit to 3 groups shown -->
			<div class="property__value">
				<Multiselect v-model="localValue"
					:options="groups"
					:placeholder="placeholder"
					:multiple="true"
					:taggable="true"
					:close-on-select="false"
					:disabled="isReadOnly"
					:tag-width="60"
					tag-placeholder="create"
					@input="updateValue"
					@tag="validateGroup"
					@select="addContactToGroup"
					@remove="removeContactToGroup">
					<!-- show how many groups are hidden and add tooltip -->
					<span slot="limit" v-tooltip.auto="formatGroupsTitle" class="multiselect__limit">
						+{{ localValue.length - 3 }}
					</span>
					<span slot="noResult">
						{{ t('contacts', 'No results') }}
					</span>
				</Multiselect>
			</div>

			<!-- empty actions to keep the layout -->
			<div class="property__actions" />
		</div>
	</div>
</template>

<script>
import debounce from 'debounce'
import { NcMultiselect as Multiselect } from '@nextcloud/vue'
import Contact from '../../models/contact.js'
import PropertyTitle from './PropertyTitle.vue'
import naturalCompare from 'string-natural-compare'

export default {
	name: 'PropertyGroups',

	components: {
		PropertyTitle,
		Multiselect,
	},

	props: {
		propModel: {
			type: Object,
			default: () => {},
			required: true,
		},
		value: {
			type: Array,
			default: () => [],
			required: true,
		},
		contact: {
			type: Contact,
			default: null,
			required: true,
		},
		// Is it read-only?
		isReadOnly: {
			type: Boolean,
			required: true,
		},
	},

	data() {
		return {
			localValue: this.value,
		}
	},

	computed: {
		groups() {
			return this.$store.getters.getGroups.slice(0).map(group => group.name)
				.sort((a, b) => naturalCompare(a, b, { caseInsensitive: true }))
		},

		/**
		 * Format array of groups objects to a string for the popup
		 * Based on the ultiselect limit
		 *
		 * @return {string} the additional groups
		 */
		formatGroupsTitle() {
			return this.localValue.slice(3).join(', ')
		},

		/**
		 * @return {string}
		 */
		placeholder() {
			if (this.isReadOnly) {
				return t('contacts', 'None')
			}

			return t('contacts', 'Add contact in group')
		}
	},

	watch: {
		/**
		 * Since we're updating a local data based on the value prop,
		 * we need to make sure to update the local data on pop change
		 * TODO: check if this create performance drop
		 */
		value() {
			this.localValue = this.value
		},
		selectType() {
			this.localType = this.selectType
		},
	},

	methods: {

		/**
		 * Debounce and send update event to parent
		 */
		updateValue: debounce(function() {
			// https://vuejs.org/v2/guide/components-custom-events.html#sync-Modifier
			this.$emit('update:value', this.localValue)
		}, 500),

		/**
		 * Dispatch contact addition to group
		 *
		 * @param {string} groupName the group name
		 */
		async addContactToGroup(groupName) {
			await this.$store.dispatch('addContactToGroup', {
				contact: this.contact,
				groupName,
			})
			this.updateValue()
		},

		/**
		 * Dispatch contact removal from group
		 *
		 * @param {string} groupName the group name
		 */
		removeContactToGroup(groupName) {
			this.$store.dispatch('removeContactToGroup', {
				contact: this.contact,
				groupName,
			})
			const group = this.$store.getters.getGroups.find(search => search.name === groupName)
			if (group.contacts.length === 0) {
				this.$emit('update:value', [])
			}

		},

		/**
		 * Validate groupname and dispatch creation
		 *
		 * @param {string} groupName the group name
		 * @return {boolean}
		 */
		validateGroup(groupName) {
			this.addContactToGroup(groupName)
			this.localValue.push(groupName)
			return true
		},
	},
}
</script>
