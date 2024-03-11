<!--
  - @copyright Copyright (c) 2019 Marco Ambrosini <marcoambrosini@pm.me>
  -
  - @author Marco Ambrosini <marcoambrosini@pm.me>
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
-->

<template>
	<Modal size="normal"
		@close="onCancel">
		<!-- Wrapper for content & navigation -->
		<div class="entity-picker">
			<!-- Search -->
			<div class="entity-picker__new">
				<input ref="input"
					v-model="circleName"
					:placeholder="t('contacts', 'New team name')"
					class="entity-picker__new-input"
					type="text"
					@keypress.enter="onSubmit">
			</div>

			<div class="entity-picker__content">
				<p> {{ CIRCLE_DESC }}</p>
				<br>

				<!-- Personal circle, TODO: IMPLEMENT -->
				<template v-if="false">
					<CheckboxRadioSwitch :checked.sync="isPersonal"
						:disabled="loading !== false">
						{{ t('contacts', 'Personal team') }}
					</CheckboxRadioSwitch>
					<p>
						{{ t('contacts', 'This team will only be visible to you. Other members will not be able to see or use it.') }}
					</p>
				</template>

				<!-- Local circle -->
				<template v-if="isGlobalScale">
					<CheckboxRadioSwitch :checked.sync="isLocal"
						:disabled="loading !== false">
						{{ t('contacts', 'Local team') }}
					</CheckboxRadioSwitch>
					<p>
						{{ t('contacts', 'This team will not be shared with the other instances of the global scale') }}
					</p>
				</template>
			</div>

			<div class="entity-picker__navigation">
				<button :disabled="loading"
					class="navigation__button-left"
					@click="onCancel">
					{{ t('contacts', 'Cancel') }}
				</button>
				<button :disabled="isEmptyName || loading"
					class="navigation__button-right primary"
					@click="onSubmit">
					{{ t('contacts', 'Create team') }}
				</button>
			</div>
		</div>
	</Modal>
</template>

<script>
import { getCapabilities } from '@nextcloud/capabilities'
import {
	NcCheckboxRadioSwitch as CheckboxRadioSwitch,
	NcModal as Modal,
} from '@nextcloud/vue'

import { CIRCLE_DESC } from '../../models/constants.ts'

export default {
	name: 'NewCircleIntro',

	components: {
		CheckboxRadioSwitch,
		Modal,
	},

	props: {
		loading: {
			type: Boolean,
			default: false,
		},
	},

	data() {
		return {
			circleName: '',
			isPersonal: false,
			isLocal: false,

			CIRCLE_DESC,
		}
	},

	computed: {
		isEmptyName() {
			return this.circleName.trim() === ''
		},

		isGlobalScale() {
			return getCapabilities().circles?.status?.globalScale !== false
		},
	},

	mounted() {
		this.$nextTick(() => {
			this.$refs.input.focus()
			this.$refs.input.select()
		})
	},

	methods: {
		onCancel() {
			/**
			 * Emitted when the user closed or cancelled
			 */
			this.$emit('close')
		},
		onSubmit() {
			/**
			 * Emitted when user submit the form
			 *
			 * @type {Array} the selected entities
			 */
			this.$emit('submit', this.circleName, this.isPersonal, this.isLocal)
		},
	},
}
</script>

<style lang="scss" scoped>
@use "sass:math";

// Dialog variables
$dialog-padding: 20px;
$dialog-height: 480px;
$entity-spacing: 4px;

// https://uxplanet.org/7-rules-for-mobile-ui-button-design-e9cf2ea54556
// recommended is 48px
// 44px is what we choose and have very good visual-to-usability ratio
$clickable-area: 44px;

// background icon size
// also used for the scss icon font
$icon-size: 16px;

// icon padding for a $clickable-area width and a $icon-size icon
// ( 44px - 16px ) / 2
$icon-margin: math.div($clickable-area - $icon-size, 2);

.entity-picker {
	position: relative;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	min-height: $dialog-height;
	height: 100%;
	padding: $dialog-padding;
	box-sizing: border-box;

	&__new {
		position: relative;
		display: flex;
		align-items: center;
		&-input {
			width: 100%;
			height: $clickable-area - $entity-spacing !important;
			margin: $entity-spacing 0;
			font-size: 16px;
			line-height: $clickable-area - $entity-spacing;
		}
	}

	&__content {
		flex: 1 1 100%;
		padding: 20px 0;
	}

	&__navigation {
		z-index: 1;
		display: flex;
		// define our base width, no shrinkage
		flex: 0 0;
		justify-content: space-between;
		// Same as above
		width: 100%;
		box-shadow: 0 -10px 5px var(--color-main-background);
		&__button-right {
			margin-left: auto;
		}
	}
}

// Make the checkboxes span full width
:deep(.checkbox-radio-switch__label) {
	width: 100%;
}

// Properly center Entity Picker empty content
.empty-content {
	margin: 0;
}

/** Size full in the modal component doesn't have border radius, this adds
it back */
:deep(.modal-container) {
	border-radius: var(--border-radius-large) !important;
}

</style>
