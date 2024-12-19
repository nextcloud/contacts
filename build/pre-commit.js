/**
 * SPDX-FileCopyrightText: 2016-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { readFileSync, writeFileSync } from 'fs'

export function preCommit(props) {
	const old = readFileSync('appinfo/info.xml').toString('utf-8')

	const updated = old.replace(/<version>(.+?)<\/version>/, '<version>' + props.version + '</version>')

	writeFileSync('appinfo/info.xml', updated)
}
