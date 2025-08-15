<template>
    <div class="teams-dashboard-widget">
        <!-- Loading State -->
        <div v-if="loading" class="loading-container">
            <p>{{ t('contacts', 'Loading teams...') }}</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-container">
            <p>{{ t('contacts', 'Could not load teams.') }}</p>
        </div>

        <!-- Content -->
        <div v-else class="teams-list">
            <div v-for="team in teams" :key="team.id" class="team-item">
                <a :href="team.url" class="team-name-link">
                    <h3 class="team-name">{{ team.displayName }}</h3>
                </a>
                <div class="team-members">
                    <a v-for="member in team.members" :key="member.userId" :href="member.url" :title="member.displayName">
                        <!-- Using a placeholder for NcAvatar as it might not be globally available without specific setup -->
                        <img :src="member.avatarUrl" class="avatar" alt="" />
                    </a>
                </div>
                <div class="team-resources">
                    <a v-for="resource in team.resources" :key="resource.id" :href="resource.url" class="resource-link">
                        <img :src="resource.iconUrl" class="resource-icon" alt="" />
                        <span class="resource-name">{{ resource.name }}</span>
                    </a>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import axios from '@nextcloud/axios'
import { generateUrl } from '@nextcloud/router'
import { t } from '@nextcloud/l10n'

export default {
    name: 'TeamsWidget',
    data() {
        return {
            teams: [],
            loading: true,
            error: null,
        }
    },
    mounted() {
        this.loadTeamsData()
    },
    methods: {
        t,
        async loadTeamsData() {
            this.loading = true
            try {
                // Our custom API endpoint for comprehensive team data
                const response = await axios.get(generateUrl('/ocs/v2.php/apps/circles/teams/widget-data'))
                this.teams = response.data.ocs.data
            } catch (e) {
                console.error('Failed to load teams data:', e)
                this.error = e
            } finally {
                this.loading = false
            }
        },
    },
}
</script>

<style scoped>
.teams-dashboard-widget {
    padding: 16px;
}

.loading-container, .error-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100px;
}

.team-item {
    margin-bottom: 20px;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 10px;
}

.team-name-link {
    text-decoration: none;
}

.team-name {
    font-size: 1.2em;
    margin-bottom: 8px;
}

.team-members {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
}

.avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
}

.team-resources {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.resource-link {
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
}

.resource-icon {
    width: 20px;
    height: 20px;
}

.resource-name {
    font-size: 0.9em;
}
</style>
