<!--
  - SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="merging">
		<div class="merging-title">
			<h3>{{ t('contacts', 'Confirm merging contacts') }}</h3>
		</div>

		<NcNoteCard v-if="conflictsToResolve"
			type="warning"
			:text="t('contacts', 'The selected contacts have conflicting information. Choose which information to keep')" />

		<NcNoteCard v-else
			type="success"
			:text="t('contacts', 'Contacts can be merged')" />

		<div class="merging-conflicts">
			<div v-for="(property, index) in sortedProperties"
				:key="property"
				:class="['merging-conflicts__row', { conflict: conflictInformation[property]?.type === 'conflict', last: index === sortedProperties.length - 1 }]">
				<IconCheckCircleOutline v-if="conflictInformation[property]?.type !== 'conflict' || resolvedConflicts.get(property) !== undefined" :size="20" />
				<IconCloseCircleOutline v-if="conflictInformation[property]?.type === 'conflict' && resolvedConflicts.get(property) === undefined" :size="20" class="needs-action" />

				<NcCheckboxRadioSwitch v-if="conflictInformation[property]?.type === 'conflict'"
					:checked="resolvedConflicts.get(property) === 0"
					@update:checked="resolveConflict(0, property)" />
				<div v-if="dividedProperties[0][property]"
					:class="['merging-conflicts__property', { 'no-conflict': conflictInformation[property]?.type !== 'conflict' }]">
					<ContactDetailsProperty v-if="!simpleProperties.includes(property)"
						:is-first-property="true"
						:is-last-property="false"
						:property="dividedProperties[0][property]"
						:contact="contactsList[0]"
						:local-contact="contactsList[0]"
						:contacts="contacts"
						:bus="bus"
						:is-read-only="true" />
					<div v-else class="simple-property">
						<div class="simple-property__title">
							<component :is="simplePropertyDescriptions[property]?.icon || 'span'" :size="20" />
							<h3>{{ simplePropertyDescriptions[property]?.description || property }}</h3>
						</div>
						{{ dividedProperties[0][property].getFirstValue() }}
					</div>
				</div>
				<div v-if="!dividedProperties[0][property]" class="merging-conflicts__filler" />

				<NcCheckboxRadioSwitch v-if="conflictInformation[property]?.type === 'conflict'"
					:checked="resolvedConflicts.get(property) === 1"
					@update:checked="resolveConflict(1, property)" />
				<div v-if="dividedProperties[1][property]"
					:class="['merging-conflicts__property', { 'no-conflict': conflictInformation[property]?.type !== 'conflict' }]">
					<ContactDetailsProperty v-if="!simpleProperties.includes(property)"
						:is-first-property="true"
						:is-last-property="false"
						:property="dividedProperties[1][property]"
						:contact="contactsList[1]"
						:local-contact="contactsList[1]"
						:contacts="contacts"
						:bus="bus"
						:is-read-only="true" />
					<div v-else class="simple-property">
						<div class="simple-property__title">
							<component :is="simplePropertyDescriptions[property]?.icon || 'span'" :size="20" />
							<h3>{{ simplePropertyDescriptions[property]?.description || property }}</h3>
						</div>
						{{ dividedProperties[1][property].getFirstValue() }}
					</div>
				</div>
			</div>
		</div>

		<div class="merging-actions">
			<NcButton :disabled="conflictsToResolve !== 0" variant="secondary">
				{{ t('contacts', 'Merge contacts') }}
				<template #icon>
					<IconSetMerge :size="16" />
				</template>
			</NcButton>
		</div>
	</div>
</template>

<script>
import { NcAppContentList as AppContentList, NcButton, NcDialog, NcNoteCard, NcCheckboxRadioSwitch } from '@nextcloud/vue'

import IconCheckCircleOutline from 'vue-material-design-icons/CheckCircleOutline.vue'
import IconCloseCircleOutline from 'vue-material-design-icons/CloseCircleOutline.vue'
import IconSetMerge from 'vue-material-design-icons/SetMerge.vue'
import IconDomain from 'vue-material-design-icons/Domain.vue'
import IconAccount from 'vue-material-design-icons/Account.vue'
import IconBadgeAccount from 'vue-material-design-icons/BadgeAccount.vue'

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
		this.sortedProperties = this.sortUsedProperties()
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
			border-bottom: var(--border-width-input) solid var(--color-background-darker);
			padding-bottom: calc(var(--default-grid-baseline) * 3);

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
