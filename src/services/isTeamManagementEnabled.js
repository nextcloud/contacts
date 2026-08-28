/**
 * SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { loadState } from '@nextcloud/initial-state'

/**
 * Whether this app renders its own team management UI.
 *
 * True when a compatible version of the circles app is enabled *and* the server
 * is old enough to not manage teams itself yet. See PageController.
 */
const isTeamManagementEnabled = loadState('contacts', 'isTeamManagementEnabled', false)
export default isTeamManagementEnabled
