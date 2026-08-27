<?php

/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Settings;

use ChristophWurst\Nextcloud\Testing\TestCase;
use OCA\Contacts\Service\FederatedInvitesService;
use OCA\Contacts\Service\ImageResizer;
use OCA\Contacts\Service\Social\CompositeSocialProvider;
use OCA\Contacts\Service\SocialApiService;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Services\IInitialState;
use OCP\AppFramework\Utility\ITimeFactory;
use OCP\Contacts\IManager;
use OCP\Http\Client\IClientService;
use OCP\IConfig;
use OCP\IURLGenerator;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\MockObject\MockObject;
use Psr\Container\ContainerInterface;
use Psr\Log\LoggerInterface;

class AdminSettingsTest extends TestCase {
	private AdminSettings $settings;

	/** @var IInitialState|MockObject */
	private $initialState;

	/** @var IConfig&MockObject */
	private $config;

	/** @var SocialApiService|MockObject */
	private $socialApiService;

	/** @var FederatedInvitesService|MockObject */
	private $federatedInvitesService;

	protected function setUp(): void {
		parent::setUp();
		$this->initialState = $this->createMock(IInitialState::class);

		// $this->socialApiService = $this->createMock(SocialApiService::class);
		$this->config = $this->createMock(IConfig::class);
		$this->socialApiService = new SocialApiService(
			$this->createMock(CompositeSocialProvider::class),
			$this->createMock(ContainerInterface::class),
			$this->createMock(IManager::class),
			$this->config,
			$this->createMock(IClientService::class),
			$this->createMock(IURLGenerator::class),
			$this->createMock(ITimeFactory::class),
			$this->createMock(ImageResizer::class),
			$this->createMock(LoggerInterface::class),
		);

		$this->federatedInvitesService = $this->createMock(FederatedInvitesService::class);
		$this->settings = new AdminSettings($this->initialState, $this->socialApiService, $this->federatedInvitesService);
	}

	public static function allowSocialSyncProvider(): array {
		return [[true], [false]];
	}

	#[DataProvider('allowSocialSyncProvider')]
	public function testGetFormProvidesBooleanInitialState(bool $allowed): void {
		$this->config
			->method('getAppValue')
			->with('contacts', 'allowSocialSync', 'yes')
			->willReturn($allowed == true ? 'yes' : 'no');
		$this->initialState
			->expects($this->exactly(2))
			->method('provideInitialState');

		$result = $this->socialApiService->syncAllowedByAdmin();
		$this->assertEquals($allowed === true, $result);

		$form = $this->settings->getForm();
		$this->assertInstanceOf(TemplateResponse::class, $form);
	}
}
