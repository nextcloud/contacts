<!--
  - SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<h3 class="app-content-heading">
		<slot />
		<div v-if="loading" class="app-content-heading__loader icon-loading-small" />
	</h3>
</template>

<script>
export default {
	name: 'ContentHeading',

	props: {
		loading: {
			type: Boolean,
			default: false,
		},
	},
}
</script>

<style lang="scss" scoped>
.app-content-heading {
	font-weight: bold;
	display: flex;

	&__loader {
		margin-inline-start: 8px;
	}
}
</style>
