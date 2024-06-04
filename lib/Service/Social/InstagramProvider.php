<?php
/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Service\Social;

use GuzzleHttp\Exception\RequestException;
use GuzzleHttp\RequestOptions;
use OC\AppFramework\Http\Request;
use OCA\Contacts\AppInfo\Application;
use OCP\Http\Client\IClient;
use OCP\Http\Client\IClientService;
use Psr\Log\LoggerInterface;

class InstagramProvider implements ISocialProvider {
	/** @var IClient */
	private $httpClient;

	/** @var LoggerInterface */
	private $logger;

	/** @var string */
	public $name = 'instagram';

	public function __construct(IClientService $httpClient,
		LoggerInterface $logger) {
		$this->httpClient = $httpClient->newClient();
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
