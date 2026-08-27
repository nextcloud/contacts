<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts;

use OCA\Contacts\AppInfo\Application;
use OCP\IAppConfig;

/**
 * The actual cache is implemented as an associative array containing all providers for each mesh and the expiration times:
 *  [
 * 	    'mesh 1' => [[...provider a...], [...]],
 *      'mesh 2' => [[...]],
 *      'expires' => 1781280096,
 *      'delta_expires' => 1781280095
 *  ]
 *
 * Two kinds of expirations are used:
 *  - FEDERATIONS_CACHE_EXPIRES - should result in a full cache rebuild
 *  - FEDERATIONS_CACHE_DELTA_EXPIRES - should update the cache for new or removed providers
 */
class MeshProvidersCache {

	private array $expirationTimes;

	public function __construct(
		private IAppConfig $appConfig,
	) {
		$data = $this->appConfig->getValueArray(Application::APP_ID, ConfigLexicon::FEDERATIONS_CACHE, [], true);
		$this->expirationTimes = [
			ConfigLexicon::FEDERATIONS_CACHE_EXPIRES => $data[ConfigLexicon::FEDERATIONS_CACHE_EXPIRES] ?? 0,
			ConfigLexicon::FEDERATIONS_CACHE_DELTA_EXPIRES => $data[ConfigLexicon::FEDERATIONS_CACHE_DELTA_EXPIRES] ?? 0
		];
	}

	/**
	 * Returns all federations as associative array:
	 *  [
	 * 	    'mesh_A' => [[...provider_a...], [...]],
	 *      'mesh_B' => [[...]],
	 *  ]
	 *
	 * @return array
	 */
	public function getFederations(): array {
		$data = $this->appConfig->getValueArray(Application::APP_ID, ConfigLexicon::FEDERATIONS_CACHE, [], true);
		unset($data[ConfigLexicon::FEDERATIONS_CACHE_EXPIRES]);
		unset($data[ConfigLexicon::FEDERATIONS_CACHE_DELTA_EXPIRES]);
		return $data;
	}

	/**
	 * Replaces the federations in the cache with the specified ones.
	 *
	 * @param array $federations
	 * @return void
	 */
	public function setFederations(array $federations): void {
		$cachedData = $this->appConfig->getValueArray(Application::APP_ID, ConfigLexicon::FEDERATIONS_CACHE, [], true);
		$federations[ConfigLexicon::FEDERATIONS_CACHE_EXPIRES] = $cachedData[ConfigLexicon::FEDERATIONS_CACHE_EXPIRES] ?? 0;
		$federations[ConfigLexicon::FEDERATIONS_CACHE_DELTA_EXPIRES] = $cachedData[ConfigLexicon::FEDERATIONS_CACHE_DELTA_EXPIRES] ?? 0;
		$this->appConfig->setValueArray(Application::APP_ID, ConfigLexicon::FEDERATIONS_CACHE, $federations, true);
	}

	/**
	 * Sets the expiration time of the specified kind to the specified time.
	 *
	 * @param string $expirationTimeKey the kind of expiration to set
	 * @param int $time
	 * @return void
	 */
	public function setExpirationTime(string $expirationTimeKey, int $time): void {
		$this->expirationTimes[$expirationTimeKey] = $time;
		$data = $this->appConfig->getValueArray(Application::APP_ID, ConfigLexicon::FEDERATIONS_CACHE, [], true);
		$data[$expirationTimeKey] = $time;
		$this->appConfig->setValueArray(Application::APP_ID, ConfigLexicon::FEDERATIONS_CACHE, $data, true);
	}

	/**
	 * Check the expiration time.
	 *
	 * @param $expirationTimeKey the key for which to check the expiration time
	 * @return bool
	 */
	public function hasExpired(string $expirationTimeKey): bool {
		$cachedData = $this->appConfig->getValueArray(Application::APP_ID, ConfigLexicon::FEDERATIONS_CACHE, [], true);
		$deltaExpirationTime = $cachedData[ConfigLexicon::FEDERATIONS_CACHE_DELTA_EXPIRES] ?? 0;
		if ($expirationTimeKey === ConfigLexicon::FEDERATIONS_CACHE_DELTA_EXPIRES && $deltaExpirationTime < time()) {
			return true;
		}
		$expirationTime = $cachedData[ConfigLexicon::FEDERATIONS_CACHE_EXPIRES] ?? 0;
		if ($expirationTimeKey === ConfigLexicon::FEDERATIONS_CACHE_EXPIRES && $expirationTime < time()) {
			return true;
		}
		return false;
	}
}
