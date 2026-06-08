/**
 * SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ROUTE_CIRCLE, ROUTE_USER_GROUP } from '../models/constants.ts';

export default {
  computed: {
    // router variables
    selectedContact() {
      return this.$route.params.selectedContact;
    },
    selectedGroup() {
      const { name } = this.$route;
      if (name === 'circle') return ROUTE_CIRCLE;
      if (name === 'user_group') return ROUTE_USER_GROUP;
      return this.$route.params.selectedGroup;
    },
    selectedCircle() {
      return this.$route.params.selectedCircle;
    },
    selectedUserGroup() {
      return this.$route.params.selectedUserGroup;
    },
    selectedChart() {
      return this.$route.params.selectedChart;
    },
  },
};
