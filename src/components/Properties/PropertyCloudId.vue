<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div v-if="propModel && showProperty" class="property">
		<!-- title if first element -->
		<PropertyTitle v-if="isFirstProperty && propModel.icon"
			:property="property"
			:is-multiple="isMultiple"
			:is-read-only="isReadOnly"
			:bus="bus"
			:icon="propModel.icon"
			:readable-name="propModel.readableName" />

		<ExchangeInvite 
			:local-contact="localContact"
			:value.sync="localValue"
			:prop-name="propName"
			:value="value" 
			:contactFormEditMode="contactFormEditMode"
			@setContactFormEditModeEvent:value="setEditMode" />
		
		<div class="property__row">
			<div class="property__label">
				<!-- read-only type -->
				<span v-if="isReadOnly && propModel.options">
					{{ (localType && localType.name) || '' }}
				</span>

				<!-- type selector -->
				<NcSelect v-else-if="!isReadOnly && propModel.options"
					v-model="localType"
					:options="options"
					:placeholder="t('contacts', 'Select type')"
					:taggable="true"
					tag-placeholder="create"
					:disabled="isReadOnly"
					track-by="id"
					label="name"
					@option:created="createLabel"
					@input="updateType" />

				<!-- if we do not support any type on our model but one is set anyway -->
				<span v-else-if="selectType">
					{{ selectType.name }}
				</span>

				<!-- no options, empty space -->
				<span v-else>
					{{ propModel.readableName }}
				</span>
			</div>

			<!-- textarea for note -->
			<div class="property__value">
				<NcTextArea v-if="propName === 'note'"
					id="textarea"
					ref="textarea"
					:value.sync="localValue"
					:inputmode="inputmode"
					:readonly="isReadOnly"
					@update:value="updateValueNoDebounce"
					@mousemove="resizeHeight"
					@keypress="resizeHeight" />

				<!-- OR default to input -->
				<NcTextField v-else
					:value.sync="localValue"
					:inputmode="inputmode"
					:readonly="isReadOnly"
					:class="{'property__value--with-ext': haveExtHandler}"
					type="text"
					:placeholder="placeholder"
					@update:value="updateValue" />

				<!-- external link -->
				<a v-if="haveExtHandler && isReadOnly"
					:href="externalHandler"
					class="property__ext"
					target="_blank">
					<OpenInNewIcon :size="20" />
				</a>
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
import { NcSelect, NcTextArea, NcTextField } from '@nextcloud/vue'
import debounce from 'debounce'
import ExchangeInvite from '../CloudIdExchangeInvite.vue'
import PropertyMixin from '../../mixins/PropertyMixin.js'
import PropertyTitle from './PropertyTitle.vue'
import PropertyActions from './PropertyActions.vue'
import OpenInNewIcon from 'vue-material-design-icons/OpenInNew.vue'

export default {
	name: 'PropertyText',

	components: {
		ExchangeInvite,
		NcSelect,
		NcTextArea,
		NcTextField,
		PropertyTitle,
		PropertyActions,
		OpenInNewIcon,
	},

	mixins: [PropertyMixin],

	props: {
		propName: {
			type: String,
			default: 'text',
			required: true,
		},
		value: {
			type: String,
			default: '',
			required: true,
		},
		contactFormEditMode: {
			type: Boolean,
			default: false,
			required: true,
		}
	},

	computed: {
		showProperty() {
			return (this.isReadOnly && this.localValue) || !this.isReadOnly
		},
		inputmode() {
			if (this.propName === 'tel') {
				return 'tel'
			} else if (this.propName === 'email') {
				return 'email'
			} else if (this.propType === 'uri') {
				return 'url'
			}
			return false
		},
		URLScheme() {
			if (this.propName === 'tel') {
				return 'tel:'
			} else if (this.propName === 'email') {
				return 'mailto:'
			// if no scheme (roughly checking for the colon char)
			} else if (this.propType === 'uri' && this.localValue && this.localValue.indexOf(':') === -1) {
				return 'https://'
			} else if (this.propType === 'uri') {
				return '' // return empty, we already have a scheme in the value
			}
			return false
		},

		// format external link
		externalHandler() {
			if (this.URLScheme !== false) {
				return `${this.URLScheme}${this.localValue}`
			}
			return ''
		},

		haveExtHandler() {
			return this.externalHandler.trim() !== '' && this.localValue && this.localValue.length > 0
		},

		/**
		 * Return the selected type placeholder if any
		 * or the propModel default placeholder
		 *
		 * @return {string}
		 */
		placeholder() {
			// TODO add check (config?) if there is cloud ID exchange invitation capability
			if(this.isNewInvite) {
				return t('contacts', '... awaiting invite response')
			}
			if (this.propName == 'cloud') {
				return t('contacts', '... you may use exchange cloud ID option')
			}
			if (this.localType?.placeholder) {
				return this.localType.placeholder
			}
			return this.propModel.placeholder
		},
	},

	mounted() {
		// this.resizeHeight()
	},

	data() {
		return {
			isNewInvite: false,
			contactFormEditMode: false,
		}
	},
	emits: [
		'setContactFormEditModeEvent:value'
	],
	methods: {
		/**
		 * Watch textarea resize and update the gridSize accordingly
		 */
		resizeHeight: debounce(function() {
			if (this.$refs.textarea && this.$refs.textarea.offsetHeight) {
				// adjust textarea size to content (2 = border)
				this.$refs.textarea.style.height = `${this.$refs.textarea.scrollHeight + 2}px`
			}
		}, 100),

		/**
		 * Since we want to also trigger a resize
		 * but both of them have different debounce
		 * let's use a standard methods and call them both
		 *
		 * @param {object} e event
		 */
		updateValueNoDebounce(e) {
			this.resizeHeight(e)
			this.updateValue(e)
		},
		setName(name) {
			console.log(`received name: ${name}`)
			this.localContact.properties.find(p => p.name === 'fn').setValue(name)
			// this.propModel.placeholder = '... awaiting response'
			// this.$emit('update:value', '... awaiting response')
			this.isNewInvite = true
			// const i = ref('iets')
			// console.log(i)
			// this.$forceUpdate()

		},
		setEditMode(value) {
			this.$emit('setContactFormEditModeEvent:value', value)
		}
	},
}
</script>

<style lang="scss" scoped>
.property {
	&__value {
		&--note {
			white-space: pre-line;
		}
	}
}

</style>
