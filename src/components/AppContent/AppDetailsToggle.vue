<!--
  - @copyright Copyright (c) 2021 John Molakvoæ <skjnldsv@protonmail.com>
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
	<a v-tooltip="t('contacts', 'Go back to the list')" class="app-details-toggle icon-confirm" href="#" />
</template>

<script>
export default {
	name: 'AppDetailsToggle',

	beforeMount() {
		this.toggleAppNavigationButton(true)
	},

	beforeDestroy() {
		this.toggleAppNavigationButton(false)
	},

	methods: {
		toggleAppNavigationButton(hide = true) {
			const appNavigationToggle = document.querySelector('.app-navigation .app-navigation-toggle')
			if (appNavigationToggle) {
				appNavigationToggle.style.display = hide ? 'none' : null
			}
		},
	},
}
</script>

<style lang="scss" scoped>
.app-details-toggle {
	position: absolute;
	width: 44px;
	height: 44px;
	padding: 14px;
	cursor: pointer;
	opacity: .6;
	font-size: 16px;
	line-height: 17px;
	transform: rotate(180deg);
	background-color: var(--color-main-background);
	z-index: 2000;

	&:active,
	&:hover,
	&:focus {
		opacity: 1;
	}
}
</style>
