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

			<!-- Real input where the picker shows -->
			<datetime-picker :value="localValue.toJSDate()" :minute-step="10" :lang="lang"
				:clearable="false" :first-day-of-week="firstDay" :type="inputType"
				confirm @confirm="updateValue" />
		</div>
	</div>
</template>

<script>
import Multiselect from 'vue-multiselect'
import { DatetimePicker } from 'nextcloud-vue'
import debounce from 'debounce'
import moment from 'moment'
import { VCardTime } from 'ical.js'

import propertyTitle from './PropertyTitle'

/**
 * Format time with locale to display only
 * Using the Object as hared data since it's the only way
 * for us to forcefully omit some data (no year, or no time... etc)
 * and ths only common syntax between js Date, moment and VCardTime
 */
let formatDateTime = function(vcardTime, type, locale) {
	// this is the only possibility for us to ensure
	// no data is lost. e.g. if no second are set
	// the second will be null and not 0
	let datetimeData = vcardTime.toJSON()
	let datetime = ''
	/**
	 * Make sure to display the most interesting data.
	 * If the Object does not have any time, do not display
	 * the time and vice-versa.
	 */
	// No hour, no minute and no second = date only
	if (datetimeData.hour === null && datetimeData.minute === null && datetimeData.second === null) {
		datetime = moment(datetimeData)
			.locale(locale)
			.format('LL')

	// No year, no month and no day = time only
	} else if (datetimeData.year === null && datetimeData.month === null && datetimeData.day === null) {
		datetime = moment(datetimeData)
			.locale(locale)
			.format('LTS')
	}

	// Fallback to the data ical.js provide us
	if (datetime === '') {
		datetime = moment(datetimeData)
			.locale(locale)
			.format(
				type === 'datetime'
					? 'LLLL'	// date & time display
					: type === 'date'
						? 'LL'	// only date
						: 'LTS'	// only time
			)
	}
	return datetimeData.year === null
		// replace year and remove double spaces
		? datetime.replace(moment(vcardTime).year(), '').replace(/\s\s+/g, ' ')
		: datetime
}

/**
 * Override format function and use this since this
 * inside a function declaration will represent the
 * location of the call. So this = DatetimePicker.
 * Therefore we can use any props we pass through datetime-picker
 */
DatetimePicker.methods.stringify = function() {
	return formatDateTime(this.$parent.localValue, this.type, this.$parent.locale)
}

export default {
	name: 'PropertyDateTime',

	components: {
		Multiselect,
		propertyTitle,
		DatetimePicker
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
			locale: 'en',						// temporary value, see mounted
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
		// convert format like en_GB to en-gb for `moment.js`
		let locale = OC.getLocale().replace('_', '-').toLowerCase()

		// default load e.g. fr-fr
		import('moment/locale/' + this.locale)
			.then(e => {
				// force locale change to update
				// the component once done loading
				this.locale = locale
			})
			.catch(e => {
			// failure: fallback to fr
			import('moment/locale/' + locale.split('-')[0])
				.then(e => {
					this.locale = locale.split('-')[0]
				})
				.catch(e => {
				// failure, fallback to english
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
			let rawData = moment(e).toArray()

			/**
			 * Use the current year to ensure we do not lose
			 * the year data on v4.0 since we currently have
			 * no options to remove the year selection.
			 */
			if (this.value.year === null) {
				rawData[0] = null
			}

			// reset the VCardTime component to the selected date/time
			this.localValue.resetTo(...rawData)

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
