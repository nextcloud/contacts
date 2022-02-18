<?php

declare(strict_types=1);

/**
 * @copyright 2020 Matthias Heinisch <nextcloud@matthiasheinisch.de>
 *
 * @author Matthias Heinisch <nextcloud@matthiasheinisch.de>
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */

namespace OCA\Contacts\Cron;

use OCA\Contacts\Service\SocialApiService;

use OCP\AppFramework\Http;
use OCP\AppFramework\Utility\ITimeFactory;
use OCP\BackgroundJob\IJobList;
use OCP\BackgroundJob\QueuedJob;

class SocialUpdate extends QueuedJob {
	/** @var SocialApiService */
	private $social;
	/** @var IJobList */
	private $jobList;

	public function __construct(ITimeFactory $time,
								SocialApiService $social,
								IJobList $jobList) {
		parent::__construct($time);
		$this->social = $social;
		$this->jobList = $jobList;
	}

	protected function run($arguments) {
		$userId = $arguments['userId'];
		$offsetBook = $arguments['offsetBook'] ?? null;
		$offsetContact = $arguments['offsetContact'] ?? null;

		// update contacts with first available social media profile
		$result = $this->social->updateAddressbooks($userId, $offsetBook, $offsetContact);

		if ($result->getStatus() === Http::STATUS_PARTIAL_CONTENT) {
			// not finished; schedule a follow-up
			$report = $result->getData();
			$stoppedAtBook = $report[0]['stoppedAt']['addressBook'];
			$stoppedAtContact = $report[0]['stoppedAt']['contact'];

			// make sure the offset contact/address book are still existing
			if ($this->social->existsAddressBook($stoppedAtBook, $userId) == false) {
				$stoppedAtBook = null;
			}
			if ($this->social->existsContact($stoppedAtContact, $stoppedAtBook, $userId) == false) {
				$stoppedAtContact = null;
			}
			// TODO: can we check the userId still exists?

			$this->jobList->add(self::class, [
				'userId' => $userId,
				'offsetBook' => $stoppedAtBook,
				'offsetContact' => $stoppedAtContact
			]);
		}
	}
}
