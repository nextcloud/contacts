<?php
/**
 * @copyright Copyright (c) 2020 Matthias Heinisch <nextcloud@matthiasheinisch.de>
 *
 * @author leith <online-nextcloud@eleith.com>
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
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
