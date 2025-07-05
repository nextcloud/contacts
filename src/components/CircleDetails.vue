<!--
  - SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="circle-details-container">
		<div class="circle-details-grid">
			<div class="circle-details-grid__avatar">
				<!-- avatar and upload photo -->
				<Avatar :disable-tooltip="true"
					:display-name="circle.displayName"
					:is-no-user="true"
					:size="75" />
			</div>
			<div class="circle-details-grid__content">
				<div class="circle-details__header">
					<!-- display name -->
					<div class="title-bar">
						<div v-if="loadingName" class="circle-name__loader icon-loading-small" />
						<h2>
							{{ circle.displayName }}
						</h2>
					</div>
					<div class="subtitle">
						<span>{{ t('files', 'Team owner') }}</span> <UserBubble :user="circle.owner.id"
							:display-name="circle.isOwner ? 'you': circle.owner.displayName" />
					</div>
					<div v-if="showDescription" class="circle-description-wrapper">
						<RichContenteditable :value="circle.description"
							:auto-complete="onAutocomplete"
							:maxlength="1024"
							:multiline="true"
							:contenteditable="false"
							:placeholder="descriptionPlaceholder"
							class="circle-description" />
					</div>
					<div class="actions">
						<Button type="primary">
							<template #icon>
								<PencilIcon :size="20" />
							</template>
							{{ t('contacts', 'Edit') }}
						</Button>
						<!-- copy circle link -->
						<Button type="secondary"
							:href="circleUrl"
							@click.stop.prevent="copyToClipboard(circleUrl)">
							<template #icon>
								<CopyIcon :size="20" />
							</template>
							{{ t('contacts', 'Copy link') }}
						</Button>

						<!-- Team settings modal -->
						<Button v-if="(circle.isOwner || circle.isAdmin) && !circle.isPersonal" @click="showSettingsModal = true">
							<template #icon>
								<Cog :size="20" />
							</template>
						</Button>

						<!-- Only show the join button if the circle is accepting requests -->
						<Button v-if="!circle.isPendingMember && !circle.isMember && circle.canJoin"
							:disabled="loadingJoin"
							class="primary"
							@click="joinCircle">
							<template #icon>
								<Login :size="16" />
							</template>
							{{ t('contacts', 'Request to join') }}
						</Button>
					</div>
				</div>

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
						<!-- Files Section -->
						<div class="circle-details-section">
							<div class="section-header">
								<ContentHeading>{{ t('contacts', 'Files') }}</ContentHeading>
							</div>
							<ul class="item-list">
								<ListItem name="dummy-file-1.txt">
									<template #icon>
										<FileDocumentOutline :size="20" />
									</template>
								</ListItem>
								<ListItem name="important-document.docx">
									<template #icon>
										<FileDocumentOutline :size="20" />
									</template>
								</ListItem>
								<ListItem name="project-notes.md">
									<template #icon>
										<FileDocumentOutline :size="20" />
									</template>
								</ListItem>
							</ul>
							<Button type="secondary" style="align-self: flex-start; margin-top: 8px;" @click="() => {}">
								{{ t('contacts', 'Show all') }}
							</Button>
						</div>

						<!-- Collective Section -->
						<div class="circle-details-section">
							<div class="section-header">
								<ContentHeading>{{ t('contacts', 'Collective') }}</ContentHeading>
							</div>
							<ul class="item-list">
								<ListItem name="Team Workspace">
									<template #icon>
										<IconAccountGroup :size="20" />
									</template>
								</ListItem>
							</ul>
						</div>

						<!-- Members Section -->
						<div class="circle-details-section">
							<div class="section-header">
								<ContentHeading>{{ t('contacts', 'Members') }}</ContentHeading>
							</div>
							<MemberList v-if="members.length" :list="members" />
						</div>
					</section>
				</div>
			</div>
		</div>

		<Modal v-if="(circle.isOwner || circle.isAdmin) && !circle.isPersonal && showSettingsModal" @close="showSettingsModal=false">
			<div class="circle-settings">
				<h2>{{ t('contacts', 'Team settings') }}</h2>

				<h3>{{ t('contacts', 'Team name') }}</h3>
				<input v-model="circle.displayName"
					:readonly="!circle.isOwner"
					:placeholder="t('contacts', 'Team name')"
					class="circle-name-input"
					@input="onNameChangeDebounce($event.target.value)">

				<RichContenteditable v-model="circle.description"
					:auto-complete="onAutocomplete"
					:maxlength="1024"
					:multiline="true"
					:contenteditable="circle.isOwner"
					:placeholder="descriptionPlaceholder"
					class="circle-details-section__description"
					@update:value="onDescriptionChangeDebounce" />

				<CirclePasswordSettings :circle="circle" />

				<CircleConfigs :circle="circle" />

				<!-- leave circle -->
				<Button v-if="circle.canLeave"
					type="warning"
					@click="confirmLeaveCircle">
					<template #icon>
						<Logout :size="16" />
					</template>
					{{ t('contacts', 'Leave team') }}
				</Button>

				<!-- delete circle -->
				<Button v-if="circle.canDelete"
					type="error"
					href="#"
					@click.prevent.stop="confirmDeleteCircle">
					<template #icon>
						<IconDelete :size="20" />
					</template>
					{{ t('contacts', 'Delete team') }}
				</Button>
			</div>
		</Modal>
	</div>
</template>

<script>
import { ref } from 'vue'
import { useElementSize } from '@vueuse/core'
import debounce from 'debounce'
import { generateOcsUrl } from '@nextcloud/router'
import { showError } from '@nextcloud/dialogs'
import axios from '@nextcloud/axios'

import {
	NcAvatar as Avatar,
	NcButton as Button,
	NcEmptyContent,
	NcListItem as ListItem,
	NcLoadingIcon,
	NcModal as Modal,
	NcRichContenteditable as RichContenteditable,
	NcUserBubble as UserBubble,
} from '@nextcloud/vue'

import Cog from 'vue-material-design-icons/Cog.vue'
import CopyIcon from 'vue-material-design-icons/ContentCopy.vue'
import Login from 'vue-material-design-icons/Login.vue'
import Logout from 'vue-material-design-icons/Logout.vue'
import IconDelete from 'vue-material-design-icons/Delete.vue'
import PencilIcon from 'vue-material-design-icons/Pencil.vue'
import IconAccountGroup from 'vue-material-design-icons/AccountGroup.vue'
import FileDocumentOutline from 'vue-material-design-icons/FileDocumentOutline.vue'
import { CircleEdit, editCircle } from '../services/circles.ts'
import CircleActionsMixin from '../mixins/CircleActionsMixin.js'

import CircleConfigs from './CircleDetails/CircleConfigs.vue'
import MemberList from './MemberList/MemberList.vue'
import ContentHeading from './CircleDetails/ContentHeading.vue'
import CirclePasswordSettings from './CircleDetails/CirclePasswordSettings.vue'

export default {
	name: 'CircleDetails',

	components: {
		Avatar,
		Button,
		CircleConfigs,
		CirclePasswordSettings,
		ContentHeading,
		ListItem,
		Cog,
		CopyIcon,
		IconAccountGroup,
		IconDelete,
		FileDocumentOutline,
		Login,
		Logout,
		MemberList,
		Modal,
		NcEmptyContent,
		NcLoadingIcon,
		PencilIcon,
		RichContenteditable,
		UserBubble,
	},

	mixins: [CircleActionsMixin],

	setup() {
		const avatarList = ref()
		const { width } = useElementSize(avatarList)
		return { avatarList, width }
	},

	data() {
		return {
			loadingDescription: false,
			loadingName: false,
			showSettingsModal: false,
			showMembersModal: false,
			resources: null,
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

		resourceProviders() {
			return this.resources?.reduce((acc, res) => {
				if (!acc.find(p => p.id === res.provider.id)) {
					acc.push(res.provider)
				}
				return acc
			}, []) ?? []
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
		async fetchTeamResources() {
			const response = await axios.get(generateOcsUrl(`/teams/${this.circle.id}/resources`))
			this.resources = response.data.ocs.data.resources
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

		onDescriptionChangeDebounce: debounce(function(...args) {
			this.onDescriptionChange(...args)
		}, 500),
		async onDescriptionChange(description) {
			this.loadingDescription = true
			try {
				await editCircle(this.circle.id, CircleEdit.Description, description)
			} catch (error) {
				console.error('Unable to edit team description', description, error)
				showError(t('contacts', 'An error happened during description sync'))
			} finally {
				this.loadingDescription = false
			}
		},

		onNameChangeDebounce: debounce(function(event) {
			this.onNameChange(event.target.value)
		}, 500),
		async onNameChange(name) {
			this.loadingName = true
			try {
				await editCircle(this.circle.id, CircleEdit.Name, name)
			} catch (error) {
				console.error('Unable to edit name', name, error)
				showError(t('contacts', 'An error happened during name sync'))
			} finally {
				this.loadingName = false
			}
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
		grid-template-columns: auto 1fr;
		gap: 24px;
		max-width: 800px;
		margin-inline: auto;

		&__content {

			display: flex;
			flex-direction: column;
			gap: 36px;

			.circle-details__header {
				display: flex;
				flex-direction: column;
				align-items: flex-start;
				gap: 8px;

				.title-bar {
					display: flex;
					align-items: center;
					gap: 8px;

					.circle-name__loader {
						margin-left: 8px;
					}

					h2 {
						font-size: 1.5rem;
						font-weight: bold;
						margin: 0;
						margin-bottom: 2px;
					}
				}

				.subtitle {
					margin-bottom: 2px;
				}

				.circle-description-wrapper {
					width: 100%;
					.circle-description {
						&:deep(.rich-contenteditable__input) {
							min-height: var(--default-clickable-area) !important;
							color: var(--color-primary-element-text) !important;
							position: relative !important;
						}
					}
				}

				.actions {
					display: flex;
					gap: 8px;
				}
			}

			.circle-details__main-content {
				.circle-details-section {
					width: 100%;
					margin-bottom: 24px;

					&:not(:first-of-type) {
						margin-top: 24px;
					}

					.section-header {
						display: flex;
						justify-content: space-between;
						align-items: center;
						width: 100%;
						margin-bottom: 4px;

						:deep(h2), :deep(h3) {
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

							&:deep(.line-one__name) {
								font-weight: normal;
							}
						}
					}

					.avatar-box {
						display: flex;
						justify-content: space-between;
						align-items: center;
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
		}
	}

	.circle-settings {
		margin: 12px;

		.circle-details-section__description {
			max-width: 100%;
		}
	}

}
</style>
