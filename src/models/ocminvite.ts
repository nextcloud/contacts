/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { t } from '@nextcloud/l10n'

/**
 * Raw invite payload as returned by the federated_invites endpoint.
 */
export interface OcmInviteData {
	token: string
	accepted?: boolean
	recipientName?: string
	recipientEmail?: string
	recipientUserId?: string
	recipientProvider?: string
	createdAt?: number
	expiredAt?: number
	acceptedAt?: number
}

/**
 * Store-side shape: same data as OcmInviteData plus a derived `key` used
 * for keyed lookups and stable list rendering.
 */
export interface OcmInviteEntry extends OcmInviteData {
	key: string
}

/**
 * Build a store-friendly entry from a raw invite payload. Returns null
 * when the payload is missing the token, since the token is the only
 * field we can use as a stable key.
 */
export function toOcmInviteEntry(data: OcmInviteData | null | undefined): OcmInviteEntry | null {
	if (!data || typeof data !== 'object' || !data.token) {
		return null
	}
	return { ...data, key: data.token }
}

/**
 * Label used in lists and headings. Falls back to the recipient email,
 * then to a neutral "link-only invite" string when no email was given.
 */
export function getOcmInviteDisplayName(invite: OcmInviteData): string {
	return invite.recipientName || invite.recipientEmail || t('contacts', 'Link-only invite')
}

/**
 * Searchable text for an invite. Joins the recipient name and email
 * when present, otherwise falls back to the same neutral label so
 * link-only invites still match a search for that phrase.
 */
export function getOcmInviteSearchData(invite: OcmInviteData): string {
	const parts = [invite.recipientName, invite.recipientEmail].filter(Boolean) as string[]
	return parts.length > 0 ? parts.join(' ') : t('contacts', 'Link-only invite')
}
