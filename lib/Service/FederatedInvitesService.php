<?php

/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Service;

use OCA\Contacts\AppInfo\Application;
use OCA\Contacts\ConfigLexicon;
use OCA\Contacts\Db\FederatedInviteMapper;
use OCA\Contacts\Exception\ContactAlreadyExistsException;
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

	// The default route of the invite accept dialog
	public const OCM_INVITE_ACCEPT_DIALOG_ROUTE = '/ocm/invite-accept-dialog';
	public const OCM_INVITE_ACCEPT_DIALOG_ROUTE_NAME = 'contacts.federatedinvites.inviteacceptdialog';
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

	public function isOcmInvitesEnabled(): bool {
		return $this->appConfig->getValueBool(Application::APP_ID, ConfigLexicon::OCM_INVITES_ENABLED);
	}

	public function isOptionalMailEnabled(): bool {
		return $this->appConfig->getValueBool(Application::APP_ID, ConfigLexicon::OCM_INVITES_OPTIONAL_MAIL);
	}

	public function isEncodedCopyButtonEnabled(): bool {
		return $this->appConfig->getValueBool(Application::APP_ID, ConfigLexicon::OCM_INVITES_ENCODED_COPY_BUTTON);
	}

	public function isSsrfGuardDisabled(): bool {
		return $this->appConfig->getValueBool(Application::APP_ID, ConfigLexicon::OCM_INVITES_DISABLE_SSRF_GUARD);
	}

	/**
	 * The set of admin-toggleable OCM bool keys. Used to gate writes from the
	 * admin settings page so callers cannot persist arbitrary keys.
	 */
	public const OCM_INVITES_BOOL_KEYS = [
		ConfigLexicon::OCM_INVITES_OPTIONAL_MAIL,
		ConfigLexicon::OCM_INVITES_ENCODED_COPY_BUTTON,
		ConfigLexicon::OCM_INVITES_DISABLE_SSRF_GUARD,
	];

	/**
	 * Persist an OCM admin bool toggle. Returns true when the key is allowed.
	 */
	public function setOcmInviteBoolSetting(string $key, bool $value): bool {
		if (!in_array($key, self::OCM_INVITES_BOOL_KEYS, true)) {
			return false;
		}
		$this->appConfig->setValueBool(Application::APP_ID, $key, $value);
		return true;
	}

	/**
	 * Returns all OCM invites config flags for frontend consumption
	 */
	public function getOcmInvitesConfig(): array {
		return [
			'optionalMail' => $this->isOptionalMailEnabled(),
			'encodedCopyButton' => $this->isEncodedCopyButtonEnabled(),
		];
	}

	/**
	 * Returns the provider's server FQDN.
	 * @return string the FQDN
	 */
	public function getProviderFQDN(): string {
		$serverUrl = $this->urlGenerator->getAbsoluteURL('/');
		$parts = parse_url($serverUrl);
		if (!is_array($parts) || !isset($parts['host']) || $parts['host'] === '') {
			return '';
		}
		return $parts['host'];
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
	 * Creates a new contact and adds it to the address book of the user with the specified userId or,
	 * if null, the current logged-in user.
	 *
	 * @param string cloudId
	 * @param string email
	 * @param string name
	 * @param ?string userId id of the user for which to create the new contact.
	 * If null, this is the current logged-in user.
	 *
	 * @return string the ref of the new contact in the form
	 *                'contactURI~addressBookUri'
	 * @throws ContactAlreadyExistsException
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
			$this->logger->error('Error creating contact for user {userId} with cloud id {cloudId}.', [
				'app' => Application::APP_ID,
				'userId' => $localUserId,
				'cloudId' => $cloudId,
			]);
			return null;
		}
		$this->logger->info('Created new contact with UID: ' . $newContact['UID'] . ' for user with UID: ' . $localUserId, ['app' => Application::APP_ID]);
		$addressBookUri = CardDavBackend::PERSONAL_ADDRESSBOOK_URI;
		if (isset($newContact['ADDRESSBOOK_URI']) && is_string($newContact['ADDRESSBOOK_URI']) && $newContact['ADDRESSBOOK_URI'] !== '') {
			$addressBookUri = $newContact['ADDRESSBOOK_URI'];
		}
		$contactRef = $newContact['UID'] . '~' . $addressBookUri;
		return $contactRef;
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

		if (trim($recipientProvider) === '' || trim($userID) === '' || trim($email) === '' || trim($name) === '') {
			return new JSONResponse(['message' => 'Could not accept invite, user data is incomplete.', 'error' => true], Http::STATUS_BAD_REQUEST);
		}

		try {
			$invitation = $this->federatedInviteMapper->findByToken($token);
		} catch (DoesNotExistException) {
			$response = ['message' => 'Invalid or non existing token', 'error' => true];
			$response = new JSONResponse($response, Http::STATUS_BAD_REQUEST);
			$response->throttle();
			return $response;
		}

		if ($invitation->isAccepted() === true) {
			$response = ['message' => 'Invite already accepted', 'error' => true];
			return new JSONResponse($response, Http::STATUS_CONFLICT);
		}

		if ($invitation->getExpiredAt() !== null && $updated > $invitation->getExpiredAt()) {
			$response = ['message' => 'Invitation expired', 'error' => true];
			return new JSONResponse($response, Http::STATUS_BAD_REQUEST);
		}
		// Note that there is no user session; local user is the sender of the invite
		$localUser = $this->userManager->get($invitation->getUserId());
		if ($localUser === null) {
			$response = ['message' => 'Invalid or non existing token', 'error' => true];
			$response = new JSONResponse($response, Http::STATUS_BAD_REQUEST);
			$response->throttle();
			return $response;
		}

		$sharedFromEmail = $localUser->getEMailAddress();
		if ($sharedFromEmail === null) {
			$response = ['message' => 'Invalid or non existing token', 'error' => true];
			$response = new JSONResponse($response, Http::STATUS_BAD_REQUEST);
			$response->throttle();
			return $response;
		}
		$sharedFromDisplayName = $localUser->getDisplayName();

		$response = ['userID' => $localUser->getUID(), 'email' => $sharedFromEmail, 'name' => $sharedFromDisplayName];
		$status = Http::STATUS_OK;

		$cloudId = $userID . '@' . $this->addressHandler->removeProtocolFromUrl($recipientProvider);
		try {
			$contactRef = $this->createNewContact(
				$cloudId,
				$email,
				$name,
				$localUser->getUID()
			);
			if ($contactRef === null) {
				$this->logger->error('Could not create sender-side contact after invite acceptance.', [
					'app' => Application::APP_ID,
					'userId' => $localUser->getUID(),
					'cloudId' => $cloudId,
					'token' => $token,
				]);
				return new JSONResponse([
					'message' => 'Could not create sender-side contact after invite acceptance.',
					'error' => true,
				], Http::STATUS_INTERNAL_SERVER_ERROR);
			}
		} catch (ContactAlreadyExistsException $e) {
			// A duplicate sender-side contact should not block invite acceptance.
			$this->logger->info("Contact with cloud id $cloudId already exists. ");
		}

		$invitation->setAccepted(true);
		$invitation->setRecipientEmail($email);
		$invitation->setRecipientName($name);
		$invitation->setRecipientProvider($recipientProvider);
		$invitation->setRecipientUserId($userID);
		$invitation->setAcceptedAt($updated);
		$invitation = $this->federatedInviteMapper->update($invitation);
		return new JSONResponse($response, $status);
	}
}
