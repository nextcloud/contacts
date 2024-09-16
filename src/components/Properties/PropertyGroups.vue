<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
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
				<NcSelect v-if="!isReadOnly"
					v-model="localValue"
					:options="groups"
					:no-wrap="true"
					:placeholder="t('contacts', 'Add contact in group')"
					:multiple="true"
					:close-on-select="false"
					:clearable="true"
					:deselect-from-dropdown="true"
					:taggable="true"
					tag-placeholder="create"
					@option:deselected="updateValue"
					@close="updateValue">
					<!-- show how many groups are hidden and add tooltip -->
					<template #limit>
						<span v-tooltip.auto="formatGroupsTitle" class="multiselect__limit">
							+{{ localValue.length - 3 }}
						</span>
					</template>
					<template #no-options>
						<span>{{ t('contacts', 'No results') }}</span>
					</template>
				</NcSelect>
				<div v-else>
					<span v-if="localValue.length === 0">{{ t('contacts','None') }}</span>

					<div v-else class="group__list">
						<span v-for="(group, index) in localValue" :key="index">
							{{ group }}{{ index === (localValue.length - 1) ? '' : ',&nbsp;' }}
						</span>
					</div>
				</div>
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
			localValue: this.value.sort(),
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

<style lang="scss" scoped>
.group__list {
	display: flex;
	flex-wrap: wrap;
}
</style>
