/**
 * SPDX-FileCopyrightText: 2016-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

exports.preCommit = async (props) => {
	const fs = await import('fs')

	const old = fs.readFileSync('appinfo/info.xml').toString('utf-8')

	const updated = old.replace(/<version>(.+?)<\/version>/, '<version>' + props.version + '</version>')

	fs.writeFileSync('appinfo/info.xml', updated)
}
