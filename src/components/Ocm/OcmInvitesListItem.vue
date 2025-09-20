<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<div class="contacts-list__item-wrapper">
		<ListItem :id="id"
			:key="source.key"
			class="list-item-style envelope"
			:name="source.recipientEmail"
			:to="{ name: ROUTE_NAME_OCM_INVITE, params: { selectedInvite: source.key } }">
		</ListItem>
	</div>
</template>

<script>
import {
	NcListItem as ListItem,
} from '@nextcloud/vue'

import { ROUTE_NAME_OCM_INVITE } from '../../models/constants'

export default {
	name: 'OcmInvitesListItem',

	components: {
		ListItem,
	},

	props: {
		index: {
			type: Number,
			required: true,
		},
		source: {
			type: Object,
			required: true,
		},
		reloadBus: {
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
			return this.source.key.slice(0, -2)
		},
	},
	methods: {
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
