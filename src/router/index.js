/**
 * @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
 *
 * @author John Molakvoæ <skjnldsv@protonmail.com>
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */

import Vue from 'vue'
import Router from 'vue-router'
import { generateUrl } from '@nextcloud/router'

import { ROUTE_CIRCLE, ROUTE_CHART } from '../models/constants.ts'
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
