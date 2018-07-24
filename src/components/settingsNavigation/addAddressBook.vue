<!--
  - @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
  -
  - @author John Molakvoæ <skjnldsv@protonmail.com> Team Popcorn <teampopcornberlin.gmail.com>
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
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  - GNU Affero General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with this program. If not, see <http://www.gnu.org/licenses/>.
  -
-->

<template>
	<li class="newAddressBookContainer">
		<form name="newAddressBookForm" class="ng-pristine ng-invalid ng-invalid-required ng-valid-pattern ng-valid-minlength" @submit="createAddressBook()">
			<input id="newList" placeholder="Address book name" class="newAddressBookInput ng-pristine ng-untouched ng-empty ng-invalid ng-invalid-required ng-valid-pattern ng-valid-minlength"
				type="text"
				ng-minlength="1"
				autocomplete="off" autocorrect="off"
				spellcheck="false"
				tooltip-enable="!newAddressBookForm.$pristine"
				required=""
				ng-pattern="/^[a-zA-Z0-9À-ÿ\s-_.!?#|()]+$/i"
				tooltip-is-open="newAddressBookForm.$invalid &amp;&amp; !newAddressBookForm.$error.required"
				tooltip-trigger="none"
				tooltip-placement="top"
				uib-tooltip="Only these special characters are allowed: -_.!?#|()">
			<input type="submit" value="" class="newAddressBookSubmit inline-button icon-confirm action pull-right">
		</form>
	</li>
</template>

<script>
import clickOutside from 'vue-click-outside'

export default {
	components: {
		clickOutside
	},
	directives: {
		clickOutside
	},
	props: {
		addressbook: {
			type: Object,
			default() {
				return {}
			}
		}
	},
	data() {
		return {
		}
	},
	computed: {
		menu() {
			return []
		}
	},
	methods: {
	}
}
</script>
