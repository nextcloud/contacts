<?php

/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
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
