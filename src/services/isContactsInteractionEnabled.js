/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { loadState } from '@nextcloud/initial-state'

const isContactsInteractionEnabled = loadState('contacts', 'isContactsInteractionEnabled', false)
export default isContactsInteractionEnabled
