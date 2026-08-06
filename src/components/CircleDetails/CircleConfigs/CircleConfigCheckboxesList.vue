<!--
  - SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<ul class="circle-config__list">
		<NcCheckboxRadioSwitch
			v-for="(label, config) in configs"
			:key="'circle-config' + config"
			:model-value="isChecked(config)"
			:loading="loading === config"
			:disabled="loading !== false"
			wrapper-element="li"
			@update:model-value="onChange(config, $event)">
			{{ label }}
		</NcCheckboxRadioSwitch>
	</ul>
</template>

<script>
import { showError } from '@nextcloud/dialogs'
import { t } from '@nextcloud/l10n'
import { NcCheckboxRadioSwitch } from '@nextcloud/vue'
import Circle from '../../../models/circle.ts'
import { CircleEdit, editCircle } from '../../../services/circles.ts'

export default {
	name: 'CircleConfigCheckboxesList',

	components: {
		NcCheckboxRadioSwitch,
	},

	props: {
		circle: {
			type: Circle,
			required: true,
		},

		configs: {
			type: Object,
			required: true,
		},
	},

	data() {
		return {
			loading: false,
		}
	},

	methods: {
		isChecked(config) {
			return (this.circle.config & config) !== 0
		},

		/**
		 * On toggle, add or remove the config bitwise
		 *
		 * @param {CircleConfig} config the circle config to manage
		 * @param {boolean} checked checked or not
		 */
		async onChange(config, checked) {
			this.logger.debug(`Circle config ${config} is set to ${checked}`)

			this.loading = config
			const prevConfig = this.circle.config
			if (checked) {
				config = prevConfig | config
			} else {
				config = prevConfig & ~config
			}

			try {
				const circleData = await editCircle(this.circle.id, CircleEdit.Config, config)
				// eslint-disable-next-line vue/no-mutating-props
				this.circle.config = circleData.config
			} catch (error) {
				console.error('Unable to edit circle config', prevConfig, config, error)
				showError(t('contacts', 'An error happened during the config change'))
			} finally {
				this.loading = false
			}
		},
	},
}
</script>
