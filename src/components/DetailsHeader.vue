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
import Actions from '@nextcloud/vue/dist/Components/NcActions.js'

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

// Header with avatar, name, position, actions...
.contact-header {
	display: flex;
	align-items: center;
	padding: 50px 0 20px;
	gap: $contact-details-row-gap;

	// AVATAR
	&__avatar {
		display: flex;
		flex: 1 auto;
		justify-content: flex-end;

		// Global single column layout
		width: $contact-details-label-width;
		min-width: $contact-details-label-min-width;
		max-width: $contact-details-label-max-width;
	}

	// ORG-TITLE-NAME
	&__infos {
		display: flex;
		flex: 1 auto;
		flex-direction: column;

		// Global single column layout
		width: $contact-details-value-width;
		min-width: $contact-details-value-min-width;
		max-width: $contact-details-value-max-width;

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
}
</style>
