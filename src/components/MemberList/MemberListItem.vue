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
	<ListItemIcon
		:id="source.id"
		:key="source.id"
		:avatar-size="44"
		:is-no-user="!source.isUser"
		:subtitle="levelName"
		:title="source.displayName"
		:user="source.userId">
		<Actions @close="onMenuClose">
			<template v-if="loading">
				<ActionText icon="icon-loading-small">
					{{ t('contacts', 'Loading …') }}
				</ActionText>
			</template>

			<!-- Level picker -->
			<template v-else-if="showLevelMenu">
				<ActionButton @click="toggleLevelMenu">
					{{ t('contacts', 'Back to the menu') }}
					<ArrowLeft slot="icon"
						:size="16"
						decorative />
				</ActionButton>
				<ActionButton
					v-for="level in availableLevelsChange"
					:key="level"
					icon=""
					@click="changeLevel(level)">
					{{ CIRCLES_MEMBER_LEVELS[level] }}
				</ActionButton>
			</template>

			<!-- Normal menu -->
			<template v-else>
				<ActionButton v-if="canChangeLevel" @click="toggleLevelMenu">
					{{ t('contacts', 'Change level') }}
					<ShieldCheck slot="icon"
						:size="16"
						decorative />
				</ActionButton>
				<ActionButton v-if="canDelete" icon="icon-delete" @click="deleteMember">
					{{ deleteMemberName }}
				</ActionButton>
			</template>
		</Actions>
	</ListItemIcon>
</template>

<script>
import { MEMBER_LEVEL_MEMBER, CIRCLES_MEMBER_LEVELS } from '../../models/constants'

import Actions from '@nextcloud/vue/dist/Components/Actions'
import ListItemIcon from '@nextcloud/vue/dist/Components/ListItemIcon'
import ActionButton from '@nextcloud/vue/dist/Components/ActionButton'
import ActionText from '@nextcloud/vue/dist/Components/ActionText'

import ShieldCheck from 'vue-material-design-icons/ShieldCheck'
import ArrowLeft from 'vue-material-design-icons/ArrowLeft'

import RouterMixin from '../../mixins/RouterMixin'
import Member from '../../models/member'
import { showError } from '@nextcloud/dialogs'
import { changeMemberLevel } from '../../services/circles'

export default {
	name: 'MemberListItem',

	components: {
		Actions,
		ActionButton,
		ActionText,
		ArrowLeft,
		ListItemIcon,
		ShieldCheck,
	},
	mixins: [RouterMixin],

	props: {
		source: {
			type: Member,
			required: true,
		},
	},

	data() {
		return {
			CIRCLES_MEMBER_LEVELS,

			loading: false,
			showLevelMenu: false,
		}
	},

	computed: {
		circle() {
			return this.$store.getters.getCircle(this.selectedCircle)
		},

		avatarUrl() {
			if (this.contact.url) {
				return `${this.contact.url}?photo`
			}
			return undefined
		},

		/**
		 * Current member level translated name
		 * @returns {string}
		 */
		levelName() {
			return CIRCLES_MEMBER_LEVELS[this.source.level]
				|| CIRCLES_MEMBER_LEVELS[MEMBER_LEVEL_MEMBER]
		},

		deleteMemberName() {
			return this.isCurrentUser
				? t('contacts', 'Leave this circle')
				: t('contacts', 'Remove member')
		},

		/**
		 * Current user member level
		 * @returns {number}
		 */
		currentUserLevel() {
			return this.circle?.initiator?.level || MEMBER_LEVEL_MEMBER
		},

		/**
		 * Current user member level
		 * @returns {string}
		 */
		currentUserId() {
			return this.circle?.initiator?.id
		},

		/**
		 * Available levels change to the current user
		 * @returns {Array}
		 */
		availableLevelsChange() {
			return Object.keys(CIRCLES_MEMBER_LEVELS).filter(level => level < this.currentUserLevel)
		},

		/**
		 * Is the current member the current user?
		 * @returns {boolean}
		 */
		isCurrentUser() {
			return this.currentUserId === this.source.id
		},

		/**
		 * Can the current user change the level of others?
		 * @returns {boolean}
		 */
		canChangeLevel() {
			// we can change if the member is at the same
			// or lower level as the current user
			return this.availableLevelsChange.length > 0
				&& this.currentUserLevel >= this.source.level
				&& this.circle.canManageMembers
		},

		/**
		 * Can the current user delete members?
		 * @returns {boolean}
		 */
		canDelete() {
			return this.currentUserLevel > MEMBER_LEVEL_MEMBER
				&& this.source.level <= this.currentUserLevel
		},
	},
	methods: {
		toggleLevelMenu() {
			this.showLevelMenu = !this.showLevelMenu
		},

		/**
		 * Delete the current member
		 */
		async deleteMember() {
			this.loading = true

			try {
				await this.$store.dispatch('deleteMemberFromCircle', {
					member: this.source,
					leave: this.isCurrentUser,
				})
			} catch (error) {
				console.error('Could not delete the member', this.source, error)
				showError(t('contacts', 'Could not delete the member {displayName}', this.source))
			} finally {
				this.loading = false
			}
		},

		async changeLevel(level) {
			this.loading = true

			try {
				await changeMemberLevel(this.circle.id, this.source.id, level)
				this.showLevelMenu = false
			} catch (error) {
				console.error('Could not change the member level to', CIRCLES_MEMBER_LEVELS[level])
				showError(t('contacts', 'Could not change the member level to {level}', {
					level: CIRCLES_MEMBER_LEVELS[level],
				}))
			} finally {
				this.loading = false
			}
		},

		/**
		 * Reset menu on close
		 */
		onMenuClose() {
			this.showLevelMenu = false
		},
	},
}
</script>
<style lang="scss">
.member-list__item {
	padding: 8px;
}
</style>
