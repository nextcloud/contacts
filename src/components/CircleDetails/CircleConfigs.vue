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
				<CheckboxRadio v-for="(label, config) in configs"
					:key="'circle-config' + config"
					:checked="isChecked(config)"
					wrapper-element="li"
					@update:checked="onChange(config, $event)">
					{{ label }}
				</CheckboxRadio>
			</ul>
		</li>
	</ul>
</template>

<script>
import CheckboxRadio from '@nextcloud/vue/dist/Components/CheckboxRadio'
import ContentHeading from './ContentHeading'

import { PUBLIC_CIRCLE_CONFIG } from '../../models/constants.ts'
import Circle from '../../models/circle.ts'
import { CircleEdit, editCircle } from '../../services/circles'

export default {
	name: 'CircleConfigs',

	components: {
		CheckboxRadio,
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
		}
	},

	methods: {
		isChecked(config) {
			return (this.circle.config & config) !== 0
		},

		/**
		 * On toggle, add or remove the config bitwise
		 * @param {CircleConfig} config the circle config to manage
		 * @param {boolean} checked checked or not
		 */
		async onChange(config, checked) {
			console.debug('Circle config', `'${PUBLIC_CIRCLE_CONFIG[config]}'`, 'is set to', checked)

			const prevConfig = this.circle.config

			if (checked) {
				// eslint-disable-next-line vue/no-mutating-props
				this.circle.config = prevConfig | config
			} else {
				// eslint-disable-next-line vue/no-mutating-props
				this.circle.config = prevConfig & ~config
			}

			const data = await editCircle(this.circle.id, CircleEdit.Config, this.circle.config)
			console.info(data)

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
