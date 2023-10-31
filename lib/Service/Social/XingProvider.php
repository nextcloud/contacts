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

use OCP\Http\Client\IClient;
use OCP\Http\Client\IClientService;

class XingProvider implements ISocialProvider {
	/** @var IClient */
	private $httpClient;

	/** @var string */
	public $name = 'xing';

	public function __construct(IClientService $httpClient) {
		$this->httpClient = $httpClient->newClient();
	}

	/**
	 * Returns if this provider supports this contact
	 *
	 * @param {array} contact info
	 *
	 * @return bool
	 */
	public function supportsContact(array $contact):bool {
		if (!array_key_exists('X-SOCIALPROFILE', $contact)) {
			return false;
		}
		$socialprofiles = $this->getProfileIds($contact);
		return isset($socialprofiles) && count($socialprofiles) > 0;
	}

	/**
	 * Returns all possible profile-picture urls
	 *
	 * @param {array} contact information
	 *
	 * @return array
	 */
	public function getImageUrls(array $contact):array {
		$profileIds = $this->getProfileIds($contact);
		$urls = [];

		foreach ($profileIds as $profileId) {
			$url = $this->getImageUrl($profileId);
			if (isset($url)) {
				$urls[] = $url;
			}
		}

		return $urls;
	}

	/**
	 * Returns the profile-picture url
	 *
	 * @param {string} profile url
	 *
	 * @return string|null
	 */
	protected function getImageUrl(string $profileUrl):?string {
		try {
			$result = $this->httpClient->get($profileUrl);
			$htmlResult = $result->getBody();

			$avatar = '/.*src="(https:\/\/profile-images[a-zA-Z0-9\/.\-_%]+\.jpg)".*/';
			if (preg_match($avatar, $htmlResult, $matches)) {
				return $matches[1];
			}
			// keyword not found, maybe page changed?
			return null;
		} catch (\Exception $e) {
			return null;
		}
	}

	/**
	 * Returns the profile-id
	 *
	 * @param {string} the value from the contact's x-socialprofile
	 *
	 * @return string
	 */
	protected function cleanupId(string $candidate):?string {
		$candidate = preg_replace('/^' . preg_quote('x-apple:', '/') . '/', '', $candidate);
		try {
			if (strpos($candidate, 'http') !== 0) {
				$candidate = 'https://www.xing.com/profile/' . $candidate;
			}
		} catch (\Exception $e) {
			$candidate = null;
		}
		return $candidate;
	}

	/**
	 * Returns all possible profile ids for contact
	 *
	 * @param {array} contact information
	 *
	 * @return string of first profile url else null
	 */
	protected function getProfileIds($contact):array {
		$socialprofiles = $contact['X-SOCIALPROFILE'];
		$profileIds = [];
		if (isset($socialprofiles)) {
			foreach ($socialprofiles as $profile) {
				if (strtolower($profile['type']) == $this->name) {
					$profileId = $this->cleanupId($profile['value']);
					if (isset($profileId)) {
						$profileIds[] = $profileId;
					}
				}
			}
		}
		return $profileIds;
	}
}
