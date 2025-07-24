<!--
  - SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="circle-details-container">
		<div class="circle-details-grid" :class="{ 'is-editing': isEditing }">
			<div class="circle-details__header-wrapper">
				<div class="circle-details-grid__avatar">
					<Avatar :disable-tooltip="true"
						:display-name="circle.displayName"
						:is-no-user="true"
						:size="75" />
				</div>
				<div class="circle-details__header">
					<div class="circle-name-wrapper">
						<h2 v-if="!isEditing" class="circle-name">
							<span :title="circle.displayName">{{ circle.displayName }}</span>
							<NcLoading v-if="loadingName" :size="24" />
						</h2>
						<NcTextField v-else
							v-model="circle.displayName"
							:placeholder="t('contacts', 'Team name')"
							label="Team name" />
					</div>
					<div v-if="!isEditing" class="subtitle">
						<span>{{ t('files', 'Team owner') }}</span> <UserBubble :user="circle.owner.userId"
							:display-name="circle.isOwner ? 'you': circle.owner.displayName" />
					</div>
					<div v-if="showDescription" class="circle-description-wrapper">
						<div v-if="!isEditing" class="circle-description">
							{{ circle.description }}
						</div>
						<NcTextArea v-else
							v-model="circle.description"
							:placeholder="descriptionPlaceholder"
							label="Description"
							:maxlength="1024" />
					</div>
					<div class="actions">
						<template v-if="!isEditing">
							<Button v-if="canManageTeam" variant="primary" @click="startEditing">
								<template #icon>
									<PencilIcon :size="20" />
								</template>
								{{ t('contacts', 'Edit') }}
							</Button>
							<Button variant="secondary"
								:href="circleUrl"
								@click.stop.prevent="copyToClipboard(circleUrl)">
								<template #icon>
									<CopyIcon :size="20" />
								</template>
								{{ t('contacts', 'Copy link') }}
							</Button>

							<!-- Team settings popover -->
							<NcPopover v-if="canManageTeam"
								:shown="isSettingsPopoverShown"
								popup-role="dialog"
								@update:shown="isSettingsPopoverShown = $event">
								<template #trigger>
									<Button @click="isSettingsPopoverShown = true">
										<template #icon>
											<CogIcon :size="20" />
										</template>
									</Button>
								</template>
								<CircleSettings :circle="circle" @leave="onLeave" @delete="onDelete" />
							</NcPopover>
						</template>
						<template v-else>
							<Button variant="secondary" @click="cancelEditing">
								{{ t('contacts', 'Cancel') }}
							</Button>
							<Button variant="primary" @click="saveChanges">
								{{ t('contacts', 'Save') }}
							</Button>
						</template>
						<Button v-if="!circle.isPendingMember && !circle.isMember && circle.canJoin"
							:disabled="loadingJoin"
							class="primary"
							@click="joinCircle">
							<template #icon>
								<LoginIcon :size="16" />
							</template>
							{{ t('contacts', 'Request to join') }}
						</Button>

						<!-- Leave team button -->
						<Button v-if="circle.isMember && circle.canLeave"
							:disabled="loadingLeave"
							variant="warning"
							@click="confirmLeaveCircle">
							<template #icon>
								<LogoutIcon :size="16" />
							</template>
							{{ t('contacts', 'Leave team') }}
						</Button>
					</div>
				</div>
			</div>

			<!-- Main content now a direct child of the grid -->
			<div class="circle-details__main-content">
				<!-- not a member -->
				<template v-if="!circle.isMember">
					<!-- Pending request validation -->
					<NcEmptyContent v-if="circle.isPendingMember"
						:name="t('contacts', 'Your request to join this team is pending approval')">
						<template #icon>
							<NcLoadingIcon :size="20" />
						</template>
					</NcEmptyContent>

					<NcEmptyContent v-else
						:name="t('contacts', 'You are not a member of {circle}', { circle: circle.displayName})">
						<template #icon>
							<IconAccountGroup :size="20" />
						</template>
					</NcEmptyContent>
				</template>

				<section v-else>
					<div v-for="(group, providerId) in groupedResources" :key="providerId" class="circle-details-section">
						<div class="section-header">
							<ContentHeading>{{ group.name }}</ContentHeading>
						</div>
						<ul class="item-list">
							<ListItem v-for="resource in group.resources"
								:key="resource.id"
								:href="resource.link"
								:name="resource.label">
								<template #icon>
									<!-- eslint-disable-next-line vue/no-v-html -->
									<div v-if="resource.iconSvg" class="resource__icon" v-html="resource.iconSvg" />
									<img v-else-if="resource.iconURL" :src="resource.iconURL" class="resource__icon">
									<FileDocumentOutline v-else :size="20" />
								</template>
							</ListItem>
						</ul>
					</div>

					<!-- Members Section -->
					<div class="circle-details-section">
						<div class="member-section-layout">
							<div class="section-header">
								<ContentHeading>{{ t('contacts', 'Members') }}</ContentHeading>
								<Button v-if="circle.canManageMembers" variant="tertiary" @click="addMembers">
									<template #icon>
										<AccountPlusIcon :size="20" />
									</template>
									{{ t('contacts', 'Add') }}
								</Button>
							</div>
							<MemberList ref="memberList" :list="members" />
						</div>
					</div>
				</section>
			</div>
		</div>
	</div>
</template>

<script>
import { ref } from 'vue'
import { useElementSize } from '@vueuse/core'
import { generateOcsUrl } from '@nextcloud/router'
import { showError } from '@nextcloud/dialogs'
import axios from '@nextcloud/axios'

import {
	NcAvatar as Avatar,
	NcButton as Button,
	NcEmptyContent,
	NcListItem as ListItem,
	NcLoadingIcon,
	NcPopover,
	NcUserBubble as UserBubble,
	NcTextField,
	NcTextArea,
} from '@nextcloud/vue'

import CogIcon from 'vue-material-design-icons/CogOutline.vue'
import CopyIcon from 'vue-material-design-icons/ContentCopy.vue'
import LoginIcon from 'vue-material-design-icons/Login.vue'
import LogoutIcon from 'vue-material-design-icons/Logout.vue'
import AccountPlusIcon from 'vue-material-design-icons/AccountPlusOutline.vue'
import PencilIcon from 'vue-material-design-icons/PencilOutline.vue'
import IconAccountGroup from 'vue-material-design-icons/AccountGroupOutline.vue'
import FileDocumentOutline from 'vue-material-design-icons/FileDocumentOutline.vue'
import { CircleEdit, editCircle } from '../services/circles.ts'
import CircleActionsMixin from '../mixins/CircleActionsMixin'
import CircleSettings from './CircleDetails/CircleSettings.vue'
import MemberList from './MemberList/MemberList.vue'
import ContentHeading from './CircleDetails/ContentHeading.vue'

export default {
	name: 'CircleDetails',

	components: {
		AccountPlusIcon,
		Avatar,
		Button,
		ContentHeading,
		ListItem,
		CogIcon,
		CopyIcon,
		IconAccountGroup,
		FileDocumentOutline,
		LoginIcon,
		LogoutIcon,
		MemberList,
		CircleSettings,
		NcEmptyContent,
		NcLoadingIcon,
		NcPopover,
		PencilIcon,

		UserBubble,
		NcTextField,
		NcTextArea,
	},

	mixins: [CircleActionsMixin],

	setup() {
		const avatarList = ref()
		const { width } = useElementSize(avatarList)
		return { avatarList, width }
	},

	data() {
		return {
			active: false,
			isEditing: false,
			showMembersModal: false,
			loading: false,
			loadingJoin: false,
			loadingLeave: false,
			loadingName: false,
			loadingDescription: false,
			isSettingsPopoverShown: false,

			resources: [],
			originalDisplayName: '',
			originalDescription: '',
		}
	},

	computed: {
		descriptionPlaceholder() {
			if (this.circle.description.trim() === '') {
				return t('contacts', 'There is no description for this team')
			}
			return t('contacts', 'Enter a description for the team')
		},

		isEmptyDescription() {
			return this.circle.description.trim() === ''
		},

		showDescription() {
			if (this.circle.isOwner) {
				return true
			}
			return !this.isEmptyDescription
		},

		members() {
			return Object.values(this.$store.getters.getCircle(this.circle.id)?.members || [])
		},

		circleUrl() {
			return window.location.href
		},

		canManageTeam() {
			return (this.circle.isOwner || this.circle.isAdmin) && !this.circle.isPersonal
		},

		maxMembers() {
			// How many avatars (default-clickable-area + 12px gap) fit?
			const avatarWidth = parseInt(window.getComputedStyle(document.body).getPropertyValue('--default-clickable-area')) + 12
			const maxMembers = Math.floor(this.width / avatarWidth)
			return (this.members.length > maxMembers)
				? maxMembers - 1
				: maxMembers
		},

		memberLimit() {
			return Math.min(this.members.length, this.maxMembers)
		},

		membersLimited() {
			return this.members.slice(0, this.memberLimit)
		},

		hasExtraMembers() {
			return this.members.length > this.maxMembers
		},

		groupedResources() {
			return this.resources.reduce((acc, resource) => {
				const providerId = resource.provider.id
				if (!acc[providerId]) {
					acc[providerId] = {
						name: resource.provider.name,
						resources: [],
					}
				}
				acc[providerId].resources.push(resource)
				return acc
			}, {})
		},

		resourcesForProvider() {
			return (providerId) => {
				return this.resources?.filter(res => res.provider.id === providerId) ?? []
			}
		},
	},

	watch: {
		'circle.id': {
			handler() {
				this.fetchTeamResources()
			},
			immediate: true,
		},
	},

	methods: {
		addMembers() {
			this.$refs.memberList.onShowPicker(this.circle.id)
		},
		onLeave() {
			this.isSettingsPopoverShown = false
			this.confirmLeaveCircle()
		},
		onDelete() {
			this.isSettingsPopoverShown = false
			this.confirmDeleteCircle()
		},
		startEditing() {
			this.originalDisplayName = this.circle.displayName
			this.originalDescription = this.circle.description
			this.isEditing = true
		},

		cancelEditing() {
			this.circle.displayName = this.originalDisplayName
			this.circle.description = this.originalDescription
			this.isEditing = false
		},

		async fetchTeamResources() {
			const response = await axios.get(generateOcsUrl(`/teams/${this.circle.id}/resources`))
			this.resources = response.data.ocs.data.resources
			console.debug('Team resources', this.resources)
		},
		/**
		 * Autocomplete @mentions on the description
		 *
		 * @param {string} search the search term
		 * @param {Function} callback callback to be called with results array
		 */
		onAutocomplete(search, callback) {
			// TODO: implement autocompletion. Disabled for now
			// eslint-disable-next-line n/no-callback-literal
			callback([])
		},

		async saveChanges() {
			const errors = []

			// Save name and description sequentially to avoid race conditions
			// Save name if changed
			if (this.circle.displayName !== this.originalDisplayName) {
				this.loadingName = true
				try {
					await editCircle(this.circle.id, CircleEdit.Name, this.circle.displayName)
					this.originalDisplayName = this.circle.displayName
				} catch (error) {
					console.error('Unable to edit name', this.circle.displayName, error)
					errors.push('name')
					this.circle.displayName = this.originalDisplayName
				} finally {
					this.loadingName = false
				}
			}

			// Save description if changed
			if (this.circle.description !== this.originalDescription) {
				this.loadingDescription = true
				try {
					await editCircle(this.circle.id, CircleEdit.Description, this.circle.description)
					this.originalDescription = this.circle.description
				} catch (error) {
					console.error('Unable to edit team description', this.circle.description, error)
					errors.push('description')
					this.circle.description = this.originalDescription
				} finally {
					this.loadingDescription = false
				}
			}

			// Show error if any saves failed
			if (errors.length > 0) {
				const errorFields = errors.join(' and ')
				showError(t('contacts', 'An error happened while saving {fields}', { fields: errorFields }))
				return
			}

			// Only exit editing mode if all saves succeeded
			this.isEditing = false
		},
	},
}
</script>

<style lang="scss" scoped>
.circle-details-container {
	padding-inline: 20px;
	margin-top: 1rem;

	.circle-details-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 36px;
		max-width: 800px;
		margin-inline: auto;

		&.is-editing {
			.circle-name-wrapper,
			.circle-description-wrapper {
				width: 100%;
			}
		}

		.circle-details__header-wrapper {
			display: grid;
			grid-template-columns: auto 1fr;
			align-items: center;
			gap: 24px;
		}

		.circle-details__main-content {
			margin-inline-start: 99px;

			@media (max-width: 768px) {
				margin-inline-start: 0;
			}
		}
	}

	.circle-details__header {
		background-color: transparent;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 2px;
		width: 100%;

		.circle-description-wrapper {
			margin-bottom: 4px;
		}

		.circle-name {
			font-size: 1.5rem;
			font-weight: bold;
			margin: 0;
			margin-bottom: 2px;
		}

		.subtitle {
			color: var(--color-text-maxcontrast);
		}

		.actions {
			display: flex;
			gap: 8px;
		}
	}

	.circle-details-section {
		margin-bottom: 2rem;
		max-width: 500px;

		.member-section-layout {
			display: inline-block;
			width: 100%;
			max-width: 500px; // Adjust this value to match the grid width if necessary
		}

		.section-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			width: 100%;
			margin-bottom: 4px;

			:deep(h2),
			:deep(h3) {
				line-height: 2px;
				margin: 4px 0 8px 0;
			}
		}

		.item-list {
			list-style: none;
			padding: 0;
			margin: 0;
			display: flex;
			flex-direction: column;
			gap: 2px;
			max-height: 300px;
			overflow-y: auto;

			// Remove left padding added in ListItem (external component)
			:deep(.list-item__wrapper) {
				padding-inline-start: 0;
			}

			.resource {
				&__icon {
					width: 44px;
					height: 44px;
					display: flex;
					align-items: center;
					justify-content: center;
					text-align: center;
					svg {
						width: 20px;
						height: 20px;
					}
					img {
						border-radius: var(--border-radius-pill);
						overflow: hidden;
						width: 32px;
						height: 32px;
					}
				}
			}
		}

		.avatar-list {
			display: flex;
			flex-wrap: wrap;
			flex-grow: 1;
			gap: 12px;
		}

		:deep(.app-content-list) {
			max-width: 100%;
			border: 0;
		}
	}
}

</style>
