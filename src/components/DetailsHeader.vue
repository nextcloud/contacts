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
import Actions from '@nextcloud/vue/dist/Components/NcActions'

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
// Header with avatar, name, position, actions...
.contact-header {
	display: flex;
	align-items: center;
	padding: 50px 0 20px;

	&__avatar {
		position: relative;
		flex: 0 0 var(--avatar-size);
		margin: 10px;
		margin-left: 0;
		display: flex;
		justify-content: flex-end;
	}

	// ORG-TITLE-NAME
	&__infos {
		display: flex;
		flex: 1 1 auto; // shrink avatar before this one
		flex-direction: column;

		&-title,
		&-subtitle {
			display: flex;
			flex-wrap: wrap;
			margin: 0;
		}
		::v-deep input {
			overflow: hidden;
			flex: 1 1;
			min-width: 100px;
			max-width: 100%;
			margin: 0;
			padding: 0;
			white-space: nowrap;
			text-overflow: ellipsis;
			border: none;
			background: transparent;
			font-size: inherit;
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
		position: relative;
		display: flex;

		&-menu {
			margin-right: 10px;
		}

		> div,
		> a {
			width: 44px;
			height: 44px;
			padding: 14px;
			cursor: pointer;
			opacity: .7;
			border-radius: 22px;
			background-size: 16px;
			&:hover,
			&:focus {
				opacity: 1;
			}
			&.header-icon--pulse {
				width: 16px;
				height: 16px;
				margin: 8px;
			}
		}
	}
}

</style>
