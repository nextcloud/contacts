<?php

/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Settings;

use ChristophWurst\Nextcloud\Testing\TestCase;
use OCA\Contacts\Service\SocialApiService;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Services\IInitialState;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\MockObject\MockObject;

class AdminSettingsTest extends TestCase {
	private AdminSettings $settings;

	/** @var IInitialState|MockObject */
	private $initialState;

	/** @var SocialApiService|MockObject */
	private $socialApiService;

	protected function setUp(): void {
		parent::setUp();
		$this->initialState = $this->createMock(IInitialState::class);
		$this->socialApiService = $this->createMock(SocialApiService::class);
		$this->settings = new AdminSettings($this->initialState, $this->socialApiService);
	}

	public static function allowSocialSyncProvider(): array {
		return [[true], [false]];
	}

	#[DataProvider('allowSocialSyncProvider')]
	public function testGetFormProvidesBooleanInitialState(bool $allowed): void {
		$this->socialApiService
			->method('syncAllowedByAdmin')
			->willReturn($allowed);
		$this->initialState
			->expects($this->once())
			->method('provideInitialState')
			->with('allowSocialSync', $allowed);

		$form = $this->settings->getForm();
		$this->assertInstanceOf(TemplateResponse::class, $form);
	}
}
