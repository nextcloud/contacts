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
	<div v-if="propModel && showProperty" class="property">
		<PropertyTitle icon="icon-contacts-dark"
			:readable-name="t('contacts', 'Contact groups')"
			:is-read-only="isReadOnly" />

		<div class="property__row">
			<div class="property__label">
				<span>{{ propModel.readableName }}</span>
			</div>

			<!-- multiselect taggable groups with a limit to 3 groups shown -->
			<div class="property__value">
				<NcSelect v-if="!showAsText"
					v-model="localValue"
					:options="groups"
					:no-wrap="true"
					:placeholder="t('contacts', 'Add contact in group')"
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
				</NcSelect>
				<p v-else>
					{{ localValue.length === 0 ? t('contacts','none'): localValue.toString() }}
				</p>
			</div>

			<!-- empty actions to keep the layout -->
			<div class="property__actions" />
		</div>
	</div>
</template>

<script>
import debounce from 'debounce'
import { NcSelect } from '@nextcloud/vue'
import Contact from '../../models/contact.js'
import PropertyTitle from './PropertyTitle.vue'
import naturalCompare from 'string-natural-compare'

export default {
	name: 'PropertyGroups',

	components: {
		PropertyTitle,
		NcSelect,
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
		groupValue: {
			type: String,
			default: null,
		},
	},

	data() {
		return {
			localValue: this.value,
		}
	},

	computed: {
		showAsText() {
			return this.isReadOnly && this.localValue.length <= 1
		},
		showProperty() {
			return (this.isReadOnly && this.localValue.length > 0) || !this.isReadOnly
		},
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

	mounted() {
		this.handleStarred = (groupName, starredValue) => {
			if (starredValue === true) {
				this.addValidateGroup(groupName)
			} else {
				this.removeValidateGroup(groupName)
			}
		}
		this.$root.$on('starred-update', this.handleStarred)
		this.$root.$emit('is-starred', { starred: this.searchContactToGroup(), contact: this.contact })
	},
	beforeDestroy() {
		this.$root.$off('starred-update', this.handleStarred)
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
			if (groupName === 'starred') {
				this.$root.$emit('is-starred', { starred: true, contact: this.contact })
				this.$root.$emit('starred-list-update', { starred: true, contact: this.contact })
			}
		},
		/**
		 * Dispatch contact removal from group
		 *
		 * @param {string} groupName the group name
		 */
		 searchContactToGroup() {
			const group = this.$store.getters.getGroups.find(search => search.name === 'starred')
			if (group && Array.isArray(group.contacts) && group.contacts.includes(this.contact.key) === true) {
				return true
			}
			return false
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
				this.updateValue()
			}
			if (groupName === 'starred') {
				this.$root.$emit('is-starred', { starred: false, contact: this.contact })
				this.$root.$emit('starred-list-update', { starred: false, contact: this.contact })
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
		/**
		 * Dispatch contact addition to group
		 *
		 * @param {string} groupName the group name
		 */
		async addStarredContactToGroup(groupName) {
			await this.$store.dispatch('addContactToGroup', {
				contact: this.contact,
				groupName,
			})
			this.updateValue()
		},
		/**
		 * Add Validate groupname and dispatch creation
		 *
		 * @param {string} groupName the group name
		 * @return {boolean}
		 */
		 addValidateGroup(groupName) {
			if (this.localValue.some(element => element.includes('starred')) === false) {
				this.localValue.push(groupName)
			}
			const group = this.$store.getters.getGroups.find(search => search.name === groupName)
			if (group && Array.isArray(group.contacts) && group.contacts.includes(this.contact.key) === false) {
				this.addStarredContactToGroup(groupName)
			}
			if (typeof group === 'undefined') {
				this.addStarredContactToGroup(groupName)
			}
			this.$root.$emit('starred-list-update', { starred: true, contact: this.contact })
			this.$root.$emit('starred-response', true)
			return true
		},

		/**
		 * Add Validate groupname and dispatch creation
		 *
		 * @param {string} groupName the group name
		 *  @return {boolean}
		 */
		removeValidateGroup(groupName) {
			const group = this.$store.getters.getGroups.find(search => search.name === groupName)
			if (group && Array.isArray(group.contacts) && group.contacts.includes(this.contact.key) === true) {
				 this.$store.dispatch('removeContactToGroup', {
					contact: this.contact,
					groupName,
				})
			}
			if (this.localValue.some(element => element.includes('starred')) === true) {
				const index = this.localValue.indexOf(groupName)
				if (index !== -1) {
					this.localValue.splice(index, 1)
				}
			}
			this.updateValue()
			this.$root.$emit('starred-list-update', { starred: false, contact: this.contact })
			this.$root.$emit('starred-response', false)
			return true
		},
	},
}
</script>
<style lang="scss" scoped>
.property__label:not(.multiselect) {
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
	opacity: 0.7;
}
.property__row {
	position: relative;
	display: flex;
	align-items: center;
}
.property__label, .property__label.multiselect {
	flex: 1 0;
	width: 60px;
	min-width: 60px !important;
	max-width: 120px;
	user-select: none;
	text-align: right;
	background-size: 16px;
}
</style>
