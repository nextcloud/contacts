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
	<div class="property__row">
		<!-- Dummy label to keep the layout -->
		<div class="property__label" />

		<!-- Extra div container to fix the poper position -->
		<div class="property__value">
			<Actions menu-align="right"
				event=""
				type="secondary"
				:menu-title="t('contacts', 'Add more info')"
				@click.native.prevent>
				<template #icon>
					<IconAdd :size="20" />
				</template>
				<template v-if="!moreActionsOpen">
					<ActionButton v-for="option in availablePrimaryProperties"
						:key="option.id"
						class="action--primary"
						:close-after-click="true"
						@click.prevent="addProp(option.id)">
						<template #icon>
							<PropertyTitleIcon :icon="option.icon" />
						</template>
						{{ option.name }}
					</ActionButton>
					<ActionButton :close-after-click="false"
						@click="moreActionsOpen=true">
						<template #icon>
							<DotsHorizontalIcon :title="t('contacts', 'More fields')"
								:size="20" />
						</template>
						{{ t('contacts', 'More fields') }}
					</ActionButton>
				</template>
				<template v-if="moreActionsOpen">
					<ActionButton :close-after-click="false"
						@click="moreActionsOpen=false">
						<template #icon>
							<ChevronLeft :title="t('contacts', 'More fields')"
								:size="20" />
							{{ t('contacts', 'More fields') }}
						</template>
					</ActionButton>
					<ActionButton v-for="option in availableSecondaryProperties"
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
import OrgChartsMixin from '../../mixins/OrgChartsMixin.js'
import { NcActions as Actions, NcActionButton as ActionButton } from '@nextcloud/vue'
import Contact from '../../models/contact.js'
import rfcProps from '../../models/rfcProps.js'
import ICAL from 'ical.js'
import PropertyTitleIcon from '../Properties/PropertyTitleIcon.vue'
import ChevronLeft from 'vue-material-design-icons/ChevronLeft.vue'
import DotsHorizontalIcon from 'vue-material-design-icons/DotsHorizontal.vue'
import IconAdd from 'vue-material-design-icons/Plus.vue'

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
			return this.contact.jCal[1].map(prop => prop[0])
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
				.filter(key => this.properties[key].primary)
				// usable array of objects
				.map(key => {
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
				.filter(key => !this.properties[key].primary)
				// usable array of objects
				.map(key => {
					return {
						id: key,
						name: this.properties[key].readableName,
						icon: this.properties[key].icon,
					}
				}).sort((a, b) => a.name.localeCompare(b.name))
		},
	},

	created() {
		this.bus.$on('add-prop', this.addProp)
	},

	destroyed() {
		this.bus.$off('add-prop', this.addProp)
	},

	methods: {
		/**
		 * Add a new prop to the contact
		 *
		 * @param {string} id the id of the property. e.g fn
		 */
		async addProp(id) {
			if (this.usedProperties.includes(id) && !this.properties[id].multiple) {
				this.bus.$emit('focus-prop', id)
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
			this.bus.$emit('focus-prop', id)
		},
	},
}
</script>
