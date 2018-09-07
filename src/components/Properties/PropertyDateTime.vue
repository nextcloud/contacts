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
			<multiselect v-if="propModel.options" v-model="localType"
				:options="propModel.options" :searchable="false" :placeholder="t('contacts', 'Select type')"
				class="multiselect-vue property__label" track-by="id" label="name"
				@input="updateType" />

			<!-- if we do not support any type on our model but one is set anyway -->
			<div v-else-if="selectType" class="property__label">{{ selectType.name }}</div>

			<!-- no options, empty space -->
			<div v-else class="property__label">{{ propModel.readableName }}</div>

			<!-- delete the prop -->
			<button :title="t('contacts', 'Delete')" class="property__delete icon-delete" @click="deleteProperty" />

			<!-- Fake input in the background to display the correct date
			according to the user locale. Tab navigation is ignored here -->
			<input :value="formatedDateTime" class="property__value property__value--localedate" type="text"
				tabindex="-1"></div>
		<div class="property__row">
			<!-- Real input where the picker shows -->
			<date-picker :value="localValue.toJSDate()" :minute-step="10" :lang="lang"
				:clearable="false" :first-day-of-week="firstDay" :type="inputType"
				confirm @confirm="updateValue" />
		</div>
	</div>
</template>

<script>
import Multiselect from 'vue-multiselect'
import DatePicker from 'vue2-datepicker'
import propertyTitle from './PropertyTitle'
import debounce from 'debounce'
import moment from 'moment'
import { VCardTime } from 'ical.js'

export default {
	name: 'PropertyDateTime',

	components: {
		Multiselect,
		propertyTitle,
		DatePicker
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
			type: VCardTime,
			default: '',
			required: true
		},
		property: {
			type: Object,
			default: () => {},
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
			localValue: this.value,
			localType: this.selectType,

			// input type following DatePicker docs
			inputType: this.property.getDefaultType() === 'date-time' || this.property.getDefaultType() === 'date-and-or-time'
				? 'datetime'
				: this.property.getDefaultType() === 'date'
					? 'date'
					: 'time',

			// locale and lang data
			// convert format like en_GB to en-gb for `moment.js`
			locale: OC.getLocale().replace('_', '-').toLowerCase(),
			firstDay: window.firstDay,			// provided by nextcloud
			lang: {
				days: window.dayNamesShort,		// provided by nextcloud
				months: window.monthNamesShort,	// provided by nextcloud
				placeholder: {
					date: t('contacts', 'Select Date')
				}
			}
		}
	},

	computed: {
		gridLength() {
			let hasTitle = this.isFirstProperty && this.propModel.icon ? 1 : 0
			let isLast = this.isLastProperty ? 1 : 0
			// length is always one & add one space at the end
			return hasTitle + 1 + isLast
		},

		/**
		 * Format time with locale to display only
		 * Using the Object as hared data since it's the only way
		 * for us to forcefully omit some data (no year, or no time... etc)
		 * and ths only common syntax between js Date, moment and VCardTime
		 */
		formatedDateTime() {
			return moment(this.localValue.toJSDate().toJSON())
				.locale(this.locale)
				.format(
					this.inputType === 'datetime'
						? 'LLLL'	// date & time display
						: this.inputType === 'date'
							? 'LL'	// only date
							: 'LTS'	// only time
				)
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
		},
		selectType: function() {
			this.localType = this.selectType
		}
	},

	mounted() {
		// Load the locale
		// default load e.g. fr-fr
		import('moment/locale/' + this.locale).catch(e => {
			// failure: fallback to fr
			console.debug(e)
			import('moment/locale/' + this.locale.split('-')[0])
				.then(e => {
					this.locale = this.locale.split('-')[0]
				})
				.catch(e => {
					// failure, fallback to english
					console.debug(e)
					this.locale = 'en'
				})
		})
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
			// reset the VCardTime component to the selected date/time
			this.localValue.resetTo(...moment(e).toArray())

			// https://vuejs.org/v2/guide/components-custom-events.html#sync-Modifier
			// Use moment to convert the JsDate to Object
			this.$emit('update:value', this.localValue)
		}, 500),

		updateType: debounce(function(e) {
			// https://vuejs.org/v2/guide/components-custom-events.html#sync-Modifier
			this.$emit('update:selectType', this.localType)
		}, 500)
	}
}

</script>
