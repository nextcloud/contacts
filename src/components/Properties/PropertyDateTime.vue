<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div v-if="propModel" class="property">
		<!-- title if first element -->
		<PropertyTitle v-if="isFirstProperty && propModel.icon"
			:property="property"
			:is-multiple="isMultiple"
			:is-read-only="isReadOnly"
			:bus="bus"
			:icon="propModel.icon"
			:readable-name="propModel.readableName" />

		<div class="property__row">
			<div class="property__label">
				<!-- type selector -->
				<NcSelect v-if="propModel.options"
					v-model="localType"
					:options="options"
					:searchable="false"
					:placeholder="t('contacts', 'Select type')"
					:disabled="isReadOnly"
					label="name"
					@update:model-value="updateType" />

				<!-- if we do not support any type on our model but one is set anyway -->
				<span v-else-if="selectType">
					{{ selectType.name }}
				</span>

				<!-- no options, empty space -->
				<span v-else>
					{{ propModel.readableName }}
				</span>
			</div>

			<div class="property__value">
				<!-- Real input where the picker shows -->
				<DateTimePicker v-if="!isReadOnly"
					:model-value="datePickerValue"
					:minute-step="10"
					:lang="lang"
					:clearable="false"
					:first-day-of-week="firstDay"
					:type="inputType"
					:formatter="dateFormat"
					@update:model-value="debounceUpdateValue" />

				<input v-else
					:readonly="true"
					:value="formatDateTime()">
			</div>

			<!-- props actions -->
			<div class="property__actions">
				<PropertyActions v-if="!isReadOnly"
					:actions="actions"
					:property-component="this"
					@delete="deleteProperty" />
			</div>
		</div>
	</div>
</template>

<script>
import debounce from 'debounce'
import moment from '@nextcloud/moment'
import {
	NcDateTimePicker as DateTimePicker,
	NcSelect,
} from '@nextcloud/vue'
import ICAL from 'ical.js'
import { getLocale } from '@nextcloud/l10n'
import { toRaw } from 'vue'

import PropertyMixin from '../../mixins/PropertyMixin.js'
import PropertyTitle from './PropertyTitle.vue'
import PropertyActions from './PropertyActions.vue'

export default {
	name: 'PropertyDateTime',

	components: {
		NcSelect,
		DateTimePicker,
		PropertyTitle,
		PropertyActions,
	},

	mixins: [PropertyMixin],

	props: {
		value: {
			type: [ICAL.VCardTime, String],
			default: '',
			required: true,
		},
	},

	data() {
		return {
			// input type following DatePicker docs
			inputType: this.propType === 'date-time' || this.propType === 'date-and-or-time'
				? 'datetime'
				: this.propType === 'date'
					? 'date'
					: 'time',

			firstDay: window.firstDay === 0 ? 7 : window.firstDay, // provided by nextcloud
			lang: {
				days: window.dayNamesShort, // provided by nextcloud
				months: window.monthNamesShort, // provided by nextcloud
				placeholder: {
					date: t('contacts', 'Select Date'),
				},
			},
			dateFormat: {
				stringify: (date) => {
					return date ? this.formatDateTime() : null
				},
				parse: (value) => {
					return value ? moment(value, ['LL', 'L']).toDate() : null
				},
			},
		}
	},

	computed: {
		// make sure the property is valid
		vcardTimeLocalValue() {
			if (typeof this.localValue === 'string') {
				// eslint-disable-next-line new-cap
				return new ICAL.VCardTime.fromDateAndOrTimeString(this.localValue, this.propType)
			}
			return this.localValue
		},
		datePickerValue() {
			if (!this.vcardTimeLocalValue) {
				return this.vcardTimeLocalValue
			}

			// ical.js can't cope with proxies, hence we need to unwrap the proxy first
			return toRaw(this.vcardTimeLocalValue).toJSDate()
		},
	},

	async mounted() {
		// Load the locale
		// convert format like en_GB to en-gb for `moment.js`
		let locale = getLocale().replace('_', '-').toLowerCase()

		try {
			// default load e.g. fr-fr
			await import(/* webpackChunkName: 'moment' */'moment/locale/' + locale)
			this.locale = locale
		} catch (e) {
			try {
				// failure: fallback to fr
				locale = locale.split('-')[0]
				await import(/* webpackChunkName: 'moment' */'moment/locale/' + locale)
			} catch (e) {
				// failure, fallback to english
				console.debug('Fallback to locale', 'en')
				locale = 'en'
			}
		} finally {
			// force locale change to update
			// the component once done loading
			this.locale = locale
			console.debug('Locale used', locale)
		}
	},

	methods: {
		/**
		 * Debounce and send update event to parent
		 */
		debounceUpdateValue: debounce(function(date) {
			const objMap = ['year', 'month', 'day', 'hour', 'minute', 'second']
			const rawArray = moment(date).toArray()

			const dateObject = rawArray.reduce((acc, cur, index) => {
				acc[objMap[index]] = cur
				return acc
			}, {})

			/**
			 * VCardTime starts months at 1
			 * but moment and js starts at 0
			 * ! since we use moment to generate our time array
			 * ! we need to make sure the conversion to VCardTime is done well
			 */
			dateObject.month++

			this.updateValue(dateObject)
		}, 500),

		updateValue(dateObject, forceYear) {
			const ignoreYear = this.property.getParameter('x-apple-omit-year')

			/**
			 * If forceYear, we add back the year!
			 * taken from x-apple-omit-year parameter
			 * of from the current year if we don't have
			 * any other appropriate year data
			 */
			if (forceYear) {
				this.property.removeParameter('x-apple-omit-year')
				dateObject.year = parseInt(ignoreYear) ? ignoreYear : moment().year()
			} else

			/**
			 * Use the current year to ensure we do not lose
			 * the year data on v4.0 since we currently have
			 * no options to remove the year selection.
			 * ! using this.value since this.localValue reflect the current change
			 * ! so we need to make sure we do not use the updated data
			 * If we force the removal of the year (vcard 4.0 only)
			 * year is still valid on the apple format x-apple-omit-year
			 */
				if (!this.value.year) {
					dateObject.year = null
				} else

				// Apple style omit year parameter
				// if year changed and we were already
				// ignoring the year, we update the parameter
					if (ignoreYear && dateObject.year) {
						this.property.setParameter('x-apple-omit-year', parseInt(dateObject.year).toString())
					}

			// reset the VCardTime component to the selected date/time
			this.localValue = new ICAL.VCardTime(dateObject, null, this.propType)

			// https://vuejs.org/v2/guide/components-custom-events.html#sync-Modifier
			// Use moment to convert the JsDate to Object
			// ical.js can't cope with proxies, hence we need to unwrap the proxy first
			this.$emit('update:value', toRaw(this.localValue))
		},

		/**
		 * Format time with locale to display only
		 * Using the Object as hared data since it's the only way
		 * for us to forcefully omit some data (no year, or no time... etc)
		 * and ths only common syntax between js Date, moment and VCardTime
		 *
		 * @return {string}
		 */
		formatDateTime() {
			// this is the only possibility for us to ensure
			// no data is lost. e.g. if no second are set
			// the second will be null and not 0
			const datetimeData = this.vcardTimeLocalValue.toJSON()
			let datetime = ''

			const ignoreYear = this.property.getParameter('x-apple-omit-year')
			if (ignoreYear) {
				datetimeData.year = null
			}

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
					.format('LL')

			// No year, no month and no day = time only
			} else if (datetimeData.year === null && datetimeData.month === null && datetimeData.day === null) {
				datetime = moment(datetimeData)
					.format('LTS')
			}

			// Use input type to properly format our data
			if (datetime === '') {
				datetime = moment(datetimeData)
					.format(
						this.inputType === 'datetime'
							? 'llll' // date & time display
							: this.inputType === 'date'
								? 'll' // only date
								: 'LTS', // only time
					)
			}

			return datetimeData.year === null
				// replace year and remove double spaces
				? datetime.replace(moment(this.vcardTimeLocalValue).year(), '').replace(/\s\s+/g, ' ')
				: datetime
		},
	},
}

</script>
