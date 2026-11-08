<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Controller;

use ChristophWurst\Nextcloud\Testing\TestCase;
use InvalidArgumentException;
use OCA\Contacts\Service\SubtitleOrderService;
use OCP\AppFramework\Http;
use OCP\IRequest;
use PHPUnit\Framework\MockObject\MockObject;

class SettingsControllerTest extends TestCase {
	private IRequest&MockObject $request;
	private SubtitleOrderService&MockObject $subtitleOrderService;

	protected function setUp(): void {
		parent::setUp();

		$this->request = $this->createMock(IRequest::class);
		$this->subtitleOrderService = $this->createMock(SubtitleOrderService::class);
	}

	private function buildController(?string $userId): SettingsController {
		return new SettingsController($this->request, $userId, $this->subtitleOrderService);
	}

	public function testSetSubtitleOrderStoresTheOrder(): void {
		$this->subtitleOrderService->expects(self::once())
			->method('setOrder')
			->with('user1', ['tel', 'org', 'email']);

		$response = $this->buildController('user1')->setSubtitleOrder(['tel', 'org', 'email']);

		$this->assertSame(Http::STATUS_OK, $response->getStatus());
		$this->assertSame(['tel', 'org', 'email'], $response->getData());
	}

	public function testSetSubtitleOrderRefusesAnInvalidOrder(): void {
		$this->subtitleOrderService->method('setOrder')
			->willThrowException(new InvalidArgumentException('invalid'));

		$response = $this->buildController('user1')->setSubtitleOrder(['tel']);

		$this->assertSame(Http::STATUS_BAD_REQUEST, $response->getStatus());
	}

	public function testSetSubtitleOrderNeedsALoggedInUser(): void {
		$this->subtitleOrderService->expects(self::never())
			->method('setOrder');

		$response = $this->buildController(null)->setSubtitleOrder(['tel', 'org', 'email']);

		$this->assertSame(Http::STATUS_UNAUTHORIZED, $response->getStatus());
	}
}
