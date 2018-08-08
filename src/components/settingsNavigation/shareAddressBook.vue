<!--
  - @copyright Copyright (c) 2018 Team Popcorn <teampopcornberlin@gmail.com>
  -
  - @author Team Popcorn <teampopcornberlin@gmail.com>
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
	<div class="addressbook__shares">
		<!-- <i v-if="loadingSharees" class="glyphicon glyphicon-refresh" /> -->
		<input
			v-model="groupOrUser"
			type="text"
			class="addressbook__shares__input"
			placeholder="Share with users or groups"
			aria-autocomplete="list"
			aria-expanded="false"
			aria-owns="typeahead-52-3115"
			@keyup="checkInput"
		>
		<!-- list of possible groups to share with -->
		<ul v-if="sharee" class="dropdown-menu">
			<li class="active">
				<a href="" tabindex="-1" title="admin (group)">
					<strong>{{ groupOrUser }}</strong>
					<span v-if="group"> {{ possibleGroup }} </span>
					<span v-if="user"> {{ possibleUser }} </span>
				</a>
			</li>
		</ul>
		<!-- list of user or groups addressbook is shared with -->
		<ul v-if="addressbook.shares.length > 0" class="addressbook__shares__list">
			<sharee v-for="sharee in addressbook.shares" :key="sharee.name" :sharee="sharee" />
		</ul>
	</div>
</template>

<script>
import clickOutside from 'vue-click-outside'
import Sharee from './sharee'

export default {
	components: {
		clickOutside,
		Sharee
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
			sharee: false,
			groupOrUser: '',
			group: false,
			user: false,
			possibleUser: '(user)',
			possibleGroup: '(group)'
		}
	},
	methods: {
		// started on Monday 6 Aug still needs to check users & groups and add in the auto suggestion, also watch styling if name of user or group is very long!!
		checkInput() {
			if (this.groupOrUser.length > 0) {
				this.sharee = true
				this.group = true
				return
			}
			this.sharee = false
			this.user = false
			this.user = false
		}
		/* // started on Monday 6 Aug still needs to check users & groups and add in the auto suggestion, also watch styling if name of user or group is very long!!
		findMatches(nameToMatch, listToMatch) {
			return listToMatch.filter(name => {
				// if ind if name is within the existing users
				const regex = new RegExp(nameToMatch, 'gi')
				return name.match(regex)
			})
		},

		displayMatches() {
			const matchArray = []
			matchArray = this.findMatches(this.groupOrUser, this.usersList)
			for (let k = 0; k < matchArray.length; k++) {
				this.possibleUsersOrGroups += this.groupOrUser + ' ' + matchArray[k] + ' (user)'
			}
			console.log(this.possibleUsersOrGroups) // eslint-disable-line
		},
		checkInput() {
			if (this.groupOrUser.length > 0) {
				for (let i = 0; i < this.groupsList.length; i++) {
					if (this.groupsList[i].includes(this.groupOrUser)) {
						this.sharee = true
						this.group = true
						return
					}
				}
				for (let j = 0; j < this.usersList.length; j++) {
					if (this.userList[j].includes(this.groupOrUser)) {
						this.sharee = true
						this.user = true
						return
					}
				}
			}
			this.sharee = false
			this.user = false
			this.user = false
		} */
	}
}
</script>
