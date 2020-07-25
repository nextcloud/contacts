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

class InstagramProvider implements ISocialProvider {

	/** @var IClientService */
	private $httpClient;

	public function __construct(IClientService $httpClient) {
		$this->httpClient = $httpClient->NewClient();
	}
	
	/**
	 * Returns the profile-id
	 *
	 * @param {string} the value from the contact's x-socialprofile
	 *
	 * @return string
	 */
	public function cleanupId(string $candidate):string {
		return basename($candidate);
	}

	/**
	 * Returns the profile-picture url
	 *
	 * @param {string} profileId the profile-id
	 *
	 * @return string|null
	 */
	public function getImageUrl(string $profileId):?string {
		$recipe = 'https://www.instagram.com/{socialId}/?__a=1';
		$connector = str_replace("{socialId}", $profileId, $recipe);
		$connector = $this->getFromJson($connector, 'graphql->user->profile_pic_url_hd');
		return $connector;
	}
	
	/**
	 * extracts desired value from a json
	 *
	 * @param {string} url the target from where to fetch the json
	 * @param {String} the desired key to filter for (nesting possible with '->')
	 *
	 * @returns {String} the extracted value or null if not present
	 */
	protected function getFromJson(string $url, string $desired) : ?string {
		try {
			$result = $this->httpClient->get($url);

			$jsonResult = json_decode($result->getBody(),true);
			$location = explode('->' , $desired);
			foreach ($location as $loc) {
				if (!isset($jsonResult[$loc])) {
					return null;
				}
				$jsonResult = $jsonResult[$loc];
			}
			return $jsonResult;
		} catch (Exception $e) {
			return null;
		}
	}
}
