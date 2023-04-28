<!--
  - @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
  -
  - @author John Molakvoæ <skjnldsv@protonmail.com>
  - @author Richard Steinmetz <richard@steinmetz.cloud>
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
@import '../../css/ContactDetailsLayout.scss';

$top-padding: 50px;

// Header with avatar, name, position, actions...
.contact-header {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	padding: $top-padding 0 20px;
	gap: $contact-details-row-gap;

	// Top padding of 44px is already included in AppContent by default on mobile
	@media (max-width: 1024px) {
		padding-top: calc($top-padding - 44px);
	}

	&__no-wrap {
		display: flex;
		flex: 9999 1 auto;
		gap: $contact-details-row-gap;
		align-items: center;

		// Wrap actions to next line before shrinking
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
		width: calc($contact-details-value-max-width + $contact-details-row-gap + 44px);
		min-width: 0; // Has to be zero unless we implement wrapping

		&-title,
		&-subtitle {
			display: flex;
			flex-wrap: wrap;
			margin: 0;
		}

		::v-deep input {
			flex: 1 auto;
		}

		&-title ::v-deep input {
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
		justify-content: space-between;
	}
}
</style>
