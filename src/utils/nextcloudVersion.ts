/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

declare const OC: { config: { version: string } }

/**
 * Whether the current Nextcloud version is equal or higher than the given major.minor.patch version
 *
 * @param major The major version number to compare against
 * @param minor The minor version number to compare against
 * @param patch The patch version number to compare against
 * @return True if supported
 */
export function isAtLeastVersion(major: number, minor = 0, patch = 0): boolean {
	const current = OC.config.version.split('.').map((part) => parseInt(part) || 0)
	const required = [major, minor, patch]
	for (let i = 0; i < required.length; i++) {
		const part = current[i] ?? 0
		if (part !== required[i]) {
			return part > required[i]
		}
	}
	return true
}
