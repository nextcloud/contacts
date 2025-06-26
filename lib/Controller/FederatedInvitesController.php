<?php

/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Controller;

use Exception;
use OC\App\CompareVersion;
use OCA\DAV\CardDAV\CardDavBackend;
use OCA\Contacts\AppInfo\Application;
use OCA\Contacts\Db\FederatedInvite;
use OCA\Contacts\Db\FederatedInviteMapper;
use OCA\Contacts\Service\FederatedInvitesService;
use OCA\Contacts\Service\GroupSharingService;
use OCA\Contacts\Service\SocialApiService;
use OCA\FederatedFileSharing\AddressHandler;
use OCP\App\IAppManager;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Utility\ITimeFactory;
use OCP\Contacts\IManager;
use OCP\Http\Client\IClientService;
use OCP\IConfig;
use OCP\IInitialStateService;
use OCP\IL10N;
use OCP\IRequest;
use OCP\IURLGenerator;
use OCP\IUserManager;
use OCP\IUserSession;
use OCP\L10N\IFactory;
use Psr\Log\LoggerInterface;
use Sabre\DAV\UUIDUtil;

/**
 * Controller for federated invites related routes.
 * 
 */

class FederatedInvitesController extends PageController
{

	public function __construct(
		IRequest $request,
		private AddressHandler $addressHandler,
		private CardDavBackend $cardDavBackend,
		private FederatedInviteMapper $federatedInviteMapper,
		private FederatedInvitesService $federatedInvitesService,
		private IAppManager $appManager,
		private IClientService $httpClient,
		private IConfig $config,
		private IInitialStateService $initialStateService,
		private IFactory $languageFactory,
		private IManager $contactsManager,
		private IUserSession $userSession,
		private SocialApiService $socialApiService,
		private ITimeFactory $timeFactory,
		private CompareVersion $compareVersion,
		private GroupSharingService $groupSharingService,
		private IL10N $il10,
		private IURLGenerator $urlGenerator,
		private IUserManager $userManager,
		private LoggerInterface $logger,
	) {
		parent::__construct(
			$request,
			$federatedInvitesService,
			$config,
			$initialStateService,
			$languageFactory,
			$userSession,
			$socialApiService,
			$appManager,
			$compareVersion,
			$groupSharingService,
			$logger,
		);
	}

	/**
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 *
	 * Returns all open (not yet accepted) invites.
	 * 
	 * @return DataResponse
	 */
	public function getInvites(): DataResponse {
		$_invites = $this->federatedInviteMapper->findOpenInvitesByUiddd($this->userSession->getUser()->getUID());
		$invites = [];
		foreach ($_invites as $invite) {
			if ($invite instanceof FederatedInvite) {
				array_push(
					$invites, 
					$invite->jsonSerialize()
				);
			}
		}
		return new DataResponse($invites, Http::STATUS_OK);
	}

	/**
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 *
	 * Sets the token and provider states which triggers display of the invite accept dialog.
	 * 
	 * @param string $token
	 * @param string $provider
	 */
	public function inviteAcceptDialog(string $token = "", string $provider = ""): TemplateResponse {
		$this->initialStateService->provideInitialState(Application::APP_ID, 'inviteToken', $token);
		$this->initialStateService->provideInitialState(Application::APP_ID, 'inviteProvider', $provider);
		// TODO read from config
		$this->initialStateService->provideInitialState(Application::APP_ID, 'acceptInviteDialogUrl', '/ocm/invite-accept-dialog');

		return $this->index();
	}

	/**
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 *
	 * Creates an invitation to exchange contact info for the user with the specified uid.
	 * 
	 * @param string $email the recipient email to send the invitation to
	 * @param string $message the optional message to send with the invitation 
	 * @return DataResponse with data signature ['token' | 'error'] - the token of the invitation or an error message in case of error
	 */
	public function createInvite(string $email = null, string $message = null): DataResponse {
		if(!isset($email)) {
			return new DataResponse(['error' => 'Recipient email is required'], Http::STATUS_BAD_REQUEST);
		}
		$invite = new FederatedInvite();
		$invite->setUserId($this->userSession->getUser()->getUID());
		$token = UUIDUtil::getUUID();
		$invite->setToken($token);
		$invite->setCreatedAt($this->timeFactory->getTime());
		// TODO get expiration period from config
		// take 30 days
		$invite->setExpiredAt($invite->getCreatedAt() + 2592000000);
		$invite->setRecipientEmail($email);
		$invite->setAccepted(false);
		$this->federatedInviteMapper->insert($invite);

		// TODO send email

		return new DataResponse(['token' => $token], Http::STATUS_OK);
	}

	/**
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 * 
	 * Accepts the invite and creates a new contact for it.
	 * On success the user will be redirected to the contacts list with the newly created contact in focus.
	 * 
	 * @param string $token the token of the invite
	 * @param string $provider the provider of the sender of the invite 
	 * @return DataResponse with data signature ['contact' | 'error'] - the new contact url or an error message in case of error
	 */
	public function inviteAccepted(string $token = "", string $provider = ""): DataResponse {
		if ($token === "" || $provider === "") {
			$this->logger->error("Both token and provider must be specified. Received: token=$token, provider=$provider", ['app' => Application::APP_ID]);
			return new DataResponse(['error' => 'Both token and provider must be specified.'], Http::STATUS_NOT_FOUND);
		}
		try {
			// delegate further to OCM /invite-accepted
			// this returns a response with the following data signature: ['userID', 'email', 'name']
			// @link https://cs3org.github.io/OCM-API/docs.html?branch=v1.1.0&repo=OCM-API&user=cs3org#/paths/~1invite-accepted/post
			$localUser = $this->userSession->getUser();
			$client = $this->httpClient->newClient();
			$responseData = null;
			$response = $client->post(
				// TODO get the correct url in an appropriate manner
				"http://nc-ocm.nl/ocm/invite-accepted",
				[
					'body' =>
					[
						'recipientProvider' => $provider,
						'token' => $token,
						'userId' => $localUser->getUID(),
						'email' => $localUser->getEMailAddress(),
						'name' => $localUser->getDisplayName(),
					],
					'connect_timeout' => 10,
				]
			);
			$responseData = $response->getBody();
			$data = json_decode($responseData, true);
			$newContact = $this->socialApiService->createFederatedContact(
				// the ocm address: nextcloud cloud id format
				$data['userID'] . "@" . $this->addressHandler->removeProtocolFromUrl($provider),
				$data['email'],
				$data['name'],
				$localUser->getUID(),
			);
			if (!isset($newContact)) {
				return new DataResponse(['error' => 'An unexpected error occurred trying to accept invite: could not create new contact'], Http::STATUS_NOT_FOUND);
			}
			$this->logger->info("Created new contact with UID: " . $newContact['UID'] . " for user with UID: " . $localUser->getUID(), ['app' => Application::APP_ID]);

			$contact = $newContact['UID'] . "~" . CardDavBackend::PERSONAL_ADDRESSBOOK_URI;
			$url = $this->urlGenerator->getAbsoluteURL(
				$this->urlGenerator->linkToRoute('contacts.page.index') . $this->il10->t('All contacts') . '/' . $contact
			);
			return new DataResponse(['contact' => $url], Http::STATUS_OK);
		} catch (\GuzzleHttp\Exception\RequestException $e) {
			$this->logger->error("/invite-accepted returned an error: " . print_r($responseData, true), ['app' => Application::APP_ID]);
			/**
			 * 400: Invalid or non existing token
			 * 409: Invite already accepted
			 */
			$statusCode = $e->getCode();
			switch ($statusCode) {
				case Http::STATUS_BAD_REQUEST:
					return new DataResponse(['error' => 'Invalid, non existing or expired token'], $e->getCode());
				case Http::STATUS_CONFLICT:
					return new DataResponse(['error' => 'Invite already accepted'], $e->getCode());
			}
			$this->logger->error("An unexpected error occurred accepting invite with token=$token and provider=$provider. Stacktrace: " . $e->getTraceAsString(), ['app' => Application::APP_ID]);
			return new DataResponse(['error' => 'An unexpected error occurred trying to accept invite.'], Http::STATUS_NOT_FOUND);
		} catch (Exception $e) {
			$this->logger->error("An unexpected error occurred accepting invite with token=$token and provider=$provider. Stacktrace: " . $e->getTraceAsString(), ['app' => Application::APP_ID]);
			return new DataResponse(['error' => 'An unexpected error occurred trying to accept invite'], Http::STATUS_NOT_FOUND);
		}
	}
}
