<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Service;

use OCP\IConfig;
use OCP\IGroup;
use OCP\IGroupManager;
use OCP\IUser;
use OCP\Share\IManager as IShareManager;

class GroupSharingService {
	public function __construct(
		private IConfig $config,
		private IGroupManager $groupManager,
		private IShareManager $shareManager,
	) {
	}

	public function isGroupSharingAllowed(IUser $user): bool {
		if (!$this->shareManager->allowGroupSharing()) {
			return false;
		}

		$userGroups = $this->groupManager->getUserGroups($user);
		$userGroupNames = array_map(static fn (IGroup $group) => $group->getGID(), $userGroups);

		$excludeGroupList = json_decode($this->config->getAppValue('core', 'shareapi_exclude_groups_list', '[]'));
		$excludeGroups = $this->config->getAppValue('core', 'shareapi_exclude_groups');

		// "no"    => Allow sharing for everyone
		// "yes"   => Exclude listed groups from sharing
		// "allow" => Limit sharing to listed groups
		return match ($excludeGroups) {
			'yes' => count(array_intersect($userGroupNames, $excludeGroupList)) === 0,
			'allow' => count(array_intersect($userGroupNames, $excludeGroupList)) > 0,
			default => true,
		};
	}
}
