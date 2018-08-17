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
	<div v-if="propModel" :class="`grid-span-${gridLength}`" class="property">
		<!-- title if first element -->
		<property-title v-if="isFirstProperty && propModel.icon" :icon="propModel.icon" :readable-name="propModel.readableName" />

		<div class="property__row">
			<!-- type selector -->
			<multiselect v-if="propModel.options" v-model="selectType"
				:options="propModel.options" :searchable="false" :placeholder="t('contacts', 'Select type')"
				class="multiselect-vue property__label" track-by="id" label="name" />

			<!-- if we do not support any type on our model but one is set anyway -->
			<div v-else-if="selectType" class="property__label">{{ selectType.name }}</div>

			<!-- no options, empty space -->
			<div v-else class="property__label">{{ propModel.readableName }}</div>

			<!-- delete the prop -->
			<button :title="t('contacts', 'Delete')" class="property__delete icon-delete" @click="deleteProperty" />

			<input v-model.trim="localValue" class="property__value" type="text"
				@input="updateProp">
		</div>
	</div>
</template>

<script>
import Multiselect from 'vue-multiselect'
import propertyTitle from './PropertyTitle'
import debounce from 'debounce'
import { VCardTime } from 'ical.js'

export default {
	name: 'PropertyDateTime',

	components: {
		Multiselect,
		propertyTitle
	},

	props: {
		selectType: {
			type: [Object, Boolean],
			default: () => {}
		},
		propModel: {
			type: Object,
			default: () => {}
		},
		value: {
			type: VCardTime,
			default: ''
		},
		isFirstProperty: {
			type: Boolean,
			default: true
		},
		isLastProperty: {
			type: Boolean,
			default: true
		}
	},

	data() {
		return {
			localValue: this.value
		}
	},

	computed: {
		gridLength() {
			let hasTitle = this.isFirstProperty && this.propModel.icon ? 1 : 0
			let isLast = this.isLastProperty ? 1 : 0
			// length is always one & add one space at the end
			return hasTitle + 1 + isLast
		}
	},

	methods: {

		/**
		 * Delete the property
		 */
		deleteProperty() {
			this.$emit('delete')
		},

		/**
		 * Debounce and send update event to parent
		 */
		updateProp: debounce(function(e) {
			// https://vuejs.org/v2/guide/components-custom-events.html#sync-Modifier
			this.$emit('update:value', this.localValue)
		}, 500)
	}
}

</script>
