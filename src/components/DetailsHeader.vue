<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<!-- contact header -->
	<header class="contact-header" :style="cssStyle">
		<div class="contact-header__no-wrap">
			<div class="contact-header__avatar">
				<slot name="avatar" :avatar-size="avatarSize" />
			</div>

			<!-- fullname, org, title -->
			<div class="contact-header__infos">
				<h2 class="contact-header__infos-title">
					<slot name="title" />
				</h2>
				<div v-if="$slots.subtitle" class="contact-header__infos-subtitle">
					<slot name="subtitle" />
				</div>
				<div class="contact-header__quick-actions">
					<slot name="quick-actions" />
				</div>
			</div>
		</div>

		<!-- actions -->
		<div class="contact-header__actions">
			<slot name="actions" />

			<!-- menu actions -->
			<Actions ref="actions"
				class="header-menu"
				menu-align="right"
				v-bind="$attrs">
				<slot name="actions-menu" />
			</Actions>
		</div>
	</header>
</template>

<script>
import { NcActions as Actions } from '@nextcloud/vue'

export default {
	name: 'DetailsHeader',

	components: {
		Actions,
	},

	data() {
		return {
			avatarSize: 75,
		}
	},

	computed: {
		cssStyle() {
			return {
				'--avatar-size': this.avatarSize + 'px',
			}
		},
	},
}
</script>

<style lang="scss" scoped>
@import '../css/ContactDetailsLayout';

$top-padding: 50px;

// Header with avatar, name, position, actions...
.contact-header {
	display: flex;
	align-items: center;
	padding: $top-padding 0 20px;
	gap: $contact-details-row-gap;
	&__quick-actions{
			padding: 5px 0;
		}

	@media (max-width: 1024px) {
		// Top padding of 44px is already included in AppContent by default on mobile
		padding-top: calc($top-padding - 44px);
		&__no-wrap {
			width: 100%;
		}
		&__actions .header-menu {
			margin-left: auto;
		}
		&__avatar {
			width: 150px !important;
		}
	}

	&__no-wrap {
		display: flex;
		gap: $contact-details-row-gap;
		align-items: center;
		min-width: 0;
	}

	// AVATAR
	&__avatar {
		// Global single column layout
		display: flex;
		flex: 0 1 auto;
		justify-content: flex-end;
		width: $contact-details-label-max-width;
		min-width: 0; // Has to be zero unless we implement wrapping
	}

	// ORG-TITLE-NAME
	&__infos {
		flex-direction: column;

		// Global single column layout
		display: flex;
		flex: 0 1 auto;
		width: $contact-details-value-max-width;
		min-width: 0; // Has to be zero unless we implement wrapping

		&-title,
		&-subtitle {
			display: flex;
			flex-wrap: wrap;
			margin: 0;
		}

		&__quick-actions {
			padding: 5px 0;
		}

		:deep(input) {
			flex: 1 auto;
		}

		&-title :deep(input) {
			font-weight: bold;
		}

		&-subtitle:placeholder-shown {
			max-width: 20%;
		}
	}

	// ACTIONS
	&__actions {
		display: flex;
		flex: 1 0 auto;
		gap: 5px;
	}
}
</style>
