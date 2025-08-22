<!--
  - SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="merging">
		<div class="merging__title">
			<h3>{{ t('contacts', 'Confirm merging contacts') }}</h3>
			<div class="merging-title__addressbooks">
				<IconCloseCircleOutline v-if="chosenAddressBook === null" :size="20" class="needs-action" />
				<NcSelect v-bind="addressBookSelect"
					v-model="chosenAddressBook"
					:disabled="contactsList[0].addressbook.id === contactsList[1].addressbook.id"
					:title="t('contacts', 'Select address book')"
					@update:model-value="calculateConflictsToResolve" />
			</div>
		</div>

		<NcNoteCard v-if="conflictsToResolve"
			type="warning"
			:text="t('contacts', 'The selected contacts have conflicting information. Choose which information to keep')" />

		<NcNoteCard v-else
			type="success"
			:text="t('contacts', 'Contacts can be merged')" />

		<div class="merging__conflicts">
			<div v-for="(property, index) in sortedProperties"
				:key="property"
				:class="['merging__conflicts__row', {
					conflict: (conflictInformation[property]?.type === 'conflict' || conflictInformation[property]?.type === 'conflictWithMultipleValues'),
					last: index === sortedProperties.length - 1
				}]">
				<!-- Indicators for whether there is a conflict -->
				<IconCheckCircleOutline v-if="(conflictInformation[property]?.type !== 'conflict' || resolvedConflicts.get(property) !== undefined)
						&& (conflictInformation[property]?.type !== 'conflictWithMultipleValues' || resolvedConflicts.get(property)?.size)"
					:size="20" />
				<IconCloseCircleOutline v-if="conflictInformation[property]?.type === 'conflict' && resolvedConflicts.get(property) === undefined" :size="20" class="needs-action" />
				<IconCloseCircleOutline v-if="conflictInformation[property]?.type === 'conflictWithMultipleValues' && !resolvedConflicts.get(property)?.size" :size="20" class="needs-action" />

				<!-- Checkboxes for resolving single conflicts or conflicts with multiple possible values, for contact 0 -->
				<NcCheckboxRadioSwitch v-if="conflictInformation[property]?.type === 'conflict'"
					:model-value="resolvedConflicts.get(property) === 0"
					type="radio"
					@update:model-value="resolveConflict(0, property)" />
				<NcCheckboxRadioSwitch v-if="conflictInformation[property]?.type === 'conflictWithMultipleValues'"
					:model-value="resolvedConflicts.get(property)?.has(0)"
					@update:model-value="resolveMultiConflict(0, property)" />

				<!-- Information of contact 0, either shown through DetailsProperty if possible or in a custom way -->
				<div v-if="conflictInformation[property]?.type !== 'onlyInSecond'"
					:class="['merging__conflicts__property', {
						'no-conflict': conflictInformation[property]?.type !== 'conflict' &&
							conflictInformation[property]?.type !== 'conflictWithMultipleValues'
					}]">
					<div v-if="!simpleProperties.includes(property)">
						<ContactDetailsProperty v-for="(singleProperty, propertyIndex) in dividedProperties[0][property]"
							:key="singleProperty.jCal"
							:is-first-property="propertyIndex === 0"
							:is-last-property="false"
							:property="singleProperty"
							:contact="contactsList[0]"
							:local-contact="contactsList[0]"
							:contacts="contacts"
							:bus="bus"
							:is-read-only="true" />
					</div>
					<div v-else class="simple-property">
						<div class="simple-property__title">
							<component :is="simplePropertyDescriptions[property]?.icon || 'span'" :size="20" />
							<h3>{{ simplePropertyDescriptions[property]?.description || property }}</h3>
						</div>
						<span v-for="singleProperty in dividedProperties[0][property]" :key="singleProperty.jCal">{{ singleProperty.getFirstValue() }}</span>
					</div>
				</div>
				<div v-if="conflictInformation[property]?.type === 'onlyInSecond'" class="merging-conflicts__filler" />

				<!-- Checkboxes for resolving single conflicts or conflicts with multiple possible values, for contact 1 -->
				<NcCheckboxRadioSwitch v-if="conflictInformation[property]?.type === 'conflict'"
					:model-value="resolvedConflicts.get(property) === 1"
					type="radio"
					@update:model-value="resolveConflict(1, property)" />
				<NcCheckboxRadioSwitch v-if="conflictInformation[property]?.type === 'conflictWithMultipleValues'"
					:model-value="resolvedConflicts.get(property)?.has(1)"
					@update:model-value="resolveMultiConflict(1, property)" />

				<!-- Information of contact 1, either shown through DetailsProperty if possible or in a custom way -->
				<div v-if="conflictInformation[property]?.type !== 'onlyInFirst'"
					:class="['merging__conflicts__property', {
						'no-conflict': conflictInformation[property]?.type !== 'conflict' &&
							conflictInformation[property]?.type !== 'conflictWithMultipleValues'
					}]">
					<div v-if="!simpleProperties.includes(property)">
						<ContactDetailsProperty v-for="(singleProperty, propertyIndex) in dividedProperties[1][property]"
							:key="singleProperty.jCal"
							:is-first-property="propertyIndex === 0"
							:is-last-property="false"
							:property="singleProperty"
							:contact="contactsList[1]"
							:local-contact="contactsList[1]"
							:contacts="contacts"
							:bus="bus"
							:is-read-only="true" />
					</div>
					<div v-else class="simple-property">
						<div class="simple-property__title">
							<component :is="simplePropertyDescriptions[property]?.icon || 'span'" :size="20" />
							<h3>{{ simplePropertyDescriptions[property]?.description || property }}</h3>
						</div>
						<span v-for="singleProperty in dividedProperties[1][property]" :key="singleProperty.jCal">{{ singleProperty.getFirstValue() }}</span>
					</div>
				</div>
			</div>
		</div>

		<div v-if="contactsList[0].groups.length || contactsList[1].groups.length" class="merging__groups">
			<h4 class="merging__groups__header">{{ t('contacts', 'Groups') }}</h4>
			<NcSelect v-model="selectedGroups"
				:options="contactsList[0].groups.concat(contactsList[1].groups)"
				:multiple="true"
				:placeholder="t('contacts', 'Select groups to add the merged contact to')"
				:disabled="!contactsList[0].groups.length && !contactsList[1].groups.length"
				@update:model-value="calculateConflictsToResolve" />
		</div>

		<div class="merging__actions">
			<NcButton :disabled="conflictsToResolve !== 0" variant="secondary" @click="mergeContacts">
				{{ t('contacts', 'Merge contacts') }}
				<template #icon>
					<IconSetMerge v-if="!isLoading" :size="20" />
					<NcLoadingIcon v-else :size="20" />
				</template>
			</NcButton>
		</div>
	</div>
</template>

<script>
import { NcButton, NcNoteCard, NcCheckboxRadioSwitch, NcSelect, NcLoadingIcon } from '@nextcloud/vue'

import IconCheckCircleOutline from 'vue-material-design-icons/CheckCircleOutline.vue'
import IconCloseCircleOutline from 'vue-material-design-icons/CloseCircleOutline.vue'
import IconSetMerge from 'vue-material-design-icons/SetMerge.vue'
import IconDomain from 'vue-material-design-icons/Domain.vue'
import IconAccount from 'vue-material-design-icons/AccountOutline.vue'
import IconBadgeAccount from 'vue-material-design-icons/BadgeAccountOutline.vue'

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
		IconDomain,
		IconAccount,
		IconBadgeAccount,
		NcSelect,
		NcLoadingIcon,
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
			sortedProperties: [],
			simpleProperties: ['fn', 'org', 'title'],
			simplePropertyDescriptions: {
				fn: {
					description: this.t('contacts', 'Name'),
					icon: IconAccount,
				},
				org: {
					description: this.t('contacts', 'Company'),
					icon: IconDomain,
				},
				title: {
					description: this.t('contacts', 'Title'),
					icon: IconBadgeAccount,
				},
			},
			chosenAddressBook: null,
			selectedGroups: [],
			isLoading: false,
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

			return [groupedA, groupedB]
		},

		usedProperties() {
			const allKeys = this.dividedProperties.flatMap(map => Object.keys(map))
			return [...new Set(allKeys)].filter(key => {
				const valA = this.dividedProperties[0][key] ? this.dividedProperties[0][key].map(value => this.getPropertyValue(value)) : []
				const valB = this.dividedProperties[1][key] ? this.dividedProperties[1][key].map(value => this.getPropertyValue(value)) : []
				return (
					(!valA.every(val => val === null || val === undefined || val === ''))
					|| (!valB.every(val => val === null || val === undefined || val === ''))
				)
			})
		},

		conflictInformation() {
			const conflictInformation = {}

			this.usedProperties.forEach(property => {
				if ((this.dividedProperties[0][property] ?? []).every(val => this.checkIfPropertyEmpty(val))) {
					conflictInformation[property] = {
						type: 'onlyInSecond',
						value: this.dividedProperties[1][property].map(val => this.getPropertyValue(val)),
					}

					return
				}

				if ((this.dividedProperties[1][property] ?? []).every(val => this.checkIfPropertyEmpty(val))) {
					conflictInformation[property] = {
						type: 'onlyInFirst',
						value: this.dividedProperties[0][property].map(val => this.getPropertyValue(val)),
					}

					return
				}

				const equalEvery = (a, b) => a.length === b.length && a.every((v, i) => v === b[i])

				if (
					equalEvery(
						(this.dividedProperties[0][property] ?? []).map(val => this.getPropertyValue(val)),
						(this.dividedProperties[1][property] ?? []).map(val => this.getPropertyValue(val))
					)
				) {
					conflictInformation[property] = {
						type: 'equal',
						value: this.dividedProperties[0][property].map(val => this.getPropertyValue(val)),
					}

					return
				}

				if (rfcProps.properties[property]?.multiple === true) {
					conflictInformation[property] = {
						type: 'conflictWithMultipleValues',
						value: null,
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

		addressBookSelect() {
			return {
				placeholder: this.t('contacts', 'Select address book'),
				options: [
					{
						id: 0,
						label: this.contactsList[0].addressbook.displayName,
					},
					{
						id: 1,
						label: this.contactsList[1].addressbook.displayName,
					},
				],
			}
		},
	},

	mounted() {
		this.calculateConflictsToResolve()
		this.sortedProperties = this.sortUsedProperties()

		if (this.contactsList[0].addressbook.id === this.contactsList[1].addressbook.id) {
			this.chosenAddressBook = {
				id: 0,
				label: this.contactsList[0].addressbook.displayName,
			}
		}

		this.selectedGroups = this.selectedGroups.concat(this.contactsList[0].groups)
		this.selectedGroups = this.selectedGroups.concat(this.contactsList[1].groups)
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
		resolveMultiConflict(version, property) {
			if (this.resolvedConflicts.has(property)) {
				const currentVersions = this.resolvedConflicts.get(property)
				if (currentVersions.has(version)) {
					currentVersions.delete(version)
				} else {
					currentVersions.add(version)
				}
				this.resolvedConflicts.set(property, currentVersions)
			} else {
				const resolutions = new Set()
				resolutions.add(version)
				this.resolvedConflicts.set(property, resolutions)
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
					if (!this.canDisplay(property) && property.name !== 'title' && property.name !== 'org' && property.name !== 'fn') {
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

				if (this.conflictInformation[property]?.type === 'conflictWithMultipleValues' && !this.resolvedConflicts.get(property)?.size) {
					conflictsCount++
				}
			})

			if (this.chosenAddressBook === null) {
				conflictsCount++
			}

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
		},

		checkIfPropertyEmpty(property) {
			if (property === undefined) {
				return true
			}

			const value = this.getPropertyValue(property)

			if (value === '' || value === null || (Array.isArray(value) && value.length === 0)) {
				return true
			}

			if (Array.isArray(value)) {
				return value.every(v => v === '' || v === undefined)
			}

			return false
		},

		sortUsedProperties() {
			// the properties where this.conflictInformation[property].type === 'conflict' should have priority
			return this.usedProperties.sort((a, b) => {
				const aType = this.conflictInformation[a]?.type
				const bType = this.conflictInformation[b]?.type

				if (aType === 'conflict' && bType !== 'conflict') {
					return -1
				}
				if (bType === 'conflict' && aType !== 'conflict') {
					return 1
				}
				return 0
			})
		},

		async mergeContacts() {
			this.isLoading = true
			const contactToSave = this.contactsList[0]

			const finalProperties = {}

			this.usedProperties.forEach(property => {
				if (this.conflictInformation[property]?.type === 'conflict') {
					const resolvedVersion = this.resolvedConflicts.get(property)
					if (resolvedVersion !== undefined) {
						 finalProperties[property] = [this.dividedProperties[resolvedVersion][property]]
					}
				} else if (this.conflictInformation[property]?.type === 'conflictWithMultipleValues') {
					const resolvedVersions = this.resolvedConflicts.get(property)
					if (resolvedVersions?.size) {
						finalProperties[property] = Array.from(resolvedVersions).map(version => this.dividedProperties[version][property])
					}
				} else if (this.conflictInformation[property]?.type === 'onlyInSecond') {
					finalProperties[property] = [this.dividedProperties[1][property]]
				} else {
					finalProperties[property] = [this.dividedProperties[0][property]]
				}
			})

			this.usedProperties.forEach(name => {
				if (finalProperties[name] !== undefined && finalProperties[name].length > 0) {
					finalProperties[name].flat().forEach((property, index) => {
						if (index === 0) {
							contactToSave.vCard.updatePropertyWithValue(name, this.getPropertyValue(property))
						} else {
							contactToSave.vCard.addProperty(property)
						}
					})
				}
			})

			contactToSave.groups = this.selectedGroups
			contactToSave.addressbook = this.contactsList[this.chosenAddressBook.id].addressbook

			await this.$store.dispatch('updateContact', contactToSave)

			await this.$store.dispatch('deleteContact', { contact: this.contactsList[1] })

			this.$emit('finished', contactToSave)
		},
	},
}
</script>

<style lang="scss" scoped>
.merging {
	display: flex;
	flex-direction: column;
	margin: calc(var(--default-grid-baseline) * 8);
	overflow-x: clip;

	&__title {
		display: flex;
		width: 100%;
		margin: calc(var(--default-grid-baseline) * 3) 0;
		justify-content: space-between;
		gap: calc(var(--default-grid-baseline) * 2);
		align-items: center;

		h3 {
			margin: 0;
		}

		&__addressbooks {
			display: flex;
			gap: calc(var(--default-grid-baseline) * 2);

			.v-select {
				margin-bottom: unset !important;
			}
		}
	}

	&__groups {
		display: flex;
		gap: calc(var(--default-grid-baseline) * 4);
		margin: calc(var(--default-grid-baseline) * 4) 0;
		margin-inline-start: calc(var(--default-grid-baseline) * 5);

		&__header {
			margin: 0;
		}
	}

	&__conflicts {
		display: flex;
		flex-direction: column;
		gap: calc(var(--default-grid-baseline) * 2);
		margin: auto;

		&__row {
			display: flex;
			gap: calc(var(--default-grid-baseline) * 5);
			align-items: start;
			border-bottom: var(--border-width-input) solid var(--color-background-darker);
			padding-bottom: calc(var(--default-grid-baseline) * 3);

			.material-design-icon {
				align-self: start;
				margin-top: calc(var(--default-grid-baseline) * 4 + 2px);
			}

			.no-conflict {
				margin-inline-start: 55px;
			}

			:deep(.property__label) {
				all: unset;
			}
		}

		&__property {
			display: flex;
			gap: calc(var(--default-grid-baseline) * 2);
			min-width: 300px;
			max-width: 300px;
			min-height: 85px;
			align-items: center;
		}

		&__filler {
			min-width: 352px;
		}
	}

	.last {
		border-bottom: none;
	}

	.property__label {
		width: unset;
	}

	.checkbox-radio-switch {
		margin-top: calc(var(--default-grid-baseline) * 2);
	}

	&-actions {
		display: flex;
		justify-content: flex-end;
		margin-top: calc(var(--default-grid-baseline) * 4);
	}
}

.needs-action {
	color: var(--color-warning-text);
}

.simple-property {
	display: flex;
	flex-direction: column;

	&__title {
		display: flex;
		align-items: center;
		gap: 15px;
		margin-bottom: calc(var(--default-grid-baseline) * 2);

		h3 {
			font-size: 22px;
			margin: 0;
		}

		.material-design-icon {
			align-self: center;
			margin-top: 0;
		}
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
