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

class InstagramProvider implements ISocialProvider {
	/** @var IClientService */
	private $httpClient;

	/** @var LoggerInterface */
	private $logger;

	/** @var string */
	public $name = 'instagram';

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
		$socialprofiles = $this->getProfiles($contact);
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
			$recipe = 'https://www.instagram.com/{socialId}/?__a=1';
			$connector = str_replace('{socialId}', $profileId, $recipe);
			$connector = $this->getFromJson($connector, 'graphql->user->profile_pic_url_hd');
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
		$candidate = preg_replace('/^' . preg_quote('x-apple:', '/') . '/', '', $candidate);
		return basename($candidate);
	}

	/**
	 * Returns all possible profile urls for contact
	 *
	 * @param {array} contact information
	 *
	 * @return array of string profile urls
	 */
	protected function getProfiles($contact):array {
		$socialprofiles = $contact['X-SOCIALPROFILE'];
		$profiles = [];
		if (isset($socialprofiles)) {
			foreach ($socialprofiles as $profile) {
				if (strtolower($profile['type']) == $this->name) {
					$profiles[] = $profile['value'];
				}
			}
		}
		return $profiles;
	}

	/**
	 * Returns all possible profile ids for contact
	 *
	 * @param {array} contact information
	 *
	 * @return array of string profile ids
	 */
	protected function getProfileIds($contact):array {
		$socialprofiles = $this->getProfiles($contact);
		$profileIds = [];
		foreach ($socialprofiles as $profile) {
			$profileIds[] = $this->cleanupId($profile);
		}
		return $profileIds;
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
			$result = $this->httpClient->get($url, [
				RequestOptions::HEADERS => [
					// Make the request as google bot so insta displays the full static html page
					'User-Agent' => 'Googlebot/2.1'
				]
			]);

			$jsonResult = json_decode($result->getBody(), true);
			$location = explode('->', $desired);
			foreach ($location as $loc) {
				if (!isset($jsonResult[$loc])) {
					return null;
				}
				$jsonResult = $jsonResult[$loc];
			}
			return $jsonResult;
		} catch (RequestException $e) {
			$this->logger->debug('Error fetching instagram urls', [
				'app' => Application::APP_ID,
				'exception' => $e
			]);
			return null;
		}
	}
}
