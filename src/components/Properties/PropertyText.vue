<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div v-if="propModel && showProperty" class="property">
		<!-- title if first element -->
		<PropertyTitle
			v-if="isFirstProperty && propModel.icon"
			:property="property"
			:is-multiple="isMultiple"
			:is-read-only="isReadOnly"
			:bus="bus"
			:icon="propModel.icon"
			:readable-name="propModel.readableName" />

		<div class="property__row">
			<div class="property__label">
				<!-- read-only type -->
				<span v-if="isReadOnly && propModel.options">
					{{ (localType && localType.name) || '' }}
				</span>

				<!-- type selector -->
				<NcSelect
					v-else-if="!isReadOnly && propModel.options"
					v-model="localType"
					:options="options"
					:placeholder="t('contacts', 'Select type')"
					:taggable="true"
					tag-placeholder="create"
					:disabled="isReadOnly"
					label="name"
					@option:created="createLabel"
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

			<!-- textarea for note -->
			<div class="property__value">
				<NcTextArea
					v-if="propName === 'note'"
					id="textarea"
					ref="textarea"
					v-model:model-value="localValue"
					:inputmode="inputmode"
					:readonly="isReadOnly"
					@update:model-value="updateValueNoDebounce"
					@mousemove="resizeHeight"
					@keypress="resizeHeight" />

				<!-- email with validation-->
				<NcTextField
					v-else-if="propName === 'email'"
					ref="email"
					v-model:model-value="localValue"
					:class="{ 'property__value--with-ext': haveExtHandler }"
					autocapitalize="none"
					autocomplete="email"
					:inputmode="inputmode"
					:readonly="isReadOnly"
					:error="!isEmailValid"
					:helper-text="!emailHelpText || isReadonly ? '' : emailHelpText"
					label-outside
					:placeholder="placeholder"
					type="email"
					@update:model-value="updateEmailValue" />

				<!-- OR default to input -->
				<NcTextField
					v-else
					v-model:model-value="localValue"
					:inputmode="inputmode"
					:readonly="isReadOnly"
					:class="{ 'property__value--with-ext': haveExtHandler }"
					type="text"
					:placeholder="placeholder"
					@update:model-value="updateValue" />

				<!-- external link -->
				<a
					v-if="haveExtHandler && isReadOnly"
					:href="externalHandler"
					class="property__ext"
					target="_blank">
					<OpenInNewIcon :size="20" />
				</a>
			</div>

			<!-- props actions -->
			<div class="property__actions">
				<PropertyActions
					v-if="!isReadOnly"
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
import isEmail from 'validator/lib/isEmail.js'
import OpenInNewIcon from 'vue-material-design-icons/OpenInNew.vue'
import PropertyActions from './PropertyActions.vue'
import PropertyTitle from './PropertyTitle.vue'
import PropertyMixin from '../../mixins/PropertyMixin.js'

export default {
	name: 'PropertyText',

	components: {
		NcSelect,
		NcTextArea,
		NcTextField,
		PropertyTitle,
		PropertyActions,
		OpenInNewIcon,
	},

	mixins: [PropertyMixin],
	inject: ['sharedState'],

	props: {
		propName: {
			type: String,
			default: 'text',
		},

		value: {
			type: String,
			required: true,
		},
	},

	data() {
		return {
			emailHelpText: null,
			isEmailValid: true,
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
			if (this.localType?.placeholder) {
				return this.localType.placeholder
			}
			return this.propModel.placeholder
		},
	},

	mounted() {
		if (this.propName === 'note') {
			this.resizeHeight()
		}
	},

	methods: {
		updateEmailValue() {
			// If email valid or empty
			this.isEmailValid = this.localValue === '' || isEmail(this.localValue)
			if (this.isEmailValid) {
				this.emailHelpText = null
				this.updateValue(this.localValue)
				this.sharedState.validEmail = true
				return
			}
			this.sharedState.validEmail = false
			this.emailHelpText = this.$refs.email.$refs.inputField.$refs.input.validationMessage || null
		},

		/**
		 * Watch textarea resize and update the gridSize accordingly
		 */
		resizeHeight: debounce(function() {
			const textarea = this.$refs.textarea.$el.querySelector('textarea')

			if (textarea && textarea?.offsetHeight) {
				// adjust textarea size to content (2 = border)
				textarea.style.height = 'auto'
				textarea.style.height = `${textarea.scrollHeight + 2}px`
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

:deep(.textarea__main-wrapper) {
	height: unset;

	textarea {
		resize: none !important;
	}
}
</style>
