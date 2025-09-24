<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Listener;

use Exception;
use OCA\CloudFederationAPI\Events\FederatedInviteAcceptedEvent;
use OCA\Contacts\AppInfo\Application;
use OCA\Contacts\Service\SocialApiService;
use OCA\FederatedFileSharing\AddressHandler;
use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;
use Psr\Log\LoggerInterface;

/**
 * Listens to the federated invite accepted event.
 * Catching the event should lead to the creation of the new remote contact from the invite.
 */
class FederatedInviteAcceptedListener implements IEventListener {

	public function __construct(
		private AddressHandler $addressHandler,
		private SocialApiService $socialApiService,
		private LoggerInterface $logger,
	) {
	}

	/**
	 * Handles the FederatedInviteAcceptedEvent that is dispatched by the server when an invite has been accepted.
	 * The accepted invitation is enclosed in the event.
	 * Creates and saves a new contact in the address book of the sender of the invitation.
	 *
	 * @param Event $event an event of type FederatedInviteAcceptedEvent
	 * @return void
	 */
	public function handle(Event $event): void {
		// Note that there is no user session and we create a contact for the sender of the invite.
		if ($event instanceof FederatedInviteAcceptedEvent) {
			// the event holds the invitation
			$invitation = $event->getInvitation();
			// the sender uid
			$userId = $invitation->getUserId();
			try {
				$newContact = $this->socialApiService->createFederatedContact(
					$invitation->getRecipientUserId() . '@' . $this->addressHandler->removeProtocolFromUrl($invitation->getRecipientProvider()),
					$invitation->getRecipientEmail(),
					$invitation->getRecipientName(),
					$userId,
				);
				if (isset($newContact)) {
					$this->logger->info('Created new contact with UID: ' . $newContact['UID'] . " for user with UID: $userId", ['app' => Application::APP_ID]);
				}
			} catch (Exception $e) {
				$this->logger->error('An unexpected error occurred creating a new contact. Stacktrace: ' . $e->getTraceAsString(), ['app' => Application::APP_ID]);
			}
		} else {
			$this->logger->error('Expected an event of type FederatedInviteAcceptedEvent, but got ' . get_class($event) . ' instead.', ['app' => Application::APP_ID]);
		}
	}
}
