<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="property__row">
		<!-- Dummy label to keep the layout -->
		<div class="property__label" />

		<!-- Extra div container to fix the poper position -->
		<div class="property__value">
			<Actions
				menu-align="right"
				event=""
				variant="secondary"
				:menu-name="t('contacts', 'Add more info')"
				@click.prevent>
				<template #icon>
					<IconAdd :size="20" />
				</template>
				<template v-if="!moreActionsOpen">
					<ActionButton
						v-for="option in availablePrimaryProperties"
						:key="option.id"
						class="action--primary"
						:close-after-click="true"
						@click.prevent="addProp(option.id)">
						<template #icon>
							<PropertyTitleIcon :icon="option.icon" />
						</template>
						{{ option.name }}
					</ActionButton>
					<ActionButton
						:close-after-click="false"
						@click="moreActionsOpen = true">
						<template #icon>
							<DotsHorizontalIcon
								:title="t('contacts', 'More fields')"
								:size="20" />
						</template>
						{{ t('contacts', 'More fields') }}
					</ActionButton>
				</template>
				<template v-if="moreActionsOpen">
					<ActionButton
						:close-after-click="false"
						@click="moreActionsOpen = false">
						<template #icon>
							<ChevronLeft
								:title="t('contacts', 'More fields')"
								:size="20" />
							{{ t('contacts', 'More fields') }}
						</template>
					</ActionButton>
					<ActionButton
						v-for="option in availableSecondaryProperties"
						:key="option.id"
						class="action--primary"
						:close-after-click="true"
						@click.prevent="addProp(option.id)">
						<template #icon>
							<PropertyTitleIcon :icon="option.icon" />
						</template>
						{{ option.name }}
					</ActionButton>
				</template>
			</Actions>
		</div>

		<!-- Dummy actions to keep the layout -->
		<div class="property__actions" />
	</div>
</template>

<script>
import { NcActionButton as ActionButton, NcActions as Actions } from '@nextcloud/vue'
import ICAL from 'ical.js'
import ChevronLeft from 'vue-material-design-icons/ChevronLeft.vue'
import DotsHorizontalIcon from 'vue-material-design-icons/DotsHorizontal.vue'
import IconAdd from 'vue-material-design-icons/Plus.vue'
import PropertyTitleIcon from '../Properties/PropertyTitleIcon.vue'
import OrgChartsMixin from '../../mixins/OrgChartsMixin.js'
import Contact from '../../models/contact.js'
import rfcProps from '../../models/rfcProps.js'

export default {
	name: 'ContactDetailsAddNewProp',

	components: {
		IconAdd,
		PropertyTitleIcon,
		Actions,
		ActionButton,
		ChevronLeft,
		DotsHorizontalIcon,
	},

	mixins: [
		OrgChartsMixin,
	],

	props: {
		contact: {
			type: Contact,
			default: null,
		},

		bus: {
			type: Object,
			required: true,
		},
	},

	data() {
		return {
			moreActionsOpen: false,
		}
	},

	computed: {
		/**
		 * Rfc props
		 *
		 * @return {object}
		 */
		properties() {
			return rfcProps.properties
		},

		/**
		 * Rfc props
		 *
		 * @return string[]
		 */
		propertiesOrder() {
			return rfcProps.fieldOrder
		},

		/**
		 * List of properties that the contact already have
		 *
		 * @return {string[]}
		 */
		usedProperties() {
			return this.contact.jCal[1].map((prop) => prop[0])
		},

		/**
		 * List of every primary properties you are allowed to add
		 * on this contact
		 *
		 * @return {object[]}
		 */
		availablePrimaryProperties() {
			return Object.keys(this.properties)
				// show primary or secondary props
				.filter((key) => this.properties[key].primary)
				// usable array of objects
				.map((key) => {
					return {
						id: key,
						name: this.properties[key].readableName,
						icon: this.properties[key].icon,
					}
				}).sort((a, b) => this.propertiesOrder.indexOf(a.id) - this.propertiesOrder.indexOf(b.id))
		},

		/**
		 * List of every secondary properties you are allowed to add
		 * on this contact
		 *
		 * @return {object[]}
		 */
		availableSecondaryProperties() {
			return Object.keys(this.properties)
				// show primary or secondary props
				.filter((key) => !this.properties[key].primary)
				// usable array of objects
				.map((key) => {
					return {
						id: key,
						name: this.properties[key].readableName,
						icon: this.properties[key].icon,
					}
				}).sort((a, b) => a.name.localeCompare(b.name))
		},
	},

	created() {
		this.bus.on('add-prop', this.addProp)
	},

	unmounted() {
		this.bus.off('add-prop', this.addProp)
	},

	methods: {
		/**
		 * Add a new prop to the contact
		 *
		 * @param {string} id the id of the property. e.g fn
		 */
		async addProp(id) {
			if (this.usedProperties.includes(id) && !this.properties[id].multiple) {
				this.bus.emit('focus-prop', id)
				return
			}

			if (id === 'x-managersname') {
				const others = this.otherContacts(this.contact)
				if (others.length === 1) {
					// Pick the first and only other contact
					await this.contact.vCard.addPropertyWithValue(id, others[0].key)
					await this.$store.dispatch('updateContact', this.contact)
				} else {
					await this.contact.vCard.addPropertyWithValue(id, '')
				}
			} else if (this.properties[id] && this.properties[id].defaultjCal
				&& this.properties[id].defaultjCal[this.contact.version]) {
				const defaultjCal = this.properties[id].defaultjCal[this.contact.version]
				const property = new ICAL.Property([id, ...defaultjCal])
				await this.contact.vCard.addProperty(property)
			} else {
				const defaultData = this.properties[id].defaultValue
				let defaultValue = defaultData ? defaultData.value : ''
				if (Array.isArray(defaultValue)) {
					defaultValue = [...defaultValue]
				}
				const property = await this.contact.vCard.addPropertyWithValue(id, defaultValue)
				if (defaultData && defaultData.type) {
					property.setParameter('type', defaultData.type)
				}
			}
			this.moreActionsOpen = false
			this.bus.emit('focus-prop', id)
		},
	},
}
</script>
