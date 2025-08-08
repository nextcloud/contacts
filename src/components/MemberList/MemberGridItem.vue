<!--
  - SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="member-grid-item">
		<NcAvatar v-if="isTeam"
			:display-name="member.displayName"
			:is-no-user="true"
			:size="32">
			<template #icon>
				<IconAccountGroupOutline :size="20" />
			</template>
		</NcAvatar>
		<NcAvatar v-else
			:user="member.userId"
			:display-name="member.displayName"
			:size="32" />
		<span class="member-name">{{ member.displayName }}</span>

		<!-- Accept invite -->
		<div v-if="!loading && isPendingApproval && circle.canManageMembers" class="member-grid-item__actions">
			<NcButton :aria-label="t('contacts', 'Accept membership request')" @click="acceptMember">
				<template #icon>
					<IconCheckOutline :size="20" />
				</template>
			</NcButton>
			<NcButton :aria-label="t('contacts', 'Reject membership request')" @click="deleteMember">
				<template #icon>
					<IconCloseOutline :size="20" />
				</template>
			</NcButton>
		</div>

		<NcActions v-else-if="!isTeam">
			<NcActionText v-if="loading" icon="icon-loading-small">
				{{ t('contacts', 'Loading …') }}
			</NcActionText>

			<template v-else>
				<template v-if="canChangeLevel">
					<NcActionText>
						{{ t('contacts', 'Manage level') }}
						<template #icon>
							<IconShieldCheckOutline :size="16" />
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

				<NcActionButton v-if="isCurrentUser && !circle.isOwner" @click="deleteMember">
					{{ t('contacts', 'Leave team') }}
					<template #icon>
						<IconExitToApp :size="16" />
					</template>
				</NcActionButton>
				<NcActionButton v-else-if="canDelete" @click="deleteMember">
					<template #icon>
						<IconDeleteOutline :size="20" />
					</template>
					{{ t('contacts', 'Remove member') }}
				</NcActionButton>
			</template>
		</NcActions>
	</div>
</template>

<script>
import { CIRCLES_MEMBER_LEVELS, MemberLevels, MemberLevel, MemberStatus } from '../../models/constants.ts'
import Circle from '../../models/circle.ts'
import { NcAvatar, NcActions, NcActionButton, NcActionSeparator, NcActionText, NcButton } from '@nextcloud/vue'
import IconAccountGroupOutline from 'vue-material-design-icons/AccountGroupOutline.vue'
import IconCheckOutline from 'vue-material-design-icons/CheckOutline.vue'
import IconCloseOutline from 'vue-material-design-icons/CloseOutline.vue'
import IconDeleteOutline from 'vue-material-design-icons/DeleteOutline.vue'
import IconExitToApp from 'vue-material-design-icons/ExitToApp.vue'
import IconShieldCheckOutline from 'vue-material-design-icons/ShieldCheckOutline.vue'

import { changeMemberLevel } from '../../services/circles.ts'
import { showError, DialogBuilder } from '@nextcloud/dialogs'
import RouterMixin from '../../mixins/RouterMixin.js'

export default {
	name: 'MemberGridItem',
	components: {
		NcAvatar,
		IconAccountGroupOutline,
		NcActions,
		NcActionButton,
		NcActionSeparator,
		NcActionText,
		IconDeleteOutline,
		IconExitToApp,
		IconShieldCheckOutline,
		IconCheckOutline,
		IconCloseOutline,
		NcButton,
	},
	mixins: [RouterMixin],
	props: {
		member: {
			type: Object,
			required: true,
		},
		isTeam: {
			type: Boolean,
			default: false,
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
			const levels = []
			// Can't change level of owner
			if (this.member.level === MemberLevels.OWNER) {
				return levels
			}

			// Can't change level of yourself
			if (this.isCurrentUser) {
				return levels
			}

			// From MODERATOR, you can set ADMIN
			if (this.currentUserLevel >= MemberLevels.MODERATOR && this.member.level !== MemberLevels.ADMIN) {
				levels.push(MemberLevels.ADMIN)
			}

			// From ADMIN, you can set MODERATOR and MEMBER
			if (this.currentUserLevel >= MemberLevels.ADMIN) {
				if (this.member.level !== MemberLevels.MODERATOR) {
					levels.push(MemberLevels.MODERATOR)
				}
				if (this.member.level !== MemberLevels.MEMBER) {
					levels.push(MemberLevels.MEMBER)
				}
			}

			return levels
		},

		/**
		 * Is the current member the current user?
		 *
		 * @return {boolean}
		 */
		isCurrentUser() {
			return this.member.id === this.currentUserId
		},

		/**
		 * Is the current member pending moderator approval?
		 *
		 * @return {boolean}
		 */
		isPendingApproval() {
			return this.member.level === MemberLevels.NONE
				&& this.member.status === MemberStatus.PENDING
		},

		/**
		 * Can the current user change the level of others?
		 *
		 * @return {boolean}
		 */
		canChangeLevel() {
			return this.circle.canManageMembers
				&& this.availableLevelsChange.length > 0
				&& !this.isCurrentUser
		},

		/**
		 * Can the current user delete members or?
		 *
		 * @return {boolean}
		 */
		canDelete() {
			return this.circle.canManageMembers
				&& this.member.level <= this.currentUserLevel
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

			if (this.member.level < level) {
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
					member: this.member,
					leave: this.isCurrentUser,
				})
			} catch (error) {
				if (error?.response?.status === 404) {
					this.logger.debug('Member is not in circle')
					return
				}
				this.logger.error('Could not delete the member', { member: this.member, error })
				showError(t('contacts', 'Could not delete the member {displayName}', this.member))
			} finally {
				this.loading = false
			}
		},

		async changeLevel(level) {
			this.loading = true

			try {
				await changeMemberLevel(this.circle.id, this.member.id, level)
				this.showLevelMenu = false

				// If we changed an owner, let's refresh the whole dataset to update all ownership & memberships
				if (level === MemberLevels.OWNER) {
					await this.$store.dispatch('getCircle', this.circle.id)
					await this.$store.dispatch('getCircleMembers', this.circle.id)
					return
				}

				// this.member is a class. We're modifying the class setter, not the prop itself
				// eslint-disable-next-line vue/no-mutating-props
				this.member.level = level
			} catch (error) {
				this.logger.error('Could not change the member level', { level: CIRCLES_MEMBER_LEVELS[level], error })
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
					memberId: this.member.id,
				})
			} catch (error) {
				this.logger.error('Could not accept membership request', { member: this.member, error })
				showError(t('contacts', 'Could not accept membership request'))
			} finally {
				this.loading = false
			}
		},
	},
}
</script>

<style lang="scss" scoped>
.member-grid-item {
	&__actions {
		display: flex;
		gap: 8px;
	}
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px;
	border-radius: var(--border-radius);
	background-color: var(--color-background-soft);

	.member-name {
		flex-grow: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

}
</style>
