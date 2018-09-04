<!--
  - @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
  -
  - @author John Molakvoæ <skjnldsv@protonmail.com>
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
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  - GNU Affero General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with this program. If not, see <http://www.gnu.org/licenses/>.
  -
  -->

<template>
	<div class="grid-span-2 property">

		<!-- title -->
		<property-title :icon="'icon-add'" :readable-name="t('contacts', 'Add new property')" />

		<div class="property__row">
			<div class="property__label" />

			<!-- type selector -->
			<multiselect :options="availableProperties" :placeholder="t('contacts', 'Choose property type')" class="multiselect-vue property__value"
				track-by="id" label="name" @input="addProp" />
		</div>
	</div>
</template>

<script>
import rfcProps from '../../models/rfcProps.js'
import Contact from '../../models/contact'
import propertyTitle from '../Properties/PropertyTitle'

import Multiselect from 'vue-multiselect'

export default {
	name: 'ContactDetailsAddNewProp',

	components: {
		propertyTitle,
		Multiselect
	},

	props: {
		contact: {
			type: Contact,
			default: null
		}
	},

	computed: {
		availableProperties() {
			return Object.keys(rfcProps.properties).map(key => {
				return {
					id: key,
					name: rfcProps.properties[key].readableName
				}
			})
		}
	},

	methods: {
		addProp({ id }) {
			let defaultData = rfcProps.properties[id].defaultValue
			let property = this.contact.vCard.addPropertyWithValue(id, defaultData ? defaultData.value : '')
			if (defaultData && defaultData.type) {
				property.setParameter('type', defaultData.type)
			}
		}
	}
}
</script>
