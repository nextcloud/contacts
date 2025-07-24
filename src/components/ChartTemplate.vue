<!--
  - SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<div class="org-chart-node">
		<div class="inner-box">
			<router-link :to="{
				name: 'contact',
				params: {
					selectedGroup: selectedChart,
					selectedContact: chartData.key,
				},
			}">
				<Avatar :disable-tooltip="true"
					:display-name="chartData.fullName"
					:is-no-user="true"
					:size="60"
					:url="chartData.photoUrl"
					class="org-chart-node__avatar" />
			</router-link>
			<div class="panel" />
			<div class="main-container">
				<h3 class="fullName">
					{{ chartData.fullName }}
				</h3>
				<h4 class="title">
					{{ chartData.title }}
				</h4>
			</div>
			<div class="description">
				<p v-if="chartData._directSubordinates">
					{{ t('contacts', 'Manages') }}: {{ chartData._directSubordinates }}
				</p>
				<p v-if="chartData._totalSubordinates">
					{{ t('contacts', 'Oversees') }}: {{ chartData._totalSubordinates }}
				</p>
			</div>
		</div>
	</div>
</template>

<script>
import { NcAvatar as Avatar } from '@nextcloud/vue'

export default {
	name: 'ChartTemplate',
	components: {
		Avatar,
	},
	props: {
		chartData: {
			type: Object,
			default: () => {},
		},
		onAvatarClick: {
			type: Function,
			default: () => {},
		},
	},
	computed: {
		selectedChart() {
			return this.$route.params.selectedChart
		},
	},
}
</script>

<style lang="scss" scoped>
.org-chart-node {
	background-color: var(--color-main-background);
	height: 175px;
	border-radius: var(--border-radius-large);
	overflow: visible;

	&__avatar {
		margin-top: -30px;
		border: 1px solid var(--color-border);
	}

	.inner-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		height: 175px;
		padding-top: 0;
		margin-top: 30px;
		border: 1px solid var(--color-border);
		border-radius: var(--border-radius-large);
		background-color: var(--color-main-background);

		.main-container {
			padding: 20px;
			text-align: center;
			flex: 1;

			.fullName {
				color: var(--color-primary-element);
				font-weight: bold;
			}

			.title {
				margin-top: 4px;
			}
		}

		.description {
			display: flex;
			justify-content: space-between;
			width: 100%;
			padding: 15px;
		}
	}

	.inner-box-highlight {
		border: 2px solid var(--color-primary-element) !important;
	}

	.panel {
		width: 100%;
		margin: -34px -1px 0 -1px;
		background-color: var(--color-primary-element);
		height: 15px;
		border-start-start-radius: var(--border-radius-large);
		border-start-end-radius: var(--border-radius-large);
	}
}
</style>
