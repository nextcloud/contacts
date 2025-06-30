<!--
  - SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="merging">
		<div class="merging-title">
			<h3>{{ t('contacts', 'Merged contacts summary') }}</h3>
			<NcButton :disabled="conflictsToResolve !== 0" variant="secondary">
				{{ t('contacts', 'Merge contacts') }}
				<template #icon>
					<IconSetMerge :size="16" />
				</template>
			</NcButton>
		</div>

		<NcNoteCard v-if="conflictsToResolve"
			type="warning"
			:text="n('contacts', 'You have {x} conflict to resolve', 'You have {x} conflicts to resolve', conflictsToResolve, { x: conflictsToResolve })" />

		<div class="merging-conflicts">
			<div v-for="(property) in usedProperties"
				:key="property"
				:class="['merging-conflicts__row', { conflict: conflictInformation[property]?.type === 'conflict' }]">
				<IconCheckCircleOutline v-if="conflictInformation[property]?.type !== 'conflict'" :size="20" />
				<IconCloseCircleOutline v-if="conflictInformation[property]?.type === 'conflict'" :size="20" :class="[{ 'needs-action': resolvedConflicts.get(property) === undefined}]" />

				<NcCheckboxRadioSwitch v-if="conflictInformation[property]?.type === 'conflict'"
					:checked="resolvedConflicts.get(property) === 0"
					@update:checked="resolveConflict(0, property)" />
				<div v-if="dividedProperties[0][property]"
					:class="['merging-conflicts__property', { 'no-conflict': conflictInformation[property]?.type !== 'conflict' }]">
					<ContactDetailsProperty :is-first-property="true"
						:is-last-property="false"
						:property="dividedProperties[0][property]"
						:contact="contactsList[0]"
						:local-contact="contactsList[0]"
						:contacts="contacts"
						:bus="bus"
						:is-read-only="true" />
				</div>
				<div v-if="!dividedProperties[0][property]" class="merging-conflicts__filler" />

				<NcCheckboxRadioSwitch v-if="conflictInformation[property]?.type === 'conflict'"
					:checked="resolvedConflicts.get(property) === 1"
					@update:checked="resolveConflict(1, property)" />
				<div v-if="dividedProperties[1][property]"
					:class="['merging-conflicts__property', { 'no-conflict': conflictInformation[property]?.type !== 'conflict' }]">
					<ContactDetailsProperty :is-first-property="true"
						:is-last-property="false"
						:property="dividedProperties[1][property]"
						:contact="contactsList[1]"
						:local-contact="contactsList[1]"
						:contacts="contacts"
						:bus="bus"
						:is-read-only="true" />
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { NcAppContentList as AppContentList, NcButton, NcDialog, NcNoteCard, NcCheckboxRadioSwitch } from '@nextcloud/vue'

import IconCheckCircleOutline from 'vue-material-design-icons/CheckCircleOutline.vue'
import IconCloseCircleOutline from 'vue-material-design-icons/CloseCircleOutline.vue'
import IconSetMerge from 'vue-material-design-icons/SetMerge.vue'

import ContactDetailsProperty from '../ContactDetails/ContactDetailsProperty.vue'
import rfcProps from '../../models/rfcProps.js'
import mitt from 'mitt'

export default {
	name: 'Merging',

	components: {
		ContactDetailsProperty,
		NcCheckboxRadioSwitch,
		IconCheckCircleOutline,
		IconCloseCircleOutline,
		IconSetMerge,
		NcNoteCard,
		NcButton,
	},

	props: {
		contacts: {
			type: Map,
			required: true,
		},
	},

	data() {
		return {
			bus: mitt(),
			resolvedConflicts: new Map(),
			conflictsToResolve: 0,
		}
	},

	computed: {
		contactsList() {
			return Array.from(this.contacts.values()).map(contact => (contact))
		},

		dividedProperties() {
			const [contactA, contactB] = this.contactsList
			if (!contactA || !contactB) return {}

			const sortedA = this.sortProperties(contactA)
			const sortedB = this.sortProperties(contactB)

			const groupedA = this.groupedProperties(sortedA)
			const groupedB = this.groupedProperties(sortedB)

			Object.keys(groupedA).forEach(key => {
				groupedA[key] = groupedA[key][0]
			})

			Object.keys(groupedB).forEach(key => {
				groupedB[key] = groupedB[key][0]
			})

			return [groupedA, groupedB]
		},

		usedProperties() {
			const allKeys = this.dividedProperties.flatMap(map => Object.keys(map))
			return [...new Set(allKeys)]
		},

		conflictInformation() {
			const conflictInformation = {}

			this.usedProperties.forEach(property => {
				if (!this.dividedProperties[0][property]) {
					conflictInformation[property] = {
						type: 'onlyInSecond',
						value: this.dividedProperties[1][property],
					}

					return
				}

				if (!this.dividedProperties[1][property]) {
					conflictInformation[property] = {
						type: 'onlyInFirst',
						value: this.dividedProperties[0][property],
					}

					return
				}

				if (this.getPropertyValue(this.dividedProperties[0][property]) === this.getPropertyValue(this.dividedProperties[1][property])) {
					conflictInformation[property] = {
						type: 'equal',
						value: this.dividedProperties[0][property],
					}

					return
				}

				conflictInformation[property] = {
					type: 'conflict',
					value: null,
				}
			})

			return conflictInformation
		},
	},

	watch: {

	},

	mounted() {
		this.calculateConflictsToResolve()
	},

	methods: {
		resolveConflict(version, property) {
			if (version === this.resolvedConflicts.get(property)) {
				// If the version is already resolved, toggle it back to undefined
				this.resolvedConflicts.set(property, undefined)
			} else {
				// Otherwise, set the version as resolved
				this.resolvedConflicts.set(property, version)
			}
			this.$forceUpdate()
			this.calculateConflictsToResolve()
		},
		/**
		 * Should display the property
		 *
		 * @param {Property} property the property to check
		 * @return {boolean}
		 */
		canDisplay(property) {
			// Make sure we have some model for the property and check for ITEM.PROP custom label format
			const propModel = rfcProps.properties[property.name.split('.').pop()]

			const propType = propModel && propModel.force
				? propModel.force
				: property.getDefaultType()

			return propModel && propType !== 'unknown'
		},

		/**
		 * Contact properties copied and sorted by rfcProps.fieldOrder
		 *
		 * @param contact
		 * @return {Array}
		 */
		sortProperties(contact) {
			return contact.properties
				.slice(0)
				.sort((a, b) => {
					const nameA = a.name.split('.').pop()
					const nameB = b.name.split('.').pop()
					return rfcProps.fieldOrder.indexOf(nameA) - rfcProps.fieldOrder.indexOf(nameB)
				})
		},

		/**
		 * Contact properties filtered and grouped by rfcProps.fieldOrder
		 *
		 * @param sortedProperties
		 * @return {object}
		 */
		groupedProperties(sortedProperties) {
			return sortedProperties
				.reduce((list, property) => {
					// If there is no component to display this prop, ignore it
					if (!this.canDisplay(property)) {
						return list
					}

					// Group bday and deathdate together under 'lifeEvents'
					if (property.name === 'bday' || property.name === 'deathdate' || property.name === 'anniversary') {
						if (!list.lifeEvents) {
							list.lifeEvents = []
						}
						list.lifeEvents.push(property)
						return list
					}

					// Init if needed
					if (!list[property.name]) {
						list[property.name] = []
					}

					list[property.name].push(property)
					return list
				}, {})
		},

		calculateConflictsToResolve() {
			let conflictsCount = 0

			this.usedProperties.forEach(property => {
				if (this.conflictInformation[property]?.type === 'conflict' && this.resolvedConflicts.get(property) === undefined) {
					conflictsCount++
				}
			})

			this.conflictsToResolve = conflictsCount
		},

		getPropertyValue(property) {
			if (property.isMultiValue) {
				// differences between values types :x;x;x;x;x and x,x,x,x,x
				return property.isStructuredValue
					? property.getValues()[0]
					: property.getValues()
			}
			return property.getFirstValue()
		}
	},
}
</script>

<style lang="scss" scoped>
.merging {
	display: flex;
	flex-direction: column;
	margin: calc(var(--default-grid-baseline) * 8);

	&-title {
		display: flex;
		justify-content: space-between;
		width: 100%;
		margin: calc(var(--default-grid-baseline) * 3) 0;

		h3 {
			margin: 0;
		}
	}

	&-conflicts {
		display: flex;
		flex-direction: column;
		gap: calc(var(--default-grid-baseline) * 2);
		margin: auto;

		&__row {
			display: flex;
			gap: calc(var(--default-grid-baseline) * 5);
			align-items: start;

			.material-design-icon {
				align-self: start;
				margin-top: calc(var(--default-grid-baseline) * 4 + 2px);
			}

			.needs-action {
				color: var(--color-warning-text);
			}

			.no-conflict {
				margin-left: 50px;
			}
		}

		&__property {
			display: flex;
			gap: calc(var(--default-grid-baseline) * 2);
			min-width: 300px;
			max-width: 300px;
		}

		&__filler {
			min-width: 350px;
		}
	}

	.property__label {
		width: unset;
	}

	.checkbox-radio-switch {
		margin-top: calc(var(--default-grid-baseline) * 2);
	}
}

// todo remove
.modal-container__content {
	overflow: hidden !important;
}

h2 {
	margin: 0 !important;
}
</style>
