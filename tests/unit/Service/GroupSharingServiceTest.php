<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace unit\Service;

use ChristophWurst\Nextcloud\Testing\TestCase;
use OCA\Contacts\Service\GroupSharingService;
use OCP\IConfig;
use OCP\IGroup;
use OCP\IGroupManager;
use OCP\IUser;
use OCP\Share\IManager as IShareManager;
use PHPUnit\Framework\MockObject\MockObject;

class GroupSharingServiceTest extends TestCase {
	private GroupSharingService $service;
	private IConfig|MockObject $config;
	private IGroupManager|MockObject $groupManager;
	private IShareManager|MockObject $shareManager;

	protected function setUp(): void {
		parent::setUp();

		$this->config = $this->createMock(IConfig::class);
		$this->groupManager = $this->createMock(IGroupManager::class);
		$this->shareManager = $this->createMock(IShareManager::class);

		$this->service = new GroupSharingService(
			$this->config,
			$this->groupManager,
			$this->shareManager,
		);
	}

	public function provideTestIsGroupSharingAllowed(): array {
		return [
			// Basic group sharing is forbidden (-> short circuit)
			[false, false, '["group1"]', 'no'],
			[false, false, '["group1"]', 'yes'],
			[false, false, '["group1"]', 'allow'],

			// Basic sharing is allowed and allow sharing with every group
			[true, true, '["group1"]', 'no'],
			[true, true, '[]', 'no'],
			[true, true, '["group99"]', 'no'],

			// Basic sharing is allowed and user's group is excluded
			[false, true, '["group1"]', 'yes'],
			[false, true, '["group2"]', 'yes'],
			[false, true, '["group2", "group3"]', 'yes'],

			// Basic sharing is allowed and user's group is not excluded
			[true, true, '["group3"]', 'yes'],
			[true, true, '[]', 'yes'],

			// Basic sharing is allowed and user's group is included
			[true, true, '["group1"]', 'allow'],
			[true, true, '["group2"]', 'allow'],
			[true, true, '["group2", "group3"]', 'allow'],

			// Basic sharing is allowed and user's group is not included
			[false, true, '["group3"]', 'allow'],
			[false, true, '[]', 'allow'],
		];
	}

	/** @dataProvider provideTestIsGroupSharingAllowed */
	public function testIsGroupSharingAllowed(
		bool $expected,
		bool $allowGroupSharing,
		string $excludeGroupList,
		string $excludeGroups,
	): void {
		$user = $this->createMock(IUser::class);
		$group1 = $this->createMock(IGroup::class);
		$group1->method('getGID')
			->willReturn('group1');
		$group2 = $this->createMock(IGroup::class);
		$group2->method('getGID')
			->willReturn('group2');

		$this->shareManager->expects(self::once())
			->method('allowGroupSharing')
			->willReturn($allowGroupSharing);
		if ($allowGroupSharing) {
			$this->groupManager->expects(self::once())
				->method('getUserGroups')
				->with($user)
				->willReturn([$group1, $group2]);
			$this->config->expects(self::exactly(2))
				->method('getAppValue')
				->willReturnMap([
					['core', 'shareapi_exclude_groups_list', '[]', $excludeGroupList],
					['core', 'shareapi_exclude_groups', '', $excludeGroups],
				]);
		} else {
			$this->groupManager->expects(self::never())
				->method('getUserGroups');
			$this->config->expects(self::never())
				->method('getAppValue');
		}

		$actual = $this->service->isGroupSharingAllowed($user);
		$this->assertEquals($expected, $actual);
	}
}
