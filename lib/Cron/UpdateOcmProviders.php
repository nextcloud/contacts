<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Cron;

use OCA\Contacts\ConfigLexicon;
use OCA\Contacts\MeshProvidersCache;
use OCA\Contacts\WayfProvider;
use OCP\AppFramework\Utility\ITimeFactory;
use OCP\BackgroundJob\IJob;
use OCP\BackgroundJob\TimedJob;

/**
 * This job runs periodically to do a complete refresh of the list of providers in the mesh providers cache.
 * The update is specified as follows:
 *  - Retrieve the current list of providers from each Mesh Directory Service and update the cache to keep that list.
 *    (Mesh Directory Services are specified as value, a string of url's separated by commas, of the 'mesh_providers_service' config key)
 *  - Additionally, do a discovery on all providers and update the cache with the result.
 */
class UpdateOcmProviders extends TimedJob {
	// Run every 24 hours
	private int $expire_time = 60 * 60;

	public function __construct(
		ITimeFactory $time,
		private MeshProvidersCache $cache,
		private WayfProvider $wayfProvider,
	) {
		parent::__construct($time);
		$this->setInterval($this->expire_time);
		$this->setTimeSensitivity(IJob::TIME_INSENSITIVE);
	}

	#[\Override]
	protected function run($argument) {
		$this->wayfProvider->updateMeshProvidersCache(ConfigLexicon::FEDERATIONS_CACHE_EXPIRES);
		$this->cache->setExpirationTime(ConfigLexicon::FEDERATIONS_CACHE_EXPIRES, time() + $this->expire_time);
	}
}
