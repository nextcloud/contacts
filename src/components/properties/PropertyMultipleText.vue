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
	<div v-if="propModel" :class="`grid-span-${gridLength}`" class="contact-details-property">
		<div class="contact-details-property-row">
			<!-- type selector -->
			<multiselect v-if="propModel.options" v-model="selectType"
				:options="propModel.options" :searchable="false" :placeholder="t('contacts', 'Select type')"
				class="multiselect-vue contact-details-label" track-by="id" label="name" />

			<!-- if we do not support any type on our model but one is set anyway -->
			<div v-else-if="selectType" class="contact-details-label">{{ selectType.name }}</div>

			<!-- no options, empty space -->
			<div v-else class="contact-details-label">{{ propModel.readableName }}</div>

			<!-- delete the prop -->
			<button :title="t('contacts', 'Delete')" class="icon-delete" @click="deleteProperty" />
		</div>

		<div v-for="index in propModel.displayOrder" :key="index" class="contact-details-property-row">
			<div class="contact-details-label">{{ propModel.readableValues[index] }}</div>
			<input v-model="value[index]" type="text">
		</div>
	</div>
</template>

<script>
import Multiselect from 'vue-multiselect'

export default {
	name: 'PropertyText',

	components: {
		Multiselect
	},

	props: {
		selectType: {
			type: Object,
			default: () => {}
		},
		propModel: {
			type: Object,
			default: () => {}
		},
		value: {
			type: [Array, String, Object],
			default: ''
		}
	},

	computed: {
		gridLength() {
			let hasType = this.propModel.options || this.selectType
			let length = this.propModel.displayOrder ? this.propModel.displayOrder.length : this.value.length
			return hasType ? length + 1 : length
		}
	},

	methods: {
		deleteProperty() {
			alert('deleted')
		}
	}
}

</script>
