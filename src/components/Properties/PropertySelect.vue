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

			<!-- if we do not support any type on our model but one is set anyway -->
			<div v-if="selectType" class="property__label">{{ selectType.name }}</div>

			<!-- no options, empty space -->
			<div v-else class="property__label">{{ propModel.readableName }}</div>

			<!-- delete the prop -->
			<button :title="t('contacts', 'Delete')" class="property__delete icon-delete" @click="deleteProperty" />

			<multiselect v-model="matchedOptions" :options="propModel.options" :placeholder="t('contacts', 'Select option')"
				class="multiselect-vue property__value" track-by="id" label="name"
				@input="updateValue" />
		</div>
	</div>
</template>

<script>
import Multiselect from 'vue-multiselect'
import propertyTitle from './PropertyTitle'
import debounce from 'debounce'

export default {
	name: 'PropertySelect',

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
			default: () => {},
			required: true
		},
		value: {
			type: [Object, String],
			default: '',
			required: true
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
			// value is represented by the ID of the possible options
			localValue: this.value
			// localType: this.selectType
		}
	},

	computed: {
		gridLength() {
			let hasTitle = this.isFirstProperty && this.propModel.icon ? 1 : 0
			let isLast = this.isLastProperty ? 1 : 0
			// length is one & add one space at the end
			return hasTitle + 1 + isLast
		},

		// matching value to the options we provide
		matchedOptions: {
			get() {
				let selected = this.propModel.options.find(option => option.id === this.localValue)
				return selected || {
					id: this.localValue,
					name: this.localValue
				}
			},
			set(value) {
				this.localValue = value.id
			}
		}

	},

	watch: {
		/**
		 * Since we're updating a local data based on the value prop,
		 * we need to make sure to update the local data on pop change
		 * TODO: check if this create performance drop
		 */
		value: function() {
			this.localValue = this.value
		}
		// selectType: function() {
		// 	this.localType = this.selectType
		// }
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
		updateValue: debounce(function(e) {
			// https://vuejs.org/v2/guide/components-custom-events.html#sync-Modifier
			this.$emit('update:value', this.localValue)
		}, 500)

		// updateType: debounce(function(e) {
		// 	// https://vuejs.org/v2/guide/components-custom-events.html#sync-Modifier
		// 	this.$emit('update:selectType', this.localType)
		// }, 500)
	}
}

</script>
