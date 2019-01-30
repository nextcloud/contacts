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
			<div v-else-if="selectType" class="property__label">
				{{ selectType.name }}
			</div>

			<!-- no options, empty space -->
			<div v-else class="property__label">
				{{ propModel.readableName }}
			</div>

			<!-- props actions -->
			<action :actions="actions" class="property__actions" />

			<!-- Real input where the picker shows -->
			<datetime-picker :value="localValue.toJSDate()" :minute-step="10" :lang="lang"
				:clearable="false" :first-day-of-week="firstDay" :type="inputType"
				:readonly="isReadOnly" :format="dateFormat" class="property__value"
				confirm @confirm="updateValue" />
		</div>
	</div>
</template>

<script>
import debounce from 'debounce'
import moment from 'moment'
import { DatetimePicker } from 'nextcloud-vue'
import { VCardTime } from 'ical.js'

import PropertyMixin from 'Mixins/PropertyMixin'
import PropertyTitle from './PropertyTitle'

export default {
	name: 'PropertyDateTime',

	components: {
		DatetimePicker,
		PropertyTitle
	},

	mixins: [PropertyMixin],

	props: {
		value: {
			type: VCardTime,
			default: '',
			required: true
		}
	},

	data() {
		return {
			// input type following DatePicker docs
			inputType: this.propType === 'date-time' || this.propType === 'date-and-or-time'
				? 'datetime'
				: this.propType === 'date'
					? 'date'
					: 'time',

			// locale and lang data
			locale: 'en',
			firstDay: window.firstDay + 1,			// provided by nextcloud
			lang: {
				days: window.dayNamesShort,		// provided by nextcloud
				months: window.monthNamesShort,	// provided by nextcloud
				placeholder: {
					date: t('contacts', 'Select Date')
				}
			},
			dateFormat: {
				stringify: (date) => {
					return date ? this.formatDateTime() : null
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
		 * Debounce and send update event to parent
		 */
		updateValue: debounce(function(e) {
			let rawData = moment(e).toArray()

			/**
			 * Use the current year to ensure we do not lose
			 * the year data on v4.0 since we currently have
			 * no options to remove the year selection.
			 * ! using this.value since this.localValue reflect the current change
			 * ! so we need to make sure we do not use the updated data
			 */
			if (this.value.year === null) {
				rawData[0] = null
			}

			/**
			 * VCardTime starts months at 1
			 * but moment and js starts at 0
			 * ! since we use moment to generate our time array
			 * ! we need to make sure the conversion to VCardTime is done well
			 */
			rawData[1]++

			// reset the VCardTime component to the selected date/time
			this.localValue.resetTo(...rawData)

			// https://vuejs.org/v2/guide/components-custom-events.html#sync-Modifier
			// Use moment to convert the JsDate to Object
			this.$emit('update:value', this.localValue)
		}, 500),

		/**
		 * Format time with locale to display only
		 * Using the Object as hared data since it's the only way
		 * for us to forcefully omit some data (no year, or no time... etc)
		 * and ths only common syntax between js Date, moment and VCardTime
		 *
		 * @returns {string}
		 */
		formatDateTime: function() {
			// this is the only possibility for us to ensure
			// no data is lost. e.g. if no second are set
			// the second will be null and not 0
			let datetimeData = this.localValue.toJSON()
			let datetime = ''

			// FUN FACT: JS date starts month at zero!
			datetimeData.month--

			/**
			 * Make sure to display the most interesting data.
			 * If the Object does not have any time, do not display
			 * the time and vice-versa.
			 */

			// No hour, no minute and no second = date only
			if (datetimeData.hour === null && datetimeData.minute === null && datetimeData.second === null) {
				datetime = moment(datetimeData)
					.locale(this.locale)
					.format('LL')

			// No year, no month and no day = time only
			} else if (datetimeData.year === null && datetimeData.month === null && datetimeData.day === null) {
				datetime = moment(datetimeData)
					.locale(this.locale)
					.format('LTS')
			}

			// Use input type to properly format our data
			if (datetime === '') {
				datetime = moment(datetimeData)
					.locale(this.locale)
					.format(
						this.inputType === 'datetime'
							? 'llll'	// date & time display
							: this.inputType === 'date'
								? 'll'	// only date
								: 'LTS'	// only time
					)
			}

			return datetimeData.year === null
				// replace year and remove double spaces
				? datetime.replace(moment(this.localValue).year(), '').replace(/\s\s+/g, ' ')
				: datetime
		}
	}
}

</script>
