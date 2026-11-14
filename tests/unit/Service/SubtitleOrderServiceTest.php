<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Service;

use ChristophWurst\Nextcloud\Testing\TestCase;
use InvalidArgumentException;
use OCA\Contacts\AppInfo\Application;
use OCA\Contacts\ConfigLexicon;
use OCP\Config\IUserConfig;
use PHPUnit\Framework\MockObject\MockObject;

class SubtitleOrderServiceTest extends TestCase {
	private SubtitleOrderService $service;
	private IUserConfig&MockObject $userConfig;

	protected function setUp(): void {
		parent::setUp();

		$this->userConfig = $this->createMock(IUserConfig::class);

		$this->service = new SubtitleOrderService($this->userConfig);
	}

	public function testGetOrderReturnsTheStoredOrder(): void {
		$this->userConfig->method('getValueArray')
			->with('user1', Application::APP_ID, ConfigLexicon::SUBTITLE_ORDER, SubtitleOrderService::DEFAULT_ORDER)
			->willReturn(['tel', 'org', 'email']);

		$order = $this->service->getOrder('user1');

		$this->assertSame(['tel', 'org', 'email'], $order);
	}

	public function testGetOrderFallsBackToTheDefaultForAnInvalidStoredOrder(): void {
		$this->userConfig->method('getValueArray')
			->willReturn(['tel', 'tel', 'email']);

		$order = $this->service->getOrder('user1');

		$this->assertSame(SubtitleOrderService::DEFAULT_ORDER, $order);
	}

	public function testSetOrderStoresAValidOrder(): void {
		$this->userConfig->expects(self::once())
			->method('setValueArray')
			->with('user1', Application::APP_ID, ConfigLexicon::SUBTITLE_ORDER, ['email', 'tel', 'org']);

		$this->service->setOrder('user1', ['email', 'tel', 'org']);
	}

	public static function invalidOrderProvider(): array {
		return [
			'empty' => [[]],
			'a field missing' => [['tel', 'org']],
			'a field twice' => [['tel', 'org', 'org']],
			'an unknown field' => [['tel', 'org', 'adr']],
			'an extra field' => [['tel', 'org', 'email', 'adr']],
			'not a list' => [['first' => 'tel', 'second' => 'org', 'third' => 'email']],
			'not strings' => [[1, 2, 3]],
		];
	}

	/**
	 * @dataProvider invalidOrderProvider
	 */
	public function testSetOrderRefusesAnInvalidOrder(array $order): void {
		$this->userConfig->expects(self::never())
			->method('setValueArray');
		$this->expectException(InvalidArgumentException::class);

		$this->service->setOrder('user1', $order);
	}
}
