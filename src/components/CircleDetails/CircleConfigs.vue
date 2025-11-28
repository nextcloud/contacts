<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<ul>
		<li v-for="(config, title) in PUBLIC_CIRCLE_CONFIG" :key="title" class="circle-config">
			<ContentHeading class="circle-config__title">
				{{ title }}
			</ContentHeading>

			<component :is="config.component" v-bind="config.props" :circle="circle" />
		</li>
	</ul>
</template>

<script>
import ContentHeading from './ContentHeading.vue'
import Circle from '../../models/circle.ts'
import { PUBLIC_CIRCLE_CONFIG } from '../../models/constants.ts'

export default {
	name: 'CircleConfigs',

	components: {
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
