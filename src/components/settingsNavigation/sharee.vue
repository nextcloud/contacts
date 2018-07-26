<!--
	- @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
	-
	- @author John Molakvoæ <skjnldsv@protonmail.com>
	- @author Team Popcorn <teampopcornberlin.gmail.com>
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
	<li ng-repeat="groupShare in ctrl.addressBook.sharedWith.groups" class="calendar-share-item ng-scope">
		<span class="icon icon-group" />
		<span class="shareeIdentifier ng-binding">{{ sharee }}</span>
		<span class="utils">
			<input
				id="checkbox_sharedWithGroup__71"
				class="checkbox ng-pristine ng-untouched ng-valid ng-empty"
				name="editable"
				type="checkbox"
				ng-model="groupShare.writable" value="edit"
				ng-change="ctrl.updateExistingGroupShare(groupShare.id, groupShare.writable)">
			<label for="checkbox_sharedWithGroup__71"
				class="ng-binding inline"> can edit</label>
			<span
				class="action">
				<span href="#" data-id="" title="Delete"
					class="icon icon-delete"
					ng-click="ctrl.unshareFromGroup(groupShare.id)" />
			</span>
		</span>
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
		sharee: {
			type: String,
			required: true
		}
	}
}
</script>
