<!--
  - SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<NcListItem compact
		:name="source.displayName"
		class="members-list-item">
		<template #icon>
			<NcAvatar disable-menu
				:size="avatarSize"
				:display-name="source.displayName"
				:is-no-user="!source.isUser" />
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
						<template #icon>
							<IconShieldCheck :size="16" />
						</template>
					</NcActionText>
					<NcActionButton v-for="level in availableLevelsChange"
						:key="level"
						icon=""
						@click="changeLevel(level)">
						{{ levelChangeLabel(level) }}
					</NcActionButton>

					<NcActionSeparator />
				</template>

				<!-- Leave or delete member from circle -->
				<NcActionButton v-if="isCurrentUser && !circle.isOwner" @click="deleteMember">
					{{ t('contacts', 'Leave team') }}
					<template #icon>
						<IconExitToApp :size="16" />
					</template>
				</NcActionButton>
				<NcActionButton v-else-if="canDelete" @click="deleteMember">
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
import { showError, DialogBuilder } from '@nextcloud/dialogs'
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

		avatarSize() {
			return parseInt(window.getComputedStyle(document.body).getPropertyValue('--default-clickable-area'))
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
			if (this.isCurrentUser) {
				try {
					const dialog = new DialogBuilder()
						.setName(t('contacts', 'Leave team'))
						.setText(t('contacts', 'Are you sure you want to leave this team? This action cannot be undone.'))
						.setButtons([
							{
								label: t('contacts', 'Cancel'),
								type: 'secondary',
								callback: () => { /* do nothing, just close */ },
							},
							{
								label: t('contacts', 'Leave team'),
								type: 'error',
								callback: async () => {
									try {
										await this.doDeleteMember()
									} catch (e) {
										this.logger.error('Error in delete member callback', { e })
										showError(t('contacts', 'Leave team failed.'))
									}
								},
							},
						])
						.build()

					await dialog.show()
				} catch (error) {
					// User cancelled the dialog - no action needed
				}
			} else {
				await this.doDeleteMember()
			}
		},

		async doDeleteMember() {
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
.members-list-item {
	user-select: none;
	box-sizing: border-box;
	page-break-inside: avoid;
}
</style>
