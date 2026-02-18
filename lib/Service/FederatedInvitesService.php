<?php

/**
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Service;

use Exception;
use OCA\Contacts\AppInfo\Application;
use OCA\Contacts\Db\FederatedInviteMapper;
use OCA\Contacts\Exception\ContactExistsException;
use OCA\DAV\CardDAV\CardDavBackend;
use OCA\FederatedFileSharing\AddressHandler;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\JSONResponse;
use OCP\AppFramework\Utility\ITimeFactory;
use OCP\IAppConfig;
use OCP\IURLGenerator;
use OCP\IUserManager;
use OCP\IUserSession;
use Psr\Log\LoggerInterface;

class FederatedInvitesService {

	// Is OCM invites capability enabled by default ?
	private const OCM_INVITES_ENABLED_BY_DEFAULT = false;
	// The default route of the invite accept dialog
	public const OCM_INVITE_ACCEPT_DIALOG_ROUTE = '/ocm/invite-accept-dialog';
	// The default expiration period of a new invite in seconds, ie. 30 days
	private const INVITE_EXPIRATION_PERIOD_SECONDS = 2592000;

	public function __construct(
		private AddressHandler $addressHandler,
		private IAppConfig $appConfig,
		private ITimeFactory $timeFactory,
		private IURLGenerator $urlGenerator,
		private IUserManager $userManager,
		private IUserSession $userSession,
		private FederatedInviteMapper $federatedInviteMapper,
		private LoggerInterface $logger,
		private SocialApiService $socialApiService,
	) {
	}

	public function isOcmInvitesEnabled():bool {
		return $this->appConfig->getValueBool(Application::APP_ID, 'ocm_invites_enabled', FederatedInvitesService::OCM_INVITES_ENABLED_BY_DEFAULT);
	}

	/**
	 * Returns the provider's server FQDN.
	 * @return string the FQDN
	 */
	public function getProviderFQDN(): string {
		$serverUrl = $this->urlGenerator->getAbsoluteURL('/');
		$fqdn = parse_url($serverUrl)['host'];
		return $fqdn;
	}

	/**
	 * Returns the expiration date.
	 * @param int $creationDate
	 * @return int the expiration date
	 */
	public function getInviteExpirationDate(int $creationDate): int {
		return $creationDate + self::INVITE_EXPIRATION_PERIOD_SECONDS;
	}

	/**
	 * This is the invite-accepted capability implementation.
	 */
	public function inviteAccepted(string $recipientProvider, string $token, string $userID, string $email, string $name): JSONResponse {
		$this->logger->debug('Processing share invitation for ' . $userID . ' with token ' . $token . ' and email ' . $email . ' and name ' . $name);

		$updated = $this->timeFactory->getTime();

		if ($token === '') {
			$response = new JSONResponse(['message' => 'Invalid or non existing token', 'error' => true], Http::STATUS_BAD_REQUEST);
			$response->throttle();
			return $response;
		}

		try {
			$invitation = $this->federatedInviteMapper->findByToken($token);
		} catch (DoesNotExistException) {
			$response = ['message' => 'Invalid or non existing token', 'error' => true];
			$status = Http::STATUS_BAD_REQUEST;
			$response = new JSONResponse($response, $status);
			$response->throttle();
			return $response;
		}

		if ($invitation->isAccepted() === true) {
			$response = ['message' => 'Invite already accepted', 'error' => true];
			$status = Http::STATUS_CONFLICT;
			return new JSONResponse($response, $status);
		}

		if ($invitation->getExpiredAt() !== null && $updated > $invitation->getExpiredAt()) {
			$response = ['message' => 'Invitation expired', 'error' => true];
			$status = Http::STATUS_BAD_REQUEST;
			return new JSONResponse($response, $status);
		}
		// Note that there is no user session; local user is the sender of the invite
		$localUser = $this->userManager->get($invitation->getUserId());
		if ($localUser === null) {
			$response = ['message' => 'Invalid or non existing token', 'error' => true];
			$status = Http::STATUS_BAD_REQUEST;
			$response = new JSONResponse($response, $status);
			$response->throttle();
			return $response;
		}

		$sharedFromEmail = $localUser->getEMailAddress();
		if ($sharedFromEmail === null) {
			$response = ['message' => 'Invalid or non existing token', 'error' => true];
			$status = Http::STATUS_BAD_REQUEST;
			$response = new JSONResponse($response, $status);
			$response->throttle();
			return $response;
		}
		$sharedFromDisplayName = $localUser->getDisplayName();

		$response = ['userID' => $localUser->getUID(), 'email' => $sharedFromEmail, 'name' => $sharedFromDisplayName];
		$status = Http::STATUS_OK;

		$invitation->setAccepted(true);
		$invitation->setRecipientEmail($email);
		$invitation->setRecipientName($name);
		$invitation->setRecipientProvider($recipientProvider);
		$invitation->setRecipientUserId($userID);
		$invitation->setAcceptedAt($updated);
		$invitation = $this->federatedInviteMapper->update($invitation);

		// now create contact based on the supplied parameters (by the receiver of the invite)
		try {
			// the ocm address: nextcloud cloud id format
			$cloudId = $invitation->getRecipientUserId() . '@' . $this->addressHandler->removeProtocolFromUrl($invitation->getRecipientProvider());
			$contactRef = $this->createNewContact(
				$cloudId,
				$email,
				$name,
				$localUser->getUID()
			);
		} catch (ContactExistsException $e) {
			// this is not an OCM exception
			$this->logger->info("Contact with cloud id $cloudId already exists. ");
		}
		return new JSONResponse($response, $status);
	}

	/**
	 * Creates a new contact and adds it to the address book of the user with the specified userId or,
	 * if null, the current logged-in user.
	 *
	 * @param string cloudId
	 * @param string email
	 * @param string name
	 * @param ?string userId id of the user for which to create the new contact.
	 * If null, this is the current logged-in user.
	 *
	 * @return string the ref of the new contact in the form 'contactURI~PERSONAL_ADDRESSBOOK_URI'
	 * @throws ContactExistsException
	 */
	public function createNewContact(string $cloudId, string $email, string $name, ?string $userId): ?string {
		$localUserId = $userId ? $userId : $this->userSession->getUser()->getUID();
		$newContact = $this->socialApiService->createContact(
			$cloudId,
			$email,
			$name,
			$localUserId,
		);
		if (!isset($newContact)) {
			$this->logger->error('Error creating contact .', ['app' => Application::APP_ID]);
			return null;
		}
		$this->logger->info('Created new contact with UID: ' . $newContact['UID'] . ' for user with UID: ' . $localUserId, ['app' => Application::APP_ID]);
		$contactRef = $newContact['UID'] . '~' . CardDavBackend::PERSONAL_ADDRESSBOOK_URI;
		return $contactRef;
	}
}
