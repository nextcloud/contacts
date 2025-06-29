<!--
  - SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="merging">
		<span>{{ t('contacts', 'Please resolve the following contacts') }}</span>

		{{ contacts }}

		<div class="merging-conflicts">
			<div v-for="(properties, name) in firstElementsInDiff"
				:key="name">
				<ContactDetailsProperty v-for="(property, index) in properties"
					:key="`${index}-${contactsList[0].key}-${property.name}`"
					:is-first-property="index===0"
					:is-last-property="index === properties.length - 1"
					:property="property"
					:contact="contactsList[0]"
					:local-contact="contactsList[0]"
					:contacts="contacts"
					:bus="bus"
					:is-read-only="true" />
			</div>
			<div v-for="(properties, name) in secondElementsInDiff"
				:key="name">
				<ContactDetailsProperty v-for="(property, index) in properties"
					:key="`${index}-${contactsList[0].key}-${property.name}`"
					:is-first-property="index===0"
					:is-last-property="index === properties.length - 1"
					:property="property"
					:contact="contactsList[0]"
					:local-contact="contactsList[0]"
					:contacts="contacts"
					:bus="bus"
					:is-read-only="true" />
			</div>
		</div>
	</div>
</template>

<script>
import { NcAppContentList as AppContentList, NcButton, NcDialog, NcNoteCard } from '@nextcloud/vue'

// eslint-disable-next-line import/no-unresolved
import IconCancelRaw from '@mdi/svg/svg/cancel.svg?raw'
// eslint-disable-next-line import/no-unresolved
import IconDeleteRaw from '@mdi/svg/svg/delete.svg?raw'
import ContactDetailsProperty from '../ContactDetails/ContactDetailsProperty.vue'
import rfcProps from '../../models/rfcProps.js'
import mitt from 'mitt'

export default {
	name: 'Merging',

	components: {
		ContactDetailsProperty,

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
		}
	},

	computed: {
		contactsList() {
			return Array.from(this.contacts.values()).map(contact => (contact))
		},

		/**
		 * Compares the grouped properties of the first two contacts in contactsList
		 * and returns an object containing only the differences.
		 *
		 * @return {object}
		 */
		difference() {
			const [contactA, contactB] = this.contactsList
			if (!contactA || !contactB) return {}

			const sortedA = this.sortProperties(contactA)
			const sortedB = this.sortProperties(contactB)

			const groupedA = this.groupedProperties(sortedA)
			const groupedB = this.groupedProperties(sortedB)

			const diff = {}

			const allKeys = new Set([
				...Object.keys(groupedA),
				...Object.keys(groupedB),
			])

			for (const key of allKeys) {
				const propsA = groupedA[key] || []
				const propsB = groupedB[key] || []

				const setA = new Set(propsA.map(p => JSON.stringify(p)))
				const setB = new Set(propsB.map(p => JSON.stringify(p)))

				const onlyInA = propsA.filter(p => !setB.has(JSON.stringify(p)))
				const onlyInB = propsB.filter(p => !setA.has(JSON.stringify(p)))

				if (onlyInA.length || onlyInB.length) {
					diff[key] = [...onlyInA, ...onlyInB]
				}
			}

			return diff
		},
		firstElementsInDiff() {
			const result = {}
			for (const key in this.difference) {
				if (Array.isArray(this.difference[key]) && this.difference[key].length > 0) {
					result[key] = this.difference[key][0]
				}
			}
			return result
		},
		secondElementsInDiff() {
			const result = {}
			for (const key in this.difference) {
				if (Array.isArray(this.difference[key]) && this.difference[key].length > 1) {
					result[key] = this.difference[key][1]
				}
			}
			return result
		},
	},

	watch: {

	},

	mounted() {

	},

	methods: {
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
	},
}
</script>

<style lang="scss" scoped>
.merging {
	display: flex;
	flex-direction: column;
	margin: calc(var(--default-grid-baseline) * 4);

	&-conflicts {
		display: flex;
		gap: calc(var(--default-grid-baseline) * 2);
	}
}
</style>
