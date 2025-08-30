/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createRouter, createWebHistory } from 'vue-router'
import { generateUrl } from '@nextcloud/router'

import { ROUTE_CIRCLE, ROUTE_CHART, ROUTE_USER_GROUP } from '../models/constants.ts'
import Contacts from '../views/Contacts.vue'

// if index.php is in the url AND we got this far, then it's working:
// let's keep using index.php in the url
const routerHistory = createWebHistory(generateUrl('/apps/contacts', ''))

export default createRouter({
	history: routerHistory,
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
				{
					path: `${ROUTE_USER_GROUP}/:selectedUserGroup`,
					name: 'user_group',
					component: Contacts,
				},
			],
		},
	],
})
