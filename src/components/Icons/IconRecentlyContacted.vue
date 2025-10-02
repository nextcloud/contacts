<!--
  - SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<span
		:aria-hidden="!title"
		:aria-label="title"
		class="material-design-icon icon-recently-contacted"
		role="img">
		<svg
			:fill="fillColor"
			class="material-design-icon__svg"
			:width="size"
			:height="size"
			viewBox="0 0 16 16">
			<path d="M0 0h24v24H0V0z" fill="none" />
			<path d="M14 3v10h1V3zM12 13h1V3h-1zM1.7 3a.7.7 0 00-.7.7v8.6c0 .4.3.7.7.7h8.6c.4 0 .7-.3.7-.7V3.7a.7.7 0 00-.7-.7zM6 5a1.6 1.6 0 010 3.2A1.6 1.6 0 016 5zm0 4.4c1 0 3.2.6 3.2 1.6v.6H2.8V11c0-1 2.1-1.6 3.2-1.6z" />
		</svg>
	</span>
</template>

<script>
export default {
	name: 'IconRecentlyContacted',
	props: {
		title: {
			type: String,
			default: '',
		},

		size: {
			type: Number,
			default: 20,
		},

		fillColor: {
			type: String,
			default: 'currentColor',
		},
	},
}
</script>
