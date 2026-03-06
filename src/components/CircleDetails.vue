<!--
  - SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="circle-details-container">
		<div class="circle-details-grid">
			<div class="circle-details__header-wrapper">
				<div class="circle-details-grid__avatar">
					<Avatar
						:disable-tooltip="true"
						:display-name="circle.displayName"
						:is-no-user="true"
						:size="75" />
				</div>
				<div class="circle-details__header">
					<div class="circle-name-wrapper">
						<h2 class="circle-name">
							<span :title="circle.displayName">{{ circle.displayName }}</span>
						</h2>
					</div>
					<div class="subtitle">
						<span>{{ t('files', 'Team owner') }}</span> <UserBubble
							:user="circle.owner.userId"
							:display-name="circle.isOwner ? 'you' : circle.owner.displayName" />
					</div>
					<div v-if="showDescription" class="circle-description-wrapper">
						<div class="circle-description">
							{{ circle.description }}
						</div>
					</div>
					<div class="actions">
						<NcButton
							variant="secondary"
							:href="circleUrl"
							@click.stop.prevent="copyToClipboard(circleUrl)">
							<template #icon>
								<CopyIcon :size="20" />
							</template>
							{{ t('contacts', 'Copy link') }}
						</NcButton>

						<!-- Team settings modal -->
						<NcButton v-if="canManageTeam" @click="showSettings = true">
							<template #icon>
								<CogIcon :size="20" />
							</template>
						</NcButton>

						<NcButton
							v-if="!circle.isPendingMember && !circle.isMember && circle.canJoin"
							:disabled="loadingJoin"
							class="primary"
							@click="joinCircle">
							<template #icon>
								<LoginIcon :size="16" />
							</template>
							{{ t('contacts', 'Request to join') }}
						</NcButton>

						<!-- Leave team Ncbutton -->
						<NcButton
							v-if="circle.isMember && circle.canLeave"
							:disabled="loadingLeave"
							variant="warning"
							@click="confirmLeaveCircle">
							<template #icon>
								<LogoutIcon :size="16" />
							</template>
							{{ t('contacts', 'Leave team') }}
						</NcButton>
					</div>

					<CircleSettings v-model:open="showSettings" :circle="circle" />

					<!-- Team resource creation shortcuts -->
					<div v-if="circle.isMember" class="resource-shortcuts">
						<h3 class="resource-shortcuts__title">
							{{ t('contacts', 'Create') }}
						</h3>
						<div class="resource-shortcuts__buttons">
							<template v-for="resourceType in resourceTypes" :key="resourceType.id">
								<!-- Show success button for calendar if notification is active -->
								<NcButton
									v-if="resourceType.id === 'calendar' && showCalendarSuccessNotification"
									variant="success"
									@click="openCalendarApp">
									<template #icon>
										<CheckIcon :size="20" />
									</template>
									{{ t('contacts', 'Show in Calendar') }}
								</NcButton>
								<!-- Show normal resource button otherwise -->
								<TeamResourceButton
									v-else
									:resource-type="resourceType"
									:value="resourceInputs[resourceType.id] || ''"
									:is-open="activePopover === resourceType.id"
									:helper-text="resourceType.helperText"
									@update:value="updateResourceInput(resourceType.id, $event)"
									@update:is-open="setActivePopover(resourceType.id, $event)"
									@create="handleResourceCreation">
									<template #icon>
										<component :is="resourceType.icon" :size="20" />
									</template>
								</TeamResourceButton>
							</template>
						</div>
					</div>
				</div>
			</div>

			<!-- Main content now a direct child of the grid -->
			<div class="circle-details__main-content">
				<!-- not a member -->
				<template v-if="!circle.isMember">
					<!-- Pending request validation -->
					<NcEmptyContent
						v-if="circle.isPendingMember"
						:name="t('contacts', 'Your request to join this team is pending approval')">
						<template #icon>
							<NcLoadingIcon :size="20" />
						</template>
					</NcEmptyContent>

					<NcEmptyContent
						v-else
						:name="t('contacts', 'You are not a member of {circle}', { circle: circle.displayName })">
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
							<ListItem
								v-for="resource in group.resources"
								:key="resource.id"
								:href="resource.url"
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
								<NcButton v-if="circle.canManageMembers" variant="tertiary" @click="addMembers">
									<template #icon>
										<AccountPlusIcon :size="20" />
									</template>
									{{ t('contacts', 'Add') }}
								</NcButton>
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
import { getCurrentUser } from '@nextcloud/auth'
import axios from '@nextcloud/axios'
import { showError, showSuccess } from '@nextcloud/dialogs'
import { generateOcsUrl, generateUrl } from '@nextcloud/router'
import {
	NcAvatar as Avatar,
	NcListItem as ListItem,
	NcActionButton,
	NcActions,
	NcButton,
	NcEmptyContent,
	NcLoadingIcon,
	NcUserBubble as UserBubble,
} from '@nextcloud/vue'
import { useElementSize } from '@vueuse/core'
import { reactive, ref } from 'vue'
import IconAccountGroup from 'vue-material-design-icons/AccountGroupOutline.vue'
import AccountPlusIcon from 'vue-material-design-icons/AccountPlusOutline.vue'
import BookOpenPageVariantIcon from 'vue-material-design-icons/BookOpenPageVariant.vue'
import CalendarIcon from 'vue-material-design-icons/CalendarOutline.vue'
import CheckIcon from 'vue-material-design-icons/Check.vue'
import CogIcon from 'vue-material-design-icons/CogOutline.vue'
import CopyIcon from 'vue-material-design-icons/ContentCopy.vue'
import FileDocumentOutline from 'vue-material-design-icons/FileDocumentOutline.vue'
import FolderIcon from 'vue-material-design-icons/FolderOutline.vue'
import LoginIcon from 'vue-material-design-icons/Login.vue'
import LogoutIcon from 'vue-material-design-icons/Logout.vue'
import MessageIcon from 'vue-material-design-icons/MessageOutline.vue'
import ViewDashboardIcon from 'vue-material-design-icons/ViewDashboard.vue'
import CircleSettings from './CircleDetails/CircleSettings.vue'
import ContentHeading from './CircleDetails/ContentHeading.vue'
import TeamResourceButton from './CircleDetails/TeamResourceButton.vue'
import MemberList from './MemberList/MemberList.vue'
import CircleActionsMixin from '../mixins/CircleActionsMixin.js'

export default {
	name: 'CircleDetails',

	components: {
		AccountPlusIcon,
		Avatar,
		NcButton,
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
		TeamResourceButton,
		NcEmptyContent,
		NcLoadingIcon,
		UserBubble,
		NcActions,
		NcActionButton,
		FolderIcon,
		MessageIcon,
		CalendarIcon,
		ViewDashboardIcon,
		BookOpenPageVariantIcon,
		CheckIcon,
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
			showMembersModal: false,
			loading: false,
			loadingJoin: false,
			loadingLeave: false,
			showSettings: false,

			resources: [],

			// Resource creation
			activePopover: null,
			resourceInputs: reactive({}),
			popoverBoundary: null,
			createdCalendar: null,
			showCalendarSuccessNotification: false,
			createdCalendarName: '',
		}
	},

	computed: {
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

		teamHasCollective() {
			return this.resourcesForProvider('collectives').length > 0
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
				return this.resources?.filter((res) => res.provider.id === providerId) ?? []
			}
		},

		resourceTypes() {
			const enabledApps = window.OC?.appswebroots || {}

			return [
				{
					id: 'folder',
					label: t('contacts', 'Folder'),
					inputLabel: t('contacts', 'New folder'),
					placeholder: t('contacts', 'Folder name'),
					helperText: t('contacts', 'This will create a regular folder shared with the team. To create a Team Folder, please contact your {productName} administrator', { productName: OC.theme.name }),
					icon: 'FolderIcon',
					apiPath: 'files',
					enabled: enabledApps.files !== undefined,
				},
				{
					id: 'talk',
					label: t('contacts', 'Talk conversation'),
					inputLabel: t('contacts', 'New Talk conversation'),
					placeholder: t('contacts', 'Conversation name'),
					icon: 'MessageIcon',
					apiPath: 'spreed',
					enabled: enabledApps.spreed !== undefined,
				},
				{
					id: 'collective',
					label: t('contacts', 'Collective'),
					inputLabel: null,
					placeholder: null,
					icon: 'BookOpenPageVariantIcon',
					apiPath: 'collectives',
					enabled: enabledApps.collectives !== undefined && !this.teamHasCollective,
					noInput: true,
				},
				{
					id: 'calendar',
					label: t('contacts', 'Calendar'),
					inputLabel: t('contacts', 'New calendar'),
					placeholder: t('contacts', 'Calendar name'),
					icon: 'CalendarIcon',
					apiPath: 'calendar',
					enabled: enabledApps.calendar !== undefined,
				},
				{
					id: 'deck',
					label: t('contacts', 'Deck board'),
					inputLabel: t('contacts', 'New Deck board'),
					placeholder: t('contacts', 'Board name'),
					icon: 'ViewDashboardIcon',
					apiPath: 'deck',
					enabled: enabledApps.deck !== undefined,
				},
			].filter((resource) => resource.enabled)
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

		setActivePopover(resourceId, isOpen) {
			this.activePopover = isOpen ? resourceId : null
		},

		updateResourceInput(resourceId, value) {
			this.resourceInputs[resourceId] = value
		},

		async handleResourceCreation({ resourceType, name }) {
			try {
				let resourceId

				switch (resourceType.id) {
					case 'folder': {
						const folderPath = `/remote.php/dav/files/${getCurrentUser().uid}/${name}`
						await axios.request({
							method: 'MKCOL',
							url: folderPath,
							headers: {
								'Content-Type': 'application/xml',
							},
						})
						resourceId = name
						break
					}

					case 'talk': {
						const talkUrl = generateOcsUrl('/apps/spreed/api/v4/room')
						const talkResponse = await axios.post(talkUrl, {
							roomName: name,
							roomType: 2,
						})
						resourceId = talkResponse.data.ocs.data.token
						break
					}

					case 'collective': {
						const collectiveName = this.circle.sanitizedName || this.circle.name || this.circle.displayName

						if (!collectiveName) {
							throw new Error('Cannot create collective: team has no valid name')
						}

						const collectiveUrl = generateOcsUrl('/apps/collectives/api/v1.0/collectives')
						const collectiveResponse = await axios.post(collectiveUrl, {
							name: collectiveName,
						})
						resourceId = collectiveResponse.data.ocs.data.collective.id

						if (!resourceId) {
							throw new Error('Failed to get collective ID from creation response')
						}
						break
					}

					case 'calendar': {
						const DavClient = (await import('@nextcloud/cdav-library')).default
						const { generateRemoteUrl } = await import('@nextcloud/router')

						const client = new DavClient({
							rootUrl: generateRemoteUrl('dav'),
							defaultHeaders: {
								'X-NC-CalDAV-Webcal-Caching': 'On',
							},
						})
						await client.connect({ enableCalDAV: true })

						const calendarHome = client.calendarHomes[0]

						try {
							const davCalendar = await calendarHome.createCalendarCollection(name, '#0082c9', ['VEVENT', 'VTODO'], 0)
							this.createdCalendar = davCalendar
							resourceId = davCalendar.url
						} catch (calendarError) {
							// Since cdav-library doesn't expose HTTP status properly,
							// assume MKCOL errors on calendar paths are name conflicts (405)
							console.error('Calendar creation failed for name:', name)
							throw new Error(`CALENDAR_EXISTS:${name}`)
						}
						break
					}

					case 'deck': {
						showError(t('contacts', 'Deck app is not installed. Please install it to create team boards.'))
						return
					}

					default: {
						showError(t('contacts', 'Unknown resource type'))
						return
					}
				}

				await this.shareResourceWithTeam(resourceType, resourceId)

				this.resourceInputs[resourceType.id] = ''
				this.activePopover = null
				if (resourceType.id === 'calendar') {
					this.createdCalendar = null
					showSuccess(t('contacts', 'Team calendar "{resourceName}" created and shared with team', {
						resourceName: name,
					}))
					this.createdCalendarName = name
					this.showCalendarSuccessNotification = true
					setTimeout(() => {
						this.showCalendarSuccessNotification = false
					}, 10000)
				} else {
					showSuccess(t('contacts', '{resourceType} "{resourceName}" created and shared with team', {
						resourceType: resourceType.label,
						resourceName: name,
					}))
					this.fetchTeamResources()
				}
			} catch (error) {
				console.error('Failed to create resource:', error)

				// Check for calendar exists error
				if (error.message && error.message.startsWith('CALENDAR_EXISTS:')) {
					const calendarName = error.message.replace('CALENDAR_EXISTS:', '')
					showError(t('contacts', 'A calendar named "{name}" already exists. Please choose a different name.', {
						name: calendarName,
					}))
				} else {
					showError(t('contacts', 'Failed to create {resourceType}: {error}', {
						resourceType: resourceType.label.toLowerCase(),
						error: error.response?.data?.ocs?.data?.message || error.response?.data?.message || error.message,
					}))
				}
			}
		},

		async shareResourceWithTeam(resourceType, resourceId) {
			switch (resourceType.id) {
				case 'folder': {
					const shareUrl = generateOcsUrl('/apps/files_sharing/api/v1/shares')
					await axios.post(shareUrl, {
						path: `/${resourceId}`,
						shareType: 7,
						shareWith: this.circle.id,
						permissions: 31,
					})
					break
				}

				case 'talk': {
					const participantUrl = generateOcsUrl(`/apps/spreed/api/v4/room/${resourceId}/participants`)
					await axios.post(participantUrl, {
						source: 'circles',
						newParticipant: this.circle.id,
					})
					break
				}

				case 'collective': {
					break
				}

				case 'calendar': {
					if (!this.createdCalendar || !this.createdCalendar.share) {
						throw new Error('No calendar object available for sharing')
					}

					const circleUri = `principal:principals/circles/${this.circle.id}`
					await this.createdCalendar.share(circleUri)
					break
				}

				default: {
					break
				}
			}
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

			callback([])
		},

		openCalendarApp() {
			window.open(generateUrl('/apps/calendar/'), '_blank')
			this.showCalendarSuccessNotification = false
		},
	},
}
</script>

<style lang="scss" scoped>
.circle-details-container {
	padding-inline: 20px;
	margin-top: 1rem;

	@media (max-width: 1024px) {
		// Push content below the sidebar navigation toggle button
		margin-top: calc(var(--default-clickable-area) + 1rem);
	}

	.circle-details-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 36px;
		max-width: 800px;
		margin-inline: auto;

		.circle-details__header-wrapper {
			display: grid;
			grid-template-columns: auto 1fr;
			align-items: center;
			gap: 24px;

			@media (max-width: 1024px) {
				.circle-details-grid__avatar {
					display: none;
				}
			}
		}

		.circle-details__main-content {
			margin-inline-start: 99px;

			@media (max-width: 1024px) {
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
			flex-wrap: wrap;
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

			:deep(.resource__icon) {
				width: 44px;
				height: 44px;
				display: flex;
				align-items: center;
				justify-content: center;
				text-align: center;
				color: var(--color-main-text);
				svg {
					width: 20px;
					height: 20px;
					fill: currentColor;
					path, rect, circle, polygon, polyline, ellipse, line {
						fill: currentColor;
					}
				}
				img {
					border-radius: var(--border-radius-pill);
					overflow: hidden;
					width: 32px;
					height: 32px;
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

	.resource-shortcuts {
		margin-top: calc(var(--default-grid-baseline) * 3);

		&__title {
			font-size: 1.3rem;
			font-weight: 600;
			margin: 0 0 calc(var(--default-grid-baseline) * 2) 0;
			display: block;
			width: 100%;
		}

		&__buttons {
			display: flex;
			flex-wrap: nowrap;
			gap: calc(var(--default-grid-baseline) * 2);
			align-items: center;
			overflow-x: auto;

			@media (max-width: 1024px) {
				flex-wrap: wrap;
				overflow-x: visible;
			}
		}
	}

}

</style>
