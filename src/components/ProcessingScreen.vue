<!--
  - SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<div>
		<EmptyContent
			:description="desc"
			:name="title"
			class="processing-screen__wrapper">
			<template #icon>
				<IconContact :size="20" />
			</template>
		</EmptyContent>
		<div class="processing-screen__progress">
			<progress :max="total" :value="progress" />
		</div>
	</div>
</template>

<script>
import { NcEmptyContent as EmptyContent } from '@nextcloud/vue'
import IconContact from 'vue-material-design-icons/AccountMultipleOutline.vue'
export default {
	name: 'ProcessingScreen',

	components: {
		EmptyContent,
		IconContact,
	},

	props: {
		total: {
			type: Number,
			required: true,
		},

		progress: {
			type: Number,
			required: true,
		},

		desc: {
			type: String,
			required: true,
		},

		title: {
			type: String,
			required: true,
		},
	},
}
</script>

<style lang="scss" scoped>
.processing-screen {
	&__wrapper {
		display: flex;
		flex-direction: column;
		width: auto;
		margin: 50px;
	}

	&__progress {
		padding: 0 12px;
	}
}
</style>
