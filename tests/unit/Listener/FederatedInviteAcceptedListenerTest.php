<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Tests\Unit\Listener;

use OCA\Contacts\Listener\FederatedInviteAcceptedListener;
use OCA\Contacts\Service\FederatedInvitesService;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\JSONResponse;
use OCP\EventDispatcher\Event;
use OCP\OCM\Events\OCMEndpointRequestEvent;
use PHPUnit\Framework\MockObject\MockObject;
use Psr\Log\LoggerInterface;
use Test\TestCase;

class FederatedInviteAcceptedListenerTest extends TestCase {

	private FederatedInvitesService&MockObject $federatedInvitesService;
	private LoggerInterface&MockObject $logger;

	private FederatedInviteAcceptedListener $listener;

	protected function setUp(): void {
		parent::setUp();

		$this->federatedInvitesService = $this->createMock(FederatedInvitesService::class);
		$this->logger = $this->createMock(LoggerInterface::class);

		$this->listener = new FederatedInviteAcceptedListener(
			$this->federatedInvitesService,
			$this->logger,
		);
	}

	private function newEvent(string $capability = 'invite-accepted', ?array $payload = null): OCMEndpointRequestEvent {
		return new OCMEndpointRequestEvent('POST', $capability, $payload);
	}

	public function testHandleIgnoresUnrelatedEvent(): void {
		$this->federatedInvitesService->expects(self::never())->method('inviteAccepted');
		$this->logger->expects(self::never())->method('error');

		$this->listener->handle(new Event());
	}

	public function testHandleIgnoresUnrelatedCapability(): void {
		$event = $this->newEvent('notifications', [
			'token' => 'token-123',
		]);

		$this->federatedInvitesService->expects(self::never())->method('inviteAccepted');
		$this->logger->expects(self::never())->method('error');

		$this->listener->handle($event);

		self::assertNull($event->getResponse());
	}

	public function testHandleDelegatesInviteAcceptedPayloadToService(): void {
		$payload = [
			'recipientProvider' => 'https://nextcloud2.docker',
			'token' => 'token-123',
			'userID' => 'michiel',
			'email' => 'michiel@example.test',
			'name' => 'Michiel',
		];
		$event = $this->newEvent(payload: $payload);
		$response = new JSONResponse(['userID' => 'einstein'], Http::STATUS_OK);

		$this->federatedInvitesService->expects(self::once())
			->method('inviteAccepted')
			->with(
				'https://nextcloud2.docker',
				'token-123',
				'michiel',
				'michiel@example.test',
				'Michiel',
			)
			->willReturn($response);
		$this->logger->expects(self::never())->method('error');

		$this->listener->handle($event);

		self::assertSame($response, $event->getResponse());
	}

	public function testHandleRejectsEmptyEmailBeforeCallingService(): void {
		$payload = [
			'recipientProvider' => 'https://nextcloud2.docker',
			'token' => 'token-123',
			'userID' => 'michiel',
			'email' => '',
			'name' => 'Michiel',
		];
		$event = $this->newEvent(payload: $payload);

		$this->federatedInvitesService->expects(self::never())->method('inviteAccepted');
		$this->logger->expects(self::once())
			->method('error')
			->with(
				'Could not accept invite, user data is incomplete.',
				self::callback(static function (array $context): bool {
					return ($context['app'] ?? null) === 'contacts'
						&& in_array('email', $context['payloadKeys'] ?? [], true);
				}),
			);

		$this->listener->handle($event);

		self::assertInstanceOf(JSONResponse::class, $event->getResponse());
		self::assertSame(Http::STATUS_NOT_FOUND, $event->getResponse()?->getStatus());
	}

	public function testHandleRejectsMalformedPayloadBeforeCallingService(): void {
		$payload = [
			'recipientProvider' => 'https://nextcloud2.docker',
			'token' => '',
			'userID' => 'michiel',
			'email' => 'michiel@example.test',
			'name' => 'Michiel',
		];
		$event = $this->newEvent(payload: $payload);

		$this->federatedInvitesService->expects(self::never())->method('inviteAccepted');
		$this->logger->expects(self::once())
			->method('error')
			->with(
				'Could not accept invite, user data is incomplete.',
				self::callback(static function (array $context): bool {
					return ($context['app'] ?? null) === 'contacts'
						&& in_array('token', $context['payloadKeys'] ?? [], true);
				}),
			);

		$this->listener->handle($event);

		self::assertInstanceOf(JSONResponse::class, $event->getResponse());
		self::assertSame(Http::STATUS_NOT_FOUND, $event->getResponse()?->getStatus());
		self::assertSame(
			'Could not accept invite, user data is incomplete.',
			$event->getResponse()?->getData()['message'],
		);
	}
}
