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
import CheckboxRadioSwitch from '@nextcloud/vue/dist/Components/NcCheckboxRadioSwitch.js'
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
