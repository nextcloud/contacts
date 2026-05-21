<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<div class="contacts-list__item-wrapper">
		<ListItem
			:id="id"
			:key="source.key"
			class="list-item-style envelope"
			:name="displayName"
			:to="{ name: ROUTE_NAME_OCM_INVITE, params: { selectedInvite: source.key } }"
			:data-testid="`ocm-invite-item-${source.token}`" />
	</div>
</template>

<script>
import {
	NcListItem as ListItem,
} from '@nextcloud/vue'
import { ROUTE_NAME_OCM_INVITE } from '../../models/constants.ts'
import { getOcmInviteDisplayName } from '../../models/ocminvite.ts'

export default {
	name: 'OcmInvitesListItem',

	components: {
		ListItem,
	},

	props: {
		source: {
			type: Object,
			required: true,
		},
	},

	data() {
		return {
			ROUTE_NAME_OCM_INVITE,
		}
	},

	computed: {
		// usable and valid html id for scrollTo
		id() {
			// Token is UUID format, use with prefix for valid HTML ID
			return `invite-${this.source.key}`
		},

		displayName() {
			return getOcmInviteDisplayName(this.source)
		},
	},
}
</script>

<style lang="scss" scoped>

.envelope {
	.app-content-list-item-icon {
		height: 40px; // To prevent some unexpected spacing below the avatar
	}

	&__subtitle {
		display: flex;
		gap: var(--default-grid-baseline);

		&__subject {
			line-height: 130%;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}
}

:deep(.list-item) {
	list-style: none;
	padding-inline: calc(var(--default-grid-baseline) * 3);
	padding-block: calc(var(--default-grid-baseline) * 2);
}

</style>

<style lang="scss">
.contacts-list__item-wrapper {
	&[draggable='true'] .avatardiv * {
		cursor: move !important;
	}

	&[draggable='false'] .avatardiv * {
		cursor: not-allowed !important;
	}
}
</style>
