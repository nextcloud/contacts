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

			<!-- multiselect taggable groups -->
			<div class="property__value">
				<NcSelect v-if="!showAsText"
					v-model="localValue"
					:options="groups"
					:no-wrap="true"
					:placeholder="t('contacts', 'Add contact in group')"
					:multiple="true"
					:close-on-select="false"
					:disabled="isReadOnly"
					:clearable="true"
					:deselect-from-dropdown="true"
					:taggable="true"
					tag-placeholder="create"
					@close="updateValue">
					<!-- show how many groups are hidden and add tooltip -->
					<span slot="limit" v-tooltip.auto="formatGroupsTitle" class="multiselect__limit">
						+{{ localValue.length - 3 }}
					</span>
					<span slot="noResult">
						{{ t('contacts', 'No results') }}
					</span>
				</NcSelect>
				<p v-else>
					{{ localValue.length === 0 ? t('contacts','None'): localValue.toString() }}
				</p>
			</div>

			<!-- empty actions to keep the layout -->
			<div class="property__actions" />
		</div>
	</div>
</template>

<script>
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

	methods: {

		/**
		 * Send update event to parent
		 */
		updateValue() {
			this.$emit('update:value', this.localValue)

		},
	},
}
</script>
