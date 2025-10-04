<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Cron;

use OCA\Contacts\AppInfo\Application;
use OCA\Contacts\IWayfProvider;
use OCP\AppFramework\Utility\ITimeFactory;
use OCP\BackgroundJob\TimedJob;
use OCP\IAppConfig;

class UpdateOcmProviders extends TimedJob {
	// Run every five minutes
	private int $expire_time = 5 * 60;
	public function __construct(
		ITimeFactory $time,
		private IAppConfig $appConfig,
		private IWayfProvider $wayfProvider,
	) {
		parent::__construct($time);
		$this->setInterval($this->expire_time);
	}

	protected function run($argument) {
		$data = $this->wayfProvider->getMeshProviders();
		$data['expires'] = time() + $this->expire_time;
		$json = json_encode($data);
		$this->appConfig->setValueString(Application::APP_ID, 'federations_cache', $json);
	}
}
