/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Vue from 'vue'
import Router from 'vue-router'
import { generateUrl } from '@nextcloud/router'

import { ROUTE_CIRCLE, ROUTE_CHART, GROUP_ALL_OCM_INVITES, ROUTE_ALL_OCM_INVITES, ROUTE_NAME_OCM_INVITE, ROUTE_NAME_ALL_OCM_INVITES, ROUTE_NAME_INVITE_ACCEPT_DIALOG, ROUTE_INVITE_ACCEPT_DIALOG } from '../models/constants.ts'
import Contacts from '../views/Contacts.vue'

Vue.use(Router)

export default new Router({
	mode: 'history',
	// if index.php is in the url AND we got this far, then it's working:
	// let's keep using index.php in the url
	base: generateUrl('/apps/contacts', ''),
	linkActiveClass: 'active',
	routes: [
		{
			path: '/',
			component: Contacts,
			props: true,
			name: 'root',
			// always load default group
			redirect: {
				name: 'group',
				params: { selectedGroup: t('contacts', 'All contacts') },
			},
			children: [
				{
					path: `/${ROUTE_ALL_OCM_INVITES}`,
					name: ROUTE_NAME_ALL_OCM_INVITES,
					component: Contacts,
					meta: { selectedGroup: GROUP_ALL_OCM_INVITES },
				},
				{
					path: `/${ROUTE_ALL_OCM_INVITES}/:selectedInvite`,
					name: ROUTE_NAME_OCM_INVITE,
					component: Contacts,
					meta: { selectedGroup: GROUP_ALL_OCM_INVITES },
				},
				{
					path: ROUTE_INVITE_ACCEPT_DIALOG,
					name: ROUTE_NAME_INVITE_ACCEPT_DIALOG,
					component: Contacts,
				},
				{
					path: `/${ROUTE_CHART}/:selectedChart`,
					name: 'chart',
					component: Contacts,
				},
				{
					path: 'import',
					name: 'import',
					component: Contacts,
				},
				{
					path: `${ROUTE_CIRCLE}/:selectedCircle`,
					name: 'circle',
					component: Contacts,
				},
				{
					path: ':selectedGroup',
					name: 'group',
					component: Contacts,
				},
				{
					path: ':selectedGroup/:selectedContact',
					name: 'contact',
					component: Contacts,
				},
			],
		},
	],
})
