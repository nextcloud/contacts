/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import ICAL from 'ical.js'

/**
 * Fixes misbehaviour with TYPE quotes and separated commas
 * Seems to have been introduced with https://github.com/mozilla-comm/ical.js/pull/387
 */
export default function updateDesignSet() {
	// https://github.com/mozilla-comm/ical.js/blob/ba8e2522ffd30ffbe65197a96a487689d6e6e9a1/lib/ical/stringify.js#L121
	ICAL.design.vcard.param.type.multiValueSeparateDQuote = false
	ICAL.design.vcard3.param.type.multiValueSeparateDQuote = false
}
