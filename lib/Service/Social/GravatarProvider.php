<?php

/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Service\Social;

class GravatarProvider implements ISocialProvider {
	/** @var string */
	public $name = 'gravatar';

	public function __construct() {
	}

	/**
	 * Returns if this provider supports this contact
	 *
	 * @param {array} contact info
	 *
	 * @return bool
	 */
	#[\Override]
	public function supportsContact(array $contact):bool {
		if (!array_key_exists('EMAIL', $contact)) {
			return false;
		}
		$emails = $contact['EMAIL'];
		return isset($emails) && count($emails);
	}

	/**
	 * Returns the profile-picture url
	 *
	 * @param {array} contact information
	 *
	 * @return array
	 */
	#[\Override]
	public function getImageUrls(array $contact):array {
		$urls = [];
		$emails = $contact['EMAIL'];
		if (isset($emails)) {
			foreach ($emails as $email) {
				$hash = md5(strtolower(trim($email['value'])));
				$recipe = 'https://www.gravatar.com/avatar/{hash}?s=720&d=404';
				$connector = str_replace('{hash}', $hash, $recipe);
				$urls[] = $connector;
			}
		}
		return $urls;
	}
}
