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
	<span v-if="source.heading" class="members-list__heading">
		{{ source.label }}
	</span>

	<ListItemIcon v-else
		:id="source.singleId"
		:key="source.singleId"
		:avatar-size="44"
		:is-no-user="!source.isUser"
		:subname="levelName"
		:name="source.displayName"
		:user="source.userId"
		class="members-list__item">
		<!-- Accept invite -->
		<template v-if="!loading && isPendingApproval && circle.canManageMembers">
			<Actions>
				<ActionButton @click="acceptMember">
					<template #icon>
						<IconCheck :size="20" />
					</template>
					{{ t('contacts', 'Accept membership request') }}
				</ActionButton>
			</Actions>
			<Actions>
				<ActionButton @click="deleteMember">
					<template #icon>
						<IconClose :size="20" />
					</template>
					{{ t('contacts', 'Reject membership request') }}
				</ActionButton>
			</Actions>
		</template>

		<!-- Level -->
		<template #subname>
			{{ levelName }}
		</template>

		<!-- Accept invite -->
		<template v-if="!loading && isPendingApproval && circle.canManageMembers" #extra-actions>
			<NcButton @click="acceptMember">
				<template #icon>
					<IconCheck :size="20" />
				</template>
				{{ t('contacts', 'Accept membership request') }}
			</NcButton>
			<NcButton @click="deleteMember">
				<template #icon>
					<IconClose :size="20" />
				</template>
				{{ t('contacts', 'Reject membership request') }}
			</NcButton>
		</template>

		<template v-else #actions>
			<NcActionText v-if="loading" icon="icon-loading-small">
				{{ t('contacts', 'Loading …') }}
			</NcActionText>

			<!-- Normal menu -->
			<template v-else>
				<!-- Level picker -->
				<template v-if="canChangeLevel">
					<NcActionText>
						{{ t('contacts', 'Manage level') }}
						<ShieldCheck slot="icon"
							:size="16"
							decorative />
					</ActionText>
					<ActionButton v-for="level in availableLevelsChange"
						:key="level"
						icon=""
						@click="changeLevel(level)">
						{{ levelChangeLabel(level) }}
					</NcActionButton>

					<NcActionSeparator />
				</template>

				<!-- Leave or delete member from circle -->
				<ActionButton v-if="isCurrentUser && !circle.isOwner" @click="deleteMember">
					{{ t('contacts', 'Leave circle') }}
					<ExitToApp slot="icon"
						:size="16"
						decorative />
				</ActionButton>
				<ActionButton v-else-if="canDelete" @click="deleteMember">
					<template #icon>
						<IconDelete :size="20" />
					</template>
					{{ t('contacts', 'Remove member') }}
				</NcActionButton>
			</template>
		</template>
	</NcListItem>
</template>

<script>
import { CIRCLES_MEMBER_LEVELS, MemberLevels, MemberStatus } from '../../models/constants.ts'

import {
	NcAvatar,
	NcListItem,
	NcActionSeparator,
	NcActionButton,
	NcActionText,
} from '@nextcloud/vue'
import IconCheck from 'vue-material-design-icons/Check.vue'
import IconClose from 'vue-material-design-icons/Close.vue'
import IconDelete from 'vue-material-design-icons/Delete.vue'
import IconExitToApp from 'vue-material-design-icons/ExitToApp.vue'
import IconShieldCheck from 'vue-material-design-icons/ShieldCheck.vue'

import { changeMemberLevel } from '../../services/circles.ts'
import { showError } from '@nextcloud/dialogs'
import RouterMixin from '../../mixins/RouterMixin.js'

export default {
	name: 'MemberListItem',

	components: {
		IconCheck,
		IconClose,
		IconDelete,
		IconExitToApp,
		IconShieldCheck,
		NcListItem,
		NcActionButton,
		NcActionSeparator,
		NcActionText,
		NcAvatar,
	},

	mixins: [RouterMixin],

	props: {
		source: {
			type: Object,
			required: true,
		},
	},

	data() {
		return {
			loading: false,
		}
	},

	computed: {
		/**
		 * Return the current circle
		 *
		 * @return {Circle}
		 */
		circle() {
			return this.$store.getters.getCircle(this.selectedCircle)
		},

		/**
		 * Current member level translated name
		 *
		 * @return {string}
		 */
		levelName() {
			if (this.source.level === MemberLevels.NONE) {
				return t('contacts', 'Pending')
			}

			return CIRCLES_MEMBER_LEVELS[this.source.level]
				|| CIRCLES_MEMBER_LEVELS[MemberLevels.MEMBER]
		},

		/**
		 * Current user member level
		 *
		 * @return {number}
		 */
		currentUserLevel() {
			return this.circle?.initiator?.level || MemberLevels.MEMBER
		},

		/**
		 * Current user member level
		 *
		 * @return {string}
		 */
		currentUserId() {
			return this.circle?.initiator?.singleId
		},

		/**
		 * Available levels change to the current user
		 *
		 * @return {Array}
		 */
		availableLevelsChange() {
			const levels = Object.keys(CIRCLES_MEMBER_LEVELS)
				// Object.keys returns those as string
				.map(level => parseInt(level, 10))
				// we cannot set to a level higher or equal than the current user's level
				.filter(level => level < this.currentUserLevel)

			// Admins can promote others as Admin too
			if (this.currentUserLevel === MemberLevels.ADMIN) {
				levels.push(MemberLevels.ADMIN)
			}

			// Owners transfer ownership to another member
			if (this.circle.isOwner) {
				levels.push(MemberLevels.OWNER)
			}

			// we cannot set to the level this member is already
			return levels.filter(level => level !== this.source.level)
		},

		/**
		 * Is the current member the current user?
		 *
		 * @return {boolean}
		 */
		isCurrentUser() {
			return this.currentUserId === this.source.singleId
		},

		/**
		 * Is the current member pending moderator approval?
		 *
		 * @return {boolean}
		 */
		isPendingApproval() {
			return this.source?.level === MemberLevels.NONE
				&& this.source?.status === MemberStatus.REQUESTING
		},

		/**
		 * Can the current user change the level of others?
		 *
		 * @return {boolean}
		 */
		canChangeLevel() {
			// we can change if the member is at the same
			// or lower level as the current user
			// BUT not an owner as there can/must always be one
			return this.source.level > MemberLevels.NONE
				&& this.availableLevelsChange.length > 0
				&& this.currentUserLevel >= this.source.level
				&& this.circle.canManageMembers
				&& !(this.circle.isOwner && this.isCurrentUser)
		},

		/**
		 * Can the current user delete members or?
		 *
		 * @return {boolean}
		 */
		canDelete() {
			return this.circle.canManageMembers
				&& this.source.level <= this.currentUserLevel
				&& !this.isCurrentUser
		},
	},
	methods: {
		/**
		 * Return the promote/demote member action label
		 *
		 * @param {MemberLevel} level the member level
		 * @return {string}
		 */
		levelChangeLabel(level) {
			if (level === MemberLevels.OWNER) {
				return t('contacts', 'Promote as sole owner')
			}

			if (this.source.level < level) {
				return t('contacts', 'Promote to {level}', { level: CIRCLES_MEMBER_LEVELS[level] })
			}
			return t('contacts', 'Demote to {level}', { level: CIRCLES_MEMBER_LEVELS[level] })
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
				if (error?.response?.status === 404) {
					this.logger.debug('Member is not in circle')
					return
				}
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

				// If we changed an owner, let's refresh the whole dataset to update all ownership & memberships
				if (level === MemberLevels.OWNER) {
					await this.$store.dispatch('getCircle', this.circle.id)
					await this.$store.dispatch('getCircleMembers', this.circle.id)
					return
				}

				// this.source is a class. We're modifying the class setter, not the prop itself
				// eslint-disable-next-line vue/no-mutating-props
				this.source.level = level
			} catch (error) {
				console.error('Could not change the member level to', CIRCLES_MEMBER_LEVELS[level])
				showError(t('contacts', 'Could not change the member level to {level}', {
					level: CIRCLES_MEMBER_LEVELS[level],
				}))
			} finally {
				this.loading = false
			}
		},

		async acceptMember() {
			this.loading = true

			try {
				await await this.$store.dispatch('acceptCircleMember', {
					circleId: this.circle.id,
					memberId: this.source.id,
				})
			} catch (error) {
				console.error('Could not accept membership request', this.source, error)
				showError(t('contacts', 'Could not accept membership request'))
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
.members-list__heading {
	display: flex;
	overflow: hidden;
	flex-shrink: 0;
	order: 1;
	padding-top: 22px;
	padding-left: 8px;
	user-select: none;
	white-space: nowrap;
	text-overflow: ellipsis;
	pointer-events: none;
	color: var(--color-primary-element);
	line-height: 22px;
}

<style lang="scss">
.members-list-item {
	user-select: none;

	&:focus,
	&:hover {
		background-color: var(--color-background-hover);
	}
}
</style>
