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

use OCP\Http\Client\IClientService;

class DiasporaProvider implements ISocialProvider {

	/** @var IClientService */
	private $httpClient;

	/** @var boolean */
	private $looping;

	public function __construct(IClientService $httpClient) {
		$this->httpClient = $httpClient->NewClient();
		$this->looping = false;
	}
	
	/**
	 * Returns the profile-id
	 *
	 * @param {string} the value from the contact's x-socialprofile
	 *
	 * @return string
	 */
	public function cleanupId(string $candidate):string {
		try {
			if (strpos($candidate, 'http') !== 0) {
				$user_server = explode('@', $candidate);
				$candidate = 'https://' . array_pop($user_server) . '/public/' . array_pop($user_server) . '.atom';
			}
		} catch (Exception $e) {
			$candidate = null;
		}
		return $candidate;
	}

	/**
	 * Returns the profile-picture url
	 *
	 * @param {string} profileId the profile-id
	 *
	 * @return string|null
	 */
	public function getImageUrl(string $profileUrl):?string {
		try {
			$result = $this->httpClient->get($profileUrl);
			$htmlResult = $result->getBody();

			$avatar = '/.*<logo>(.*)<\/logo>.*/';
			if (preg_match($avatar, $htmlResult, $matches)) {
				return (str_replace("small", "large", $matches[1]));
			}
			// keyword not found, second try:
			if (!$this->looping) {
				$this->looping = true;
				$atom = '/.*<link rel="alternate" href="(.*.atom)".*/';
				if (preg_match($atom, $htmlResult, $matches)) {
					return ($this->getImageUrl($matches[1]));
				}
			}
			return null;
		} catch (Exception $e) {
			return null;
		}
	}
}
