<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Listener;

use OCA\Contacts\AppInfo\Application;
use OCA\Contacts\Service\FederatedInvitesService;
use OCA\Contacts\Service\SocialApiService;
use OCA\FederatedFileSharing\AddressHandler;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\JSONResponse;
use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;
use OCP\OCM\Events\OCMEndpointRequestEvent;
use Psr\Log\LoggerInterface;

/**
 * Listener for the OCMEndpointRequestEvent.
 */
/** @template-implements IEventListener<OCMEndpointRequestEvent> */
class FederatedInviteAcceptedListener implements IEventListener {

	public function __construct(
		private AddressHandler $addressHandler,
		private FederatedInvitesService $federatedInvitesService,
		private SocialApiService $socialApiService,
		private LoggerInterface $logger,
	) {
	}

	/**
	 * Handles the OCMEndpointRequestEvent that is dispatched by the OCMRequestController as response to an OCM request.
	 * This handler will handle the capability: invite-accepted
	 *
	 * @param Event $event an event of type OCMEndpointRequestEvent
	 * @return void
	 */
	public function handle(Event $event): void {
		if ($event instanceof \OCP\OCM\Events\OCMEndpointRequestEvent
			&& $event->getRequestedCapability() === 'invite-accepted') {

			/** @var JSONResponse */
			$response = null;

			$recipientProvider = $event->getPayload()['recipientProvider'];
			$token = $event->getPayload()['token'];
			$userID = $event->getPayload()['userID'];
			$email = $event->getPayload()['email'];
			$name = $event->getPayload()['name'];

			if ($recipientProvider === '' || $userID === '' || $email === '' || $name === '') {
				$this->logger->error("All of these must be set: recipientProvider: $recipientProvider, email: $email, userId: $userID, name: $name", ['app' => Application::APP_ID]);
				$response = new JSONResponse(['message' => 'Could not accept invite, user data is incomplete.'], Http::STATUS_NOT_FOUND);
			}

			$response = $this->federatedInvitesService->inviteAccepted(
				$recipientProvider,
				$token,
				$userID,
				$email,
				$name
			);

			$event->setResponse($response);
		}
		return;
	}
}
