<?php
/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Service\Social;

use OCP\Http\Client\IClient;
use OCP\Http\Client\IClientService;

class FacebookProvider implements ISocialProvider {
	/** @var IClient */
	private $httpClient;

	/** @var string */
	public $name = 'facebook';

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
			$recipe = 'https://graph.facebook.com/{socialId}/picture?width=720';
			$connector = str_replace('{socialId}', $profileId, $recipe);
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
		if (!is_numeric($candidate)) {
			$candidate = $this->findFacebookId($candidate);
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
	protected function getProfiles(array $contact):array {
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
	protected function getProfileIds(array $contact):array {
		$profiles = $this->getProfiles($contact);
		$profileIds = [];
		foreach ($profiles as $profile) {
			$profileIds[] = $this->cleanupId($profile);
		}
		return $profileIds;
	}

	/**
	 * Tries to get the facebook id from facebook profile name
	 * e. g. "zuck" --> "4"
	 * Fallback: return profile name
	 * (will give oauth error from facebook except if profile is public)
	 *
	 * @param {string} profileName the user's profile name
	 *
	 * @return string
	 */
	protected function findFacebookId(string $profileName):string {
		try {
			$result = $this->httpClient->get('https://facebook.com/'.$profileName);
			if ($result->getStatusCode() !== 200) {
				return $profileName;
			}
			$htmlResult = $result->getBody();

			$entity_id = '/.*"entity_id":"([0-9]+)".*/';
			if (preg_match($entity_id, $htmlResult, $matches)) {
				return($matches[1]);
			}
			// keyword not found - page changed?
			return $profileName;
		} catch (\Exception $e) {
			return $profileName;
		}
	}
}
