<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Tests\Unit\Listener;

use OCA\Contacts\AppInfo\Application;
use OCA\Contacts\ConfigLexicon as ContactsConfigLexicon;
use OCA\Contacts\Listener\OcmDiscoveryListener;
use OCA\Contacts\Service\FederatedInvitesService;
use OCP\IAppConfig;
use OCP\IURLGenerator;
use OCP\OCM\Events\LocalOCMDiscoveryEvent;
use OCP\OCM\Events\ResourceTypeRegisterEvent;
use OCP\OCM\IOCMProvider;
use PHPUnit\Framework\MockObject\MockObject;
use Psr\Log\LoggerInterface;
use Test\TestCase;

class OcmDiscoveryListenerTest extends TestCase {
	private IAppConfig&MockObject $appConfig;
	private IURLGenerator&MockObject $urlGenerator;
	private LoggerInterface&MockObject $logger;

	private OcmDiscoveryListener $listener;

	protected function setUp(): void {
		parent::setUp();

		$this->appConfig = $this->createMock(IAppConfig::class);
		$this->urlGenerator = $this->createMock(IURLGenerator::class);
		$this->logger = $this->createMock(LoggerInterface::class);

		$this->listener = new OcmDiscoveryListener(
			$this->appConfig,
			$this->urlGenerator,
			$this->logger,
		);
	}

	public function testHandleReturnsEarlyWhenInvitesDisabled(): void {
		$provider = $this->createMock(IOCMProvider::class);

		$this->appConfig->expects($this->once())
			->method('getValueBool')
			->with(Application::APP_ID, ContactsConfigLexicon::OCM_INVITES_ENABLED)
			->willReturn(false);
		$this->appConfig->expects($this->never())->method('getValueString');
		$this->urlGenerator->expects($this->never())->method('linkToRouteAbsolute');
		$provider->expects($this->never())->method('setCapabilities');
		$provider->expects($this->never())->method('setInviteAcceptDialog');
		$this->logger->expects($this->never())->method('warning');

		$this->listener->handle($this->newOcmDiscoveryEvent($provider));
	}

	public function testHandleRegistersInviteCapabilityAndDialogRoute(): void {
		$provider = $this->createMock(IOCMProvider::class);

		$this->appConfig->expects($this->once())
			->method('getValueBool')
			->with(Application::APP_ID, ContactsConfigLexicon::OCM_INVITES_ENABLED)
			->willReturn(true);
		$this->urlGenerator->expects($this->once())
			->method('linkToRouteAbsolute')
			->with(FederatedInvitesService::OCM_INVITE_ACCEPT_DIALOG_ROUTE_NAME)
			->willReturn('https://cloud.example/ocm/invite-dialog');
		$provider->expects($this->once())
			->method('setCapabilities')
			->with(['invite-accepted'])
			->willReturnSelf();
		$provider->expects($this->once())
			->method('setInviteAcceptDialog')
			->with('https://cloud.example/ocm/invite-dialog')
			->willReturnSelf();
		$this->logger->expects($this->never())->method('warning');

		$this->listener->handle($this->newOcmDiscoveryEvent($provider));
	}

	public function testHandleWarnsWhenDialogRouteResolutionFails(): void {
		$provider = $this->createMock(IOCMProvider::class);

		$exception = new \RuntimeException('route boom');
		$this->appConfig->expects($this->once())
			->method('getValueBool')
			->with(Application::APP_ID, ContactsConfigLexicon::OCM_INVITES_ENABLED)
			->willReturn(true);
		$this->urlGenerator->expects($this->once())
			->method('linkToRouteAbsolute')
			->with(FederatedInvitesService::OCM_INVITE_ACCEPT_DIALOG_ROUTE_NAME)
			->willThrowException($exception);
		$provider->expects($this->once())
			->method('setCapabilities')
			->with(['invite-accepted'])
			->willReturnSelf();
		$provider->expects($this->never())->method('setInviteAcceptDialog');

		$this->logger->expects($this->once())
			->method('warning')
			->with(
				$this->stringContains('route cannot be resolved'),
				$this->callback(static function (array $context) use ($exception): bool {
					return ($context['app'] ?? null) === Application::APP_ID
						&& ($context['route'] ?? null) === FederatedInvitesService::OCM_INVITE_ACCEPT_DIALOG_ROUTE_NAME
						&& ($context['exception'] ?? null) === $exception;
				}),
			);

		$this->listener->handle($this->newOcmDiscoveryEvent($provider));
	}

	public function testHandleDeprecatedResourceTypeEventDoesNotMutateProvider(): void {
		$provider = $this->createMock(IOCMProvider::class);

		$this->appConfig->expects($this->once())
			->method('getValueBool')
			->with(Application::APP_ID, ContactsConfigLexicon::OCM_INVITES_ENABLED)
			->willReturn(true);
		$this->urlGenerator->expects($this->never())->method('linkToRouteAbsolute');
		$provider->expects($this->never())->method('setCapabilities');
		$provider->expects($this->never())->method('setInviteAcceptDialog');
		$this->logger->expects($this->never())->method('warning');

		$this->listener->handle(new ResourceTypeRegisterEvent($provider));
	}

	private function newOcmDiscoveryEvent(IOCMProvider $provider): LocalOCMDiscoveryEvent {
		return new LocalOCMDiscoveryEvent($provider);
	}
}
