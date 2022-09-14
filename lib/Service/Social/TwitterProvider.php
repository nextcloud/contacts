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

use GuzzleHttp\Exception\RequestException;
use GuzzleHttp\RequestOptions;
use OC\AppFramework\Http\Request;
use OCA\Contacts\AppInfo\Application;
use OCP\Http\Client\IClientService;
use Psr\Log\LoggerInterface;

class TwitterProvider implements ISocialProvider {
	/** @var IClientService */
	private $httpClient;

	/** @var LoggerInterface */
	private $logger;

	/** @var string */
	public $name = 'twitter';

	public function __construct(IClientService $httpClient,
								LoggerInterface $logger) {
		$this->httpClient = $httpClient->NewClient();
		$this->logger = $logger;
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
	 * Returns the profile-picture url
	 *
	 * @param {array} contact information
	 *
	 * @return array
	 */
	public function getImageUrls(array $contact):array {
		$profileIds = $this->getProfileIds($contact);
		$urls = [];
		foreach ($profileIds as $profileId) {
			$recipe = 'https://twitter.com/{socialId}';
			$connector = str_replace('{socialId}', $profileId, $recipe);
			$connector = $this->getFromHtml($connector, 'profile_image');
			$urls[] = $connector;
		}
		return $urls;
	}

	/**
	 * Returns the profile-id
	 *
	 * @param {string} the value from the contact's x-socialprofile
	 *
	 * @return string
	 */
	protected function cleanupId(string $candidate):string {
		$candidate = basename($candidate);
		if ($candidate[0] === '@') {
			$candidate = substr($candidate, 1);
		}
		return $candidate;
	}

	/**
	 * Returns all possible profile ids for contact
	 *
	 * @param {array} contact information
	 *
	 * @return array of string profile ids
	 */
	protected function getProfileIds($contact):array {
		$socialprofiles = $contact['X-SOCIALPROFILE'];
		$profileIds = [];
		if (isset($socialprofiles)) {
			foreach ($socialprofiles as $profile) {
				if (strtolower($profile['type']) == $this->name) {
					$profileIds[] = $this->cleanupId($profile['value']);
				}
			}
		}
		return $profileIds;
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
			$result = $this->httpClient->get($url, [
				RequestOptions::HEADERS => [
					// Make the request as google bot so twitter display the full static html page
					'User-Agent' => 'Googlebot/2.1'
				]
			]);

			$htmlResult = new \DOMDocument();
			$htmlResult->loadHTML($result->getBody());
			$imgs = $htmlResult->getElementsByTagName('img');
			foreach ($imgs as $img) {
				foreach ($img->attributes as $attr) {
					$value = $attr->nodeValue;
					if (strpos($value, $desired)) {
						$value = str_replace('normal', '400x400', $value);
						return $value;
					}
				}
			}
			return null;
		} catch (RequestException $e) {
			$this->logger->debug('Error fetching twitter urls', [
				'app' => Application::APP_ID,
				'exception' => $e
			]);
			return null;
		}
	}
}
