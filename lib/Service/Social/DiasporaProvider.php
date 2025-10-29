<?php

/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Service\Social;

use OCP\Http\Client\IClient;
use OCP\Http\Client\IClientService;

class DiasporaProvider implements ISocialProvider {
	/** @var IClient */
	private $httpClient;

	/** @var bool */
	private $looping;

	/** @var string */
	public $name = 'diaspora';

	public function __construct(IClientService $httpClient) {
		$this->httpClient = $httpClient->newClient();
		$this->looping = false;
	}

	/**
	 * Returns if this provider supports this contact
	 *
	 * @param {array} contact info
	 *
	 * @return bool
	 */
	#[\Override]
	public function supportsContact(array $contact):bool {
		if (!array_key_exists('X-SOCIALPROFILE', $contact)) {
			return false;
		}
		$socialprofiles = $this->getProfileIds($contact);
		return count($socialprofiles) > 0;
	}

	/**
	 * Returns all possible profile-picture urls
	 *
	 * @param {array} contact information
	 *
	 * @return array
	 */
	#[\Override]
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
	 * @param {string} profileId the profile-id
	 *
	 * @return string|null
	 */
	protected function getImageUrl(string $profileUrl):?string {
		try {
			$result = $this->httpClient->get($profileUrl);
			$htmlResult = $result->getBody();

			$avatar = '/.*<logo>(.*)<\/logo>.*/';
			if (preg_match($avatar, $htmlResult, $matches)) {
				return (str_replace('small', 'large', $matches[1]));
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
		} catch (\Exception $e) {
			return null;
		}
	}

	/**
	 * Returns all possible profile ids for contact
	 *
	 * @param {array} contact information
	 *
	 * @return array
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
		try {
			if (strpos($candidate, 'http') !== 0) {
				$user_server = explode('@', $candidate);
				$candidate = 'https://' . array_pop($user_server) . '/public/' . array_pop($user_server) . '.atom';
			}
		} catch (\Exception $e) {
			$candidate = null;
		}
		return $candidate;
	}
}
