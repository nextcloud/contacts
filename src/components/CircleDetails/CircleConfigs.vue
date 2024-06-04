<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<ul>
		<li v-for="(configs, title) in PUBLIC_CIRCLE_CONFIG" :key="title" class="circle-config">
			<ContentHeading class="circle-config__title">
				{{ title }}
			</ContentHeading>

			<ul class="circle-config__list">
				<CheckboxRadioSwitch v-for="(label, config) in configs"
					:key="'circle-config' + config"
					:checked="isChecked(config)"
					:loading="loading === config"
					:disabled="loading !== false"
					wrapper-element="li"
					@update:checked="onChange(config, $event)">
					{{ label }}
				</CheckboxRadioSwitch>
			</ul>
		</li>
	</ul>
</template>

<script>
import { NcCheckboxRadioSwitch as CheckboxRadioSwitch } from '@nextcloud/vue'
import ContentHeading from './ContentHeading.vue'

import { PUBLIC_CIRCLE_CONFIG } from '../../models/constants.ts'
import Circle from '../../models/circle.ts'
import { CircleEdit, editCircle } from '../../services/circles.ts'
import { showError } from '@nextcloud/dialogs'

export default {
	name: 'CircleConfigs',

	components: {
		CheckboxRadioSwitch,
		ContentHeading,
	},

	props: {
		circle: {
			type: Circle,
			required: true,
		},
	},

	data() {
		return {
			PUBLIC_CIRCLE_CONFIG,

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
				// eslint-disable-next-line vue/no-mutating-props
				config = prevConfig | config
			} else {
				// eslint-disable-next-line vue/no-mutating-props
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

<style lang="scss" scoped>
.circle-config {
	&__title {
		user-select: none;
		margin-top: 22px;
	}
}
</style>
