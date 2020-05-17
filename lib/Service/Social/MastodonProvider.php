<?php
/**
 * @copyright Copyright (c) 2020 Matthias Heinisch <nextcloud@matthiasheinisch.de>
 *
 * @author Matthias Heinisch <nextcloud@matthiasheinisch.de>
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

class MastodonProvider implements ISocialProvider {

	public function __construct() {
	}
	
	/**
	 * Returns the profile-id
	 *
	 * @param {string} the value from the contact's x-socialprofile
	 *
	 * @return string
	 */
	public function cleanupId(string $candidate):?string {
		try {
			if (strpos($candidate, '@') === 0) {
				$user_server = explode ('@', $candidate);
				$candidate = 'https://' . $user_server[2] . '/@' . $user_server[1];
			}
		}
		catch (Exception $e) {
			$candidate = null;
		}
		return $candidate;
	}

	/**
	 * Returns the profile-picture url
	 *
	 * @param {string} profileUrl link to the profile
	 *
	 * @return string|null
	 */
	public function getImageUrl(string $profileUrl):?string {
		try {
			$opts = [
				"http" => [
				"method" => "GET",
				"header" => "User-Agent: Nextcloud Contacts App",
				]
			];
			$context = stream_context_create($opts);
			$result = file_get_contents($profileUrl, false, $context);

			$htmlResult = new \DOMDocument();
			$htmlResult->loadHTML($result);
			$img = $htmlResult->getElementById('profile_page_avatar');
			if (!is_null($img)) {
				return $img->getAttribute("data-original");
			}
			return null;
		}
		catch (Exception $e) {
			return null;
		}
	}
}
