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

class TwitterProvider implements ISocialProvider {

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
		$candidate = basename($candidate);
		if ($candidate[0] === '@') {
			$candidate = substr($candidate, 1);
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
	public function getImageUrl(string $profileId):?string {
		$recipe = 'https://mobile.twitter.com/{socialId}';
		$connector = str_replace("{socialId}", $profileId, $recipe);
		$connector = $this->getFromHtml($connector, '_normal');
		return $connector;
	}
	
	/**
	 * extracts desired value from an html page
	 *
	 * @param {string} url the target from where to fetch the content
	 * @param {String} the desired catchword to filter for
	 *
	 * @returns {String} the extracted value (first match) or null if not present
	 */
	protected function getFromHtml(string $url, string $desired) : ?string {
		try {
			$result = $this->httpClient->get($url);

			$htmlResult = new \DOMDocument();
			$htmlResult->loadHTML($result->getBody());
			$imgs = $htmlResult->getElementsByTagName('img');
			foreach ($imgs as $img) {
				foreach ($img->attributes as $attr) {
					$value = $attr->nodeValue;
					if (strpos($value, $desired)) {
						$value = str_replace("normal", "400x400", $value);
						return $value;
					}
				}
			}
			return null;
		} catch (Exception $e) {
			return null;
		}
	}
}
