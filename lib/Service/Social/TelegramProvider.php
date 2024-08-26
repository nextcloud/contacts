<?php
/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Service\Social;

use GuzzleHttp\Exception\RequestException;
use GuzzleHttp\RequestOptions;
use OCA\Contacts\AppInfo\Application;
use OCP\Http\Client\IClient;
use OCP\Http\Client\IClientService;
use Psr\Log\LoggerInterface;

class TelegramProvider implements ISocialProvider {
	/** @var IClient */
	private $httpClient;

	/** @var LoggerInterface */
	private $logger;

	/** @var string */
	public $name = 'telegram';

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
		if (!array_key_exists('IMPP', $contact)) {
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
			$recipe = 'https://t.me/{socialId}';
			$connector = str_replace('{socialId}', $profileId, $recipe);
			$connector = $this->getFromHtml($connector, 'tgme_page_photo_image');
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
		$candidate = basename($candidate, '.t.me');
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
		$socialprofiles = $contact['IMPP'];
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
					'User-Agent' => 'Googlebot/2.1'
				]
			]);

			$htmlResult = new \DOMDocument();
			$htmlResult->loadHTML($result->getBody());
			$imgs = $htmlResult->getElementsByTagName('img');
			foreach ($imgs as $img) {
				foreach ($img->attributes as $attr) {
					$value = $attr->nodeValue;
					if (strcmp($value, $desired)) {
						return $value;
					}
				}
			}
			return null;
		} catch (RequestException $e) {
			$this->logger->debug('Error fetching telegram urls', [
				'app' => Application::APP_ID,
				'exception' => $e
			]);
			return null;
		}
	}
}
