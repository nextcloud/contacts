<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Cron;

use OCA\Contacts\Service\SocialApiService;

use OCP\AppFramework\Http;
use OCP\AppFramework\Utility\ITimeFactory;
use OCP\BackgroundJob\IJobList;
use OCP\BackgroundJob\QueuedJob;
use OCP\IUserManager;

class SocialUpdate extends QueuedJob {

	public function __construct(
		ITimeFactory $time,
		private SocialApiService $social,
		private IJobList $jobList,
		private IUserManager $userManager,
	) {
		parent::__construct($time);
	}

	#[\Override]
	protected function run($argument) {
		$userId = $argument['userId'];
		$offsetBook = $argument['offsetBook'] ?? null;
		$offsetContact = $argument['offsetContact'] ?? null;

		// No need to do anything if the user is gone anyway
		if (!$this->userManager->userExists($userId)) {
			return;
		}

		// update contacts with first available social media profile
		$result = $this->social->updateAddressbooks($userId, $offsetBook, $offsetContact);

		if ($result->getStatus() === Http::STATUS_PARTIAL_CONTENT) {
			// not finished; schedule a follow-up
			/** @var array $report */
			$report = $result->getData();
			$stoppedAtBook = $report[0]['stoppedAt']['addressBook'];
			$stoppedAtContact = $report[0]['stoppedAt']['contact'];

			// make sure the offset contact/address book are still existing
			if (!$this->social->existsAddressBook($stoppedAtBook, $userId)) {
				$stoppedAtBook = null;
			}
			if (!$this->social->existsContact($stoppedAtContact, $stoppedAtBook, $userId)) {
				$stoppedAtContact = null;
			}

			$this->jobList->add(self::class, [
				'userId' => $userId,
				'offsetBook' => $stoppedAtBook,
				'offsetContact' => $stoppedAtContact
			]);
		}
	}
}
