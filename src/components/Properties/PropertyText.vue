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
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  - GNU Affero General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with this program. If not, see <http://www.gnu.org/licenses/>.
  -
  -->

<template>
	<div v-if="propModel" :class="`grid-span-${gridLength}`" class="property">
		<!-- title if first element -->
		<property-title v-if="isFirstProperty && propModel.icon" :icon="propModel.icon" :readable-name="propModel.readableName"
			:info="propModel.info" />

		<div class="property__row">
			<!-- type selector -->
			<multiselect v-if="propModel.options" v-model="localType"
				:options="options" :searchable="false" :placeholder="t('contacts', 'Select type')"
				:disabled="isReadOnly" class="property__label" track-by="id"
				label="name" @input="updateType" />

			<!-- if we do not support any type on our model but one is set anyway -->
			<div v-else-if="selectType" class="property__label">{{ selectType.name }}</div>

			<!-- no options, empty space -->
			<div v-else class="property__label">{{ propModel.readableName }}</div>

			<!-- delete the prop -->
			<button v-if="!isReadOnly" :title="t('contacts', 'Delete')" class="property__delete icon-delete"
				@click="deleteProperty" />

			<!-- textarea for note -->
			<textarea v-if="propName === 'note'" id="textarea" ref="textarea"
				v-model.trim="localValue" :type="type" :readonly="isReadOnly"
				class="property__value"
				@input="updateValueNoDebounce" @mousemove="resizeGrid" @keypress="resizeGrid" />

			<!-- OR default to input -->
			<input v-else v-model.trim="localValue" :type="type"
				:readonly="isReadOnly" class="property__value" @input="updateValue">
		</div>
	</div>
</template>

<script>
import debounce from 'debounce'
import PropertyMixin from 'Mixins/PropertyMixin'
import PropertyTitle from './PropertyTitle'

export default {
	name: 'PropertyText',

	components: {
		PropertyTitle
	},

	mixins: [PropertyMixin],

	props: {
		propName: {
			type: String,
			default: 'text',
			required: true
		},
		propType: {
			type: String,
			default: 'text',
			required: true
		},
		value: {
			type: String,
			default: '',
			required: true
		}
	},

	data() {
		return {
			// the textarea additionnal height compared to the
			// default input text. Min is 2 grid height
			noteHeight: 1
		}
	},

	computed: {
		gridLength() {
			let hasTitle = this.isFirstProperty && this.propModel.icon ? 1 : 0
			let isLast = this.isLastProperty ? 1 : 0
			let noteHeight = this.propName === 'note'
				? this.noteHeight
				: 0
			// length is one & add one space at the end
			return hasTitle + 1 + isLast + noteHeight
		},
		type() {
			if (this.propName === 'tel') {
				return 'tel'
			} else if (this.propName === 'email') {
				return 'email'
			} else if (this.propType === 'uri') {
				return 'url'
			}
			return 'text'
		}
	},

	mounted() {
		this.resizeGrid()
	},

	methods: {
		/**
		 * Delete the property
		 */
		deleteProperty() {
			this.$emit('delete')
		},

		/**
		 * Watch textarea resize and update the gridSize accordingly
		 */
		resizeGrid: debounce(function(e) {
			if (this.$refs.textarea && this.$refs.textarea.offsetHeight) {
				// adjust textarea size to content (2 = border)
				this.$refs.textarea.style.height = `${this.$refs.textarea.scrollHeight + 2}px`
				// adjust grid
				this.noteHeight = Math.floor(this.$refs.textarea.offsetHeight / 40)
			}
		}, 100),

		/**
		 * Since we want to also trigger a resize
		 * but both of them have different debounce
		 * let's use a standard methods and call them both
		 *
		 * @param {Object} e event
		 */
		updateValueNoDebounce(e) {
			this.resizeGrid(e)
			this.updateValue(e)
		}
	}
}
</script>
