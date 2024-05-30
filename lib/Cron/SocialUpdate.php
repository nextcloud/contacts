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
	/** @var SocialApiService */
	private $social;
	/** @var IJobList */
	private $jobList;
	/** @var IUserManager */
	private $userManager;

	public function __construct(ITimeFactory $time,
		SocialApiService $social,
		IJobList $jobList,
		IUserManager $userManager) {
		parent::__construct($time);
		$this->social = $social;
		$this->jobList = $jobList;
		$this->userManager = $userManager;
	}

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
