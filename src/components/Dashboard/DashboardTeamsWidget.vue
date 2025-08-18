<!--
  - SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="teams-dashboard-widget">
		<NcLoadingIcon v-if="loading" :size="48" />
		<NcEmptyContent
			v-else-if="teams.length === 0"
			:name="t('circles', 'No teams found')"
			:description="t('circles', 'Join or create teams to see them here.')">
			<template #icon>
				<AccountGroupIcon />
			</template>
			<template #action>
				<NcButton :href="teamsUrl">
					{{ t('circles', 'Create your first team') }}
				</NcButton>
			</template>
		</NcEmptyContent>
		<template v-else>
			<div class="teams-container">
				<div class="teams-list">
					<div v-for="team in visibleTeams" :key="team.id" class="team-item">
						<!-- Team Name with External Link Icon -->
						<div class="team-header">
							<a :href="team.url" class="team-name-link">
								<h3 class="team-name">{{ team.displayName }}</h3>
								<OpenInNewIcon :size="16" class="external-link-icon" />
							</a>
						</div>
						
						<!-- Team Members -->
						<div v-if="team.members && team.members.length > 0" class="team-members">
							<div class="members-row">
								<NcAvatar
									v-for="member in team.members.slice(0, 5)"
									:key="member.userId || member.singleId"
									:user="member.isUser ? member.userId : undefined"
									:display-name="member.displayName"
									:is-no-user="!member.isUser"
									:size="36"
									class="member-avatar" />
								<span v-if="team.members.length > 5" class="more-indicator">
									+{{ team.members.length - 5 }}
								</span>
							</div>
						</div>

						<!-- Team Resources -->
						<div v-if="team.resources && team.resources.length > 0" class="team-resources">
							<div class="resources-row">
								<div v-for="resource in team.resources.slice(0, 5)"
									:key="resource.id"
									class="resource-box"
									:title="resource.name"
									:style="{ '--fallback-icon': `url('${resource.fallbackIcon}')` }">
									<a :href="resource.url" class="resource-link">
										<img :src="resource.iconUrl"
											class="resource-icon"
											:alt="resource.name" />
									</a>
								</div>
								<a v-if="team.resources.length > 5" 
								   :href="team.url" 
								   class="more-resources-box more-resources-link">
									+{{ team.resources.length - 5 }}
								</a>
							</div>
						</div>
					</div>
				</div>
				
				<!-- Show More Button -->
				<div v-if="hasMoreTeams" class="show-more-container">
					<NcButton 
						@click="loadMoreTeams" 
						:disabled="loading"
						type="secondary"
						class="show-more-button">
						{{ loading ? t('circles', 'Loading...') : t('circles', 'Show more teams') }}
					</NcButton>
				</div>
			</div>
		</template>
	</div>
</template>

<script>
import { generateUrl, generateOcsUrl } from '@nextcloud/router'
import { t } from '@nextcloud/l10n'
import axios from '@nextcloud/axios'

import NcAvatar from '@nextcloud/vue/dist/Components/NcAvatar.js'
import NcButton from '@nextcloud/vue/dist/Components/NcButton.js'
import NcEmptyContent from '@nextcloud/vue/dist/Components/NcEmptyContent.js'
import NcLoadingIcon from '@nextcloud/vue/dist/Components/NcLoadingIcon.js'
import AccountGroupIcon from 'vue-material-design-icons/AccountGroup.vue'
import OpenInNewIcon from 'vue-material-design-icons/OpenInNew.vue'

export default {
	name: 'DashboardTeamsWidget',
	components: {
		NcAvatar,
		NcButton,
		NcEmptyContent,
		NcLoadingIcon,
		AccountGroupIcon,
		OpenInNewIcon,
	},


	data() {
		return {
			teams: [],
			loading: true,
			error: null,
			teamsUrl: generateUrl('/apps/contacts/#/circles'),
			offset: 0,
			limit: 3,
			hasMoreTeams: true,
		}
	},

	computed: {
		visibleTeams() {
			return this.teams
		},
	},

	mounted() {
		this.loadTeams()
	},

	methods: {
		t,
		async loadTeams(isLoadMore = false) {
			this.loading = true
			this.error = null
			
			try {
				const params = new URLSearchParams({
					limit: this.limit.toString(),
					offset: this.offset.toString()
				})
				
				const response = await axios.get(generateOcsUrl(`apps/circles/teams/dashboard/widget?${params}`))
				const teams = response.data?.ocs?.data || []
				
				// Process teams data that already includes members and resources
				const processedTeams = teams.map((team) => ({
					id: team.singleId,
					displayName: team.displayName || team.name,
					url: team.url,
					members: (team.members || []).map(member => ({
						userId: member.userId || member.singleId,
						displayName: member.displayName,
						type: member.type,
						isUser: member.type === 1, // TYPE_USER = 1
						url: generateUrl(`/u/${member.userId || member.singleId}`)
					})),
					resources: team.resources || [],
				}))
				
				if (isLoadMore) {
					this.teams.push(...processedTeams)
					this.offset += this.limit
				} else {
					this.teams = processedTeams
					this.offset = this.limit // Set offset for next load
					// Scroll to top when loading initial teams
					this.$nextTick(() => {
						const teamsList = this.$el.querySelector('.teams-list')
						if (teamsList) {
							teamsList.scrollTop = 0
						}
					})
				}
				
				// Check if there are more teams
				this.hasMoreTeams = teams.length === this.limit
			} catch (error) {
				console.error('Failed to load teams:', error)
				this.error = error
				if (!isLoadMore) {
					this.teams = []
				}
			} finally {
				this.loading = false
			}
		},


		async loadMoreTeams() {
			if (!this.hasMoreTeams || this.loading) return
			await this.loadTeams(true)
		},
	},
}
</script>

<style scoped>
.teams-dashboard-widget {
	padding: 2px;
	height: 100%;
	display: flex;
	flex-direction: column;
}

.teams-container {
	display: flex;
	flex-direction: column;
	height: 100%;
	flex: 1;
}

.teams-list {
	display: flex;
	flex-direction: column;
	gap: 2px;
	overflow-y: auto;
	flex: 1;
	scroll-behavior: smooth;
}

.team-item {
	padding: 2px 0 8px 0;
	border-bottom: 1px solid #aaa;
}

.team-item:last-child {
	border-bottom: none;
}

.team-item:hover .team-name {
	color: var(--color-primary-element);
}

/* Team Header */
.team-header {
	margin-bottom: 2px;
}

.team-name-link {
	display: flex;
	align-items: center;
	gap: 8px;
	text-decoration: none;
	transition: color 0.2s ease;
}

.team-name {
	font-size: 1.4em;
	font-weight: 600;
	margin: 0;
	color: var(--color-main-text);
}

.external-link-icon {
	color: var(--color-text-lighter);
	opacity: 0.7;
	transition: opacity 0.2s ease;
}

.team-name-link:hover .team-name {
	color: var(--color-primary-element);
}

.team-name-link:hover .external-link-icon {
	opacity: 1;
	color: var(--color-primary-element);
}

/* Section Labels */
.section-label {
	display: block;
	font-size: 0.75em;
	font-weight: 500;
	color: var(--color-text-lighter);
	margin-bottom: 6px;
	text-transform: uppercase;
	letter-spacing: 0.5px;
}

/* Team Members - Horizontal Row */
.team-members {
	margin-bottom: 4px;
}

.members-row {
	display: flex;
	gap: 6px;
	align-items: center;
	flex-wrap: wrap;
}

.member-avatar {
	transition: transform 0.2s ease;
}

.member-avatar:hover {
	transform: scale(1.1);
}

.more-indicator {
	font-size: 0.8em;
	color: var(--color-text-lighter);
	background-color: var(--color-background-hover);
	padding: 2px 6px;
	border-radius: 10px;
	margin-left: 4px;
}

/* Team Resources - Horizontal Row */

.resources-row {
	display: flex;
	gap: 8px;
	align-items: center;
	flex-wrap: wrap;
}

.resource-box {
	width: 40px;
	height: 40px;
	border-radius: 8px;
	border: none;
	background-color: transparent;
	background-image: var(--fallback-icon);
	background-size: 32px 32px;
	background-repeat: no-repeat;
	background-position: center;
	display: block;
	overflow: hidden;
	transition: all 0.2s ease;
	cursor: pointer;
	position: relative;
}

.resource-box:hover {
	transform: scale(1.05);
	background-color: var(--color-background-hover);
}

.resource-link {
	display: block;
	width: 100%;
	height: 100%;
	text-decoration: none;
	padding: 0 !important;
	margin: 0 !important;
	position: absolute;
	top: 0;
	left: 0;
	border: none !important;
	outline: none !important;
}

.resource-icon {
	width: 100%;
	height: 100%;
	object-fit: cover;
	border-radius: 8px;
	display: block;
}

.resource-icon:error {
	display: none;
}

/* Hide any text content that might appear in the link */
.resource-link:before,
.resource-link:after {
	display: none !important;
}

.resource-link * {
	font-size: 0 !important;
}

.more-resources-box {
	width: 40px;
	height: 40px;
	border-radius: 8px;
	border: 1px solid var(--color-border);
	background-color: var(--color-background-hover);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 0.8em;
	color: var(--color-text-lighter);
	font-weight: 500;
}

.more-resources-link {
	text-decoration: none;
	transition: all 0.2s ease;
}

.more-resources-link:hover {
	background-color: var(--color-primary-element-light);
	color: var(--color-primary-element);
	border-color: var(--color-primary-element);
	transform: scale(1.05);
}

/* Responsive adjustments */
@media (max-width: 480px) {
	.members-row {
		gap: 3px;
	}
	
	.resources-row {
		gap: 6px;
	}
	
	.resource-box,
	.more-resources-box {
		width: 28px;
		height: 28px;
	}
	
	.resource-icon {
		width: 16px;
		height: 16px;
	}
}

/* Show More Button */
.show-more-container {
	display: flex;
	padding: 4px 0 0 0;
	margin-top: auto;
}

.show-more-button {
	width: 100% !important;
	font-size: 0.9em;
}
</style>