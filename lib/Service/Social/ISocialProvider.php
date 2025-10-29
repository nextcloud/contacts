<?php

/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Service\Social;

interface ISocialProvider {
	/**
	 * Returns true if provider supports the contact
	 *
	 * @param {array} contact details
	 *
	 * @return boolean
	 */
	public function supportsContact(array $contact):bool ;

	/**
	 * Returns all possible profile-picture urls
	 *
	 * @param {array} contact information
	 *
	 * @return array
	 */
	public function getImageUrls(array $contact):array ;
}
