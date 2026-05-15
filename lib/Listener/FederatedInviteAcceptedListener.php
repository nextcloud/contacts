<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Listener;

use OCA\Contacts\AppInfo\Application;
use OCA\Contacts\Service\FederatedInvitesService;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\JSONResponse;
use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;
use OCP\OCM\Events\OCMEndpointRequestEvent;
use Psr\Log\LoggerInterface;

/**
 * Listener for the OCMEndpointRequestEvent.
 *
 * @template-implements IEventListener<OCMEndpointRequestEvent>
 */
class FederatedInviteAcceptedListener implements IEventListener {

	public function __construct(
		private FederatedInvitesService $federatedInvitesService,
		private LoggerInterface $logger,
	) {
	}

	/**
	 * Handles the OCMEndpointRequestEvent that is dispatched by the
	 * OCMRequestController as response to an OCM request. This handler manages
	 * the invite-accepted capability.
	 */
	public function handle(Event $event): void {
		if (!($event instanceof OCMEndpointRequestEvent)
			|| $event->getRequestedCapability() !== 'invite-accepted') {
			return;
		}

		$payload = $event->getPayload();
		if (!$this->isValidInviteAcceptedPayload($payload)) {
			$this->logger->error('Could not accept invite, user data is incomplete.', [
				'app' => Application::APP_ID,
				'payloadKeys' => array_keys($payload),
			]);
			$event->setResponse(new JSONResponse([
				'message' => 'Could not accept invite, user data is incomplete.',
			], Http::STATUS_NOT_FOUND));
			return;
		}

		$event->setResponse($this->federatedInvitesService->inviteAccepted(
			$payload['recipientProvider'],
			$payload['token'],
			$payload['userID'],
			$payload['email'],
			$payload['name'],
		));
	}

	/**
	 * The accepted-invite callback requires all documented OCM string fields to
	 * be present and non-empty.
	 *
	 * @param array<string, mixed> $payload
	 */
	private function isValidInviteAcceptedPayload(array $payload): bool {
		foreach (['recipientProvider', 'token', 'userID', 'email', 'name'] as $key) {
			if (!array_key_exists($key, $payload) || !is_string($payload[$key])) {
				return false;
			}
		}

		return trim($payload['recipientProvider']) !== ''
			&& trim($payload['token']) !== ''
			&& trim($payload['userID']) !== ''
			&& trim($payload['email']) !== ''
			&& trim($payload['name']) !== '';
	}
}
