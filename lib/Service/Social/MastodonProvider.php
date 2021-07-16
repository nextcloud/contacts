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

class MastodonProvider implements ISocialProvider {

	/** @var IClientService */
	private $httpClient;

	/** @var string */
	public $name = "mastodon";

	public function __construct(IClientService $httpClient) {
		$this->httpClient = $httpClient->NewClient();
	}

	/**
	 * Returns if this provider supports this contact
	 *
	 * @param {array} contact info
	 *
	 * @return bool
	 */
	public function supportsContact(array $contact):bool {
		if (!array_key_exists("X-SOCIALPROFILE",$contact)) {
			return false;
		}
		$profiles = $this->getProfileIds($contact);
		return isset($profiles) && count($profiles) > 0;
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
	 * @param {array} contact information
	 *
	 * @return string|null
	 */
	public function getImageUrl(string $profileUrl):?string {
		try {
			$result = $this->httpClient->get($profileUrl);

			$htmlResult = new \DOMDocument();
			$htmlResult->loadHTML($result->getBody());
			$img = $htmlResult->getElementById('profile_page_avatar');
			if (!is_null($img)) {
				return $img->getAttribute("data-original");
			}
			return null;
		} catch (\Exception $e) {
			return null;
		}
	}

	/**
	 * Returns all possible profile ids for contact
	 *
	 * @param {array} contact information
	 *
	 * @return array of possible profileIds
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
				$user_server = explode('@', $candidate);
				$candidate = 'https://' . array_pop($user_server) . '/@' . array_pop($user_server);
			}
		} catch (\Exception $e) {
			$candidate = null;
		}
		return $candidate;
	}
}
