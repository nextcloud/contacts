<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2017 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Cron;

use OCA\Contacts\AppInfo\Application;

use OCP\AppFramework\Utility\ITimeFactory;
use OCP\BackgroundJob\IJobList;
use OCP\BackgroundJob\TimedJob;
use OCP\IConfig;
use OCP\IUser;
use OCP\IUserManager;
use function method_exists;

class SocialUpdateRegistration extends TimedJob {
	private $appName;

	/**
	 * RegisterSocialUpdate constructor.
	 *
	 * @param ITimeFactory $time
	 * @param IUserManager $userManager
	 * @param IConfig $config
	 * @param IJobList $jobList
	 */
	public function __construct(
		ITimeFactory $time,
		private IUserManager $userManager,
		private IConfig $config,
		private IJobList $jobList,
	) {
		parent::__construct($time);

		$this->appName = Application::APP_ID;
		$this->userManager = $userManager;
		$this->config = $config;
		$this->jobList = $jobList;

		// Run once a week
		$this->setInterval(7 * 24 * 60 * 60);
		/**
		 * @todo remove check with 24+
		 */
		if (method_exists($this, 'setTimeSensitivity')) {
			$this->setTimeSensitivity(self::TIME_INSENSITIVE);
		}
	}

	/**
	 * @inheritDoc
	 */
	protected function run($argument) {
		// check if admin allows for social updates:
		$syncAllowedByAdmin = $this->config->getAppValue($this->appName, 'allowSocialSync', 'yes');
		if (!($syncAllowedByAdmin === 'yes')) {
			return;
		}

		$this->userManager->callForSeenUsers(function (IUser $user) {
			// check that user opted-in:
			$bgSyncEnabledByUser = $this->config->getUserValue($user->getUID(), $this->appName, 'enableSocialSync', 'no');
			if ($bgSyncEnabledByUser === 'yes' && $user->isEnabled()) {
				$this->jobList->add(SocialUpdate::class, [
					'userId' => $user->getUID(),
					'offsetBook' => null,
					'offsetContact' => null
				]);
			}
		});
	}
}
