<?php

/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Controller;

use Exception;
use GuzzleHttp\Exception\RequestException;
use OC\App\CompareVersion;
use OCA\Contacts\AppInfo\Application;
use OCA\Contacts\Db\FederatedInvite;
use OCA\Contacts\Db\FederatedInviteMapper;
use OCA\Contacts\Exception\ContactExistsException;
use OCA\Contacts\Service\FederatedInvitesService;
use OCA\Contacts\Service\GroupSharingService;
use OCA\Contacts\Service\SocialApiService;
use OCA\Contacts\WayfProvider;
use OCA\FederatedFileSharing\AddressHandler;
use OCP\App\IAppManager;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\Attribute\AnonRateLimit;
use OCP\AppFramework\Http\Attribute\BruteForceProtection;
use OCP\AppFramework\Http\Attribute\FrontpageRoute;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\AppFramework\Http\Attribute\NoCSRFRequired;
use OCP\AppFramework\Http\Attribute\PublicPage;
use OCP\AppFramework\Http\Attribute\UserRateLimit;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Http\JSONResponse;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Services\IInitialState;
use OCP\AppFramework\Utility\ITimeFactory;
use OCP\Contacts\IManager;
use OCP\Defaults;
use OCP\Http\Client\IClientService;
use OCP\IConfig;
use OCP\IL10N;
use OCP\IRequest;
use OCP\IURLGenerator;
use OCP\IUserManager;
use OCP\IUserSession;
use OCP\L10N\IFactory;
use OCP\Mail\IMailer;
use OCP\Mail\IMessage;
use OCP\OCM\Exceptions\OCMProviderException;
use OCP\OCM\Exceptions\OCMRequestException;
use OCP\OCM\IOCMDiscoveryService;
use OCP\Util;
use Psr\Log\LoggerInterface;
use Sabre\DAV\UUIDUtil;
use Throwable;

/**
 * Controller for federated invites related routes.
 *
 */

class FederatedInvitesController extends PageController {
	public function __construct(
		IRequest $request,
		private AddressHandler $addressHandler,
		private Defaults $defaults,
		private FederatedInviteMapper $federatedInviteMapper,
		private FederatedInvitesService $federatedInvitesService,
		private IAppManager $appManager,
		private IClientService $httpClient,
		private IConfig $config,
		private IInitialState $initialState,
		private IFactory $languageFactory,
		private IManager $contactsManager,
		private IMailer $mailer,
		private IOCMDiscoveryService $discovery,
		private IUserSession $userSession,
		private WayfProvider $wayfProvider,
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
			$initialState,
			$languageFactory,
			$userSession,
			$socialApiService,
			$appManager,
			$compareVersion,
			$groupSharingService,
		);
	}

	/**
	 * Returns all open (not yet accepted) invites.
	 *
	 * @return JSONResponse
	 */
	#[NoAdminRequired]
	#[FrontpageRoute(verb: 'GET', url: '/ocm/invitations')]
	public function getInvites(): JSONResponse {
		if (($disabled = $this->requireOcmInvitesEnabled()) !== null) {
			return $disabled;
		}

		$uid = $this->userSession->getUser()->getUID();
		try {
			$_invites = $this->federatedInviteMapper->findOpenInvitesByUid($uid);
			$invites = [];
			foreach ($_invites as $invite) {
				if ($invite instanceof FederatedInvite) {
					array_push(
						$invites,
						$invite->jsonSerialize()
					);
				}
			}
			return new JSONResponse($invites, Http::STATUS_OK);
		} catch (Exception $e) {
			$this->logger->error("An unexpected error occurred loading invites for user with uid=$uid. Stacktrace: " . $e->getTraceAsString(), ['app' => Application::APP_ID]);
			return new JSONResponse([
				'code' => 'ocm_invites_fetch_failed',
				'message' => 'Could not load invites.',
			], Http::STATUS_INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Deletes the invite with the specified token.
	 *
	 * @param string $token the token of the invite to delete
	 * @return JSONResponse with data signature ['token' | 'message'] - the token of the deleted invitation or an error message in case of error
	 */
	#[NoAdminRequired]
	#[FrontpageRoute(verb: 'DELETE', url: '/ocm/invitations/{token}')]
	public function deleteInvite(string $token): JSONResponse {
		if (($disabled = $this->requireOcmInvitesEnabled()) !== null) {
			return $disabled;
		}

		try {
			$uid = $this->userSession->getUser()->getUID();
			$invite = $this->federatedInviteMapper->findInviteByTokenAndUid($token, $uid);
			$this->federatedInviteMapper->delete($invite);
			return new JSONResponse(['token' => $token], Http::STATUS_OK);
		} catch (DoesNotExistException $e) {
			$this->logger->warning("Could not find invite with token=$token for user with uid=$uid", ['app' => Application::APP_ID]);
			return new JSONResponse(['message' => 'Invite not found'], Http::STATUS_NOT_FOUND);
		} catch (Exception $e) {
			$this->logger->error("An unexpected error occurred deleting invite with token=$token. Stacktrace: " . $e->getTraceAsString(), ['app' => Application::APP_ID]);
			return new JSONResponse(['message' => 'An unexpected error occurred trying to delete the invite'], Http::STATUS_INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Results in displaying the invite accept dialog upon following the invite link.
	 *
	 * @param string $token
	 * @param string $providerDomain
	 * @return TemplateResponse
	 */
	#[NoAdminRequired]
	#[NoCSRFRequired]
	#[FrontpageRoute(verb: 'GET', url: FederatedInvitesService::OCM_INVITE_ACCEPT_DIALOG_ROUTE)]
	public function inviteAcceptDialog(string $token = '', string $providerDomain = ''): TemplateResponse {
		$this->initialState->provideInitialState('inviteToken', $token);
		$this->initialState->provideInitialState('inviteProvider', $providerDomain);
		$this->initialState->provideInitialState('acceptInviteDialogUrl', FederatedInvitesService::OCM_INVITE_ACCEPT_DIALOG_ROUTE);

		return $this->index();
	}

	/**
	 * Creates an invitation to exchange contact info with the remote user.
	 *
	 * @param string $email the recipient email address to send the invitation to (optional)
	 * @param string $message the optional message to send with the invitation
	 * @param string $note optional note/label for identifying the invite
	 * @param bool $ccSender whether to send a copy of the invite to the sender
	 * @return JSONResponse with data signature ['invite' | 'message'] - the invite url or an error message in case of error.
	 */
	#[NoAdminRequired]
	#[UserRateLimit(limit: 60, period: 3600)]
	#[BruteForceProtection(action: 'ocmInviteCreate')]
	#[FrontpageRoute(verb: 'POST', url: '/ocm/invitations')]
	public function createInvite(string $email = '', string $message = '', string $note = '', bool $ccSender = false): JSONResponse {
		if (($disabled = $this->requireOcmInvitesEnabled()) !== null) {
			return $disabled;
		}

		// Enforce email required when optional mail is disabled
		if (empty($email) && !$this->federatedInvitesService->isOptionalMailEnabled()) {
			return new JSONResponse(['message' => $this->il10->t('Email address is required.')], Http::STATUS_BAD_REQUEST);
		}

		$uid = $this->userSession->getUser()->getUID();
		if (!empty($email)) {
			$validationError = $this->validateEmail($email);
			if ($validationError !== null) {
				return $validationError;
			}

			$this->cleanupSupersededInvitesForRecipient($uid, $email);

			// check for existing open invite for the specified email, only if email provided
			$existingInvites = $this->federatedInviteMapper->findOpenInvitesByRecipientEmail(
				$uid,
				$email,
			);
			if (count($existingInvites) > 0) {
				$this->logger->error("An open invite already exists for user with uid $uid and for recipient email $email", ['app' => Application::APP_ID]);
				return new JSONResponse(['message' => $this->il10->t('An open invite already exists.')], Http::STATUS_CONFLICT);
			}
		}

		$invite = new FederatedInvite();
		$invite->setUserId($uid);
		$token = UUIDUtil::getUUID();
		$invite->setToken($token);
		// created-/expiredAt in seconds
		$invite->setCreatedAt($this->timeFactory->now()->getTimestamp());
		$invite->setExpiredAt($this->federatedInvitesService->getInviteExpirationDate($invite->getCreatedAt()));
		if (!empty($email)) {
			$invite->setRecipientEmail($email);
		}
		// Store note in recipientName field (used as label until invite is accepted)
		if (!empty($note)) {
			$invite->setRecipientName($note);
		}
		$invite->setAccepted(false);
		$inserted = false;
		try {
			$this->federatedInviteMapper->insert($invite);
			$inserted = true;
		} catch (Throwable $e) {
			if ($this->isDuplicateConstraintException($e)) {
				if (!empty($email) && $this->cleanupSupersededInvitesForRecipient($uid, $email) > 0) {
					try {
						$this->federatedInviteMapper->insert($invite);
						$inserted = true;
					} catch (Throwable $retry) {
						if (!$this->isDuplicateConstraintException($retry)) {
							$this->logger->error('An unexpected error occurred saving a new invite after stale cleanup. Stacktrace: ' . $retry->getTraceAsString(), ['app' => Application::APP_ID]);
							return new JSONResponse(['message' => 'An unexpected error occurred creating the invite.'], Http::STATUS_INTERNAL_SERVER_ERROR);
						}
					}
				}
				if (!$inserted) {
					return new JSONResponse(['message' => $this->il10->t('An open invite already exists.')], Http::STATUS_CONFLICT);
				}
			} else {
				$this->logger->error('An unexpected error occurred saving a new invite. Stacktrace: ' . $e->getTraceAsString(), ['app' => Application::APP_ID]);
				return new JSONResponse(['message' => 'An unexpected error occurred creating the invite.'], Http::STATUS_INTERNAL_SERVER_ERROR);
			}
		}
		$senderProvider = $this->federatedInvitesService->getProviderFQDN();

		// Only send email if email address provided
		if (!empty($email)) {
			/** @var JSONResponse */
			$response = $this->sendEmail($token, $senderProvider, $email, $message);
			if ($response->getStatus() !== Http::STATUS_OK) {
				// delete invite in case sending the email has failed
				try {
					$this->federatedInviteMapper->delete($invite);
				} catch (Exception $e) {
					$this->logger->error("An unexpected error occurred deleting invite with token $token. Stacktrace: " . $e->getTraceAsString(), ['app' => Application::APP_ID]);
					return new JSONResponse(['message' => 'An unexpected error occurred creating the invite.'], Http::STATUS_INTERNAL_SERVER_ERROR);
				}
				return $response;
			}

			// Send CC to sender if requested and enabled
			if ($ccSender && $this->federatedInvitesService->isCcSenderEnabled()) {
				$senderEmail = $this->userSession->getUser()->getEMailAddress();
				if (!empty($senderEmail)) {
					$this->sendCcEmail($token, $senderProvider, $senderEmail, $email, $message);
				}
			}
		}

		// invite url, use token instead of email for routing
		$inviteUrl = $this->urlGenerator->getAbsoluteURL(
			$this->urlGenerator->linkToRoute('contacts.page.index') . 'ocm-invites/' . $token
		);
		return new JSONResponse(['invite' => $inviteUrl], Http::STATUS_OK);
	}

	/**
	 * Accepts the invite and creates a new contact from the inviter.
	 * On success the user is redirected to the new contact url.
	 *
	 * @param string $token the token of the invite
	 * @param string $provider the provider of the sender of the invite
	 * @return JSONResponse with data signature ['contact' | 'message'] - the new contact url or an error message in case of error
	 */
	#[NoAdminRequired]
	#[UserRateLimit(limit: 60, period: 3600)]
	#[BruteForceProtection(action: 'ocmInviteAccept')]
	#[FrontpageRoute(verb: 'PATCH', url: '/ocm/invitations/{token}/accept')]
	public function acceptInvite(string $token = '', string $provider = ''): JSONResponse {
		if (($disabled = $this->requireOcmInvitesEnabled()) !== null) {
			return $disabled;
		}

		if ($token === '' || $provider === '') {
			$this->logger->error("Both token and provider must be specified. Received: token=$token, provider=$provider", ['app' => Application::APP_ID]);
			return new JSONResponse(['message' => 'Both invite code and provider must be specified.'], Http::STATUS_BAD_REQUEST);
		}
		$localUser = $this->userSession->getUser();
		if ($localUser === null) {
			return new JSONResponse(['message' => $this->il10->t('Could not accept invite because no authenticated user was found.')], Http::STATUS_UNAUTHORIZED);
		}
		$provider = $this->normalizeProviderBase($provider);
		if ($provider === null) {
			return new JSONResponse(['message' => $this->il10->t('The invite provider is invalid or not allowed.')], Http::STATUS_BAD_REQUEST);
		}
		$recipientProvider = $this->federatedInvitesService->getProviderFQDN();
		$userId = $localUser->getUID();
		$email = $localUser->getEMailAddress();
		$name = $localUser->getDisplayName();
		if ($recipientProvider === '' || $userId === '' || $email === '' || $name === '') {
			$this->logger->error("All of these must be set: recipientProvider: $recipientProvider, email: $email, userId: $userId, name: $name", ['app' => Application::APP_ID]);
			return new JSONResponse(['message' => 'Could not accept invite, user data is incomplete.'], Http::STATUS_UNPROCESSABLE_ENTITY);
		}
		$cloudId = '';
		try {
			// accept the invite by calling provider OCM /invite-accepted
			// this returns a response with the following data signature: ['userID', 'email', 'name']
			// @link https://cs3org.github.io/OCM-API/docs.html?branch=v1.1.0&repo=OCM-API&user=cs3org#/paths/~1invite-accepted/post
			$client = $this->httpClient->newClient();
			/**
			 * @var \OCP\OCM\ICapabilityAwareOCMProvider $discovered
			 *
			 */
			$discovered = $this->discovery->discover($provider);
			$capabilities = $discovered->getCapabilities();
			// Accept both the canonical advertised capability and older aliases.
			if (
				in_array('invites', $capabilities, true)
				|| in_array('invite-accepted', $capabilities, true)
				|| in_array('/invite-accepted', $capabilities, true)
			) {

				$response = $this->discovery->requestRemoteOcmEndpoint(
					null,
					$provider,
					'/invite-accepted',
					[
						'recipientProvider' => $recipientProvider,
						'token' => $token,
						'userID' => $userId,
						'email' => $email,
						'name' => $name
					],
					'POST',
					$client
				);
				$responseData = $response->getBody();
				$data = json_decode($responseData, true);
				if (
					!is_array($data)
					|| !isset($data['userID'], $data['email'], $data['name'])
					|| !is_string($data['userID'])
					|| !is_string($data['email'])
					|| !is_string($data['name'])
					|| trim($data['userID']) === ''
					|| trim($data['email']) === ''
					|| trim($data['name']) === ''
				) {
					$this->logger->warning('Invalid /invite-accepted payload from provider', [
						'app' => Application::APP_ID,
						'provider' => $provider,
						'payload' => $responseData,
					]);
					return new JSONResponse(['message' => $this->il10->t('Could not accept invite because the remote provider returned an invalid response.')], Http::STATUS_BAD_GATEWAY);
				}

				$cloudId = $data['userID'] . '@' . $this->addressHandler->removeProtocolFromUrl($provider);

				$contactRef = $this->federatedInvitesService->createNewContact(
					$cloudId,
					$data['email'],
					$data['name'],
					null
				);
				if (!isset($contactRef)) {
					$this->logger->error('Remote invite acceptance succeeded but local contact creation failed', [
						'app' => Application::APP_ID,
						'token' => $token,
						'provider' => $provider,
						'cloudId' => $cloudId,
						'userId' => $userId,
					]);
					return new JSONResponse([
						'code' => 'ocm_invite_local_contact_create_failed',
						'message' => $this->il10->t('The remote provider accepted the invite, but this server could not create the local contact.'),
					], Http::STATUS_BAD_GATEWAY);
				}
				$key = base64_encode($contactRef);
				$contactUrl = $this->urlGenerator->getAbsoluteURL(
					$this->urlGenerator->linkToRoute('contacts.page.index') . $this->il10->t('All contacts') . '/' . $key
				);
				return new JSONResponse(['contact' => $contactUrl], Http::STATUS_OK);
			} else {
				$this->logger->error('Provider: ' . $provider . ' does not support invites.', ['app' => Application::APP_ID]);
				return new JSONResponse(['message' => 'Provider: ' . $provider . ' does not support invites.'], Http::STATUS_BAD_REQUEST);
			}
		} catch (ContactExistsException $e) {
			return new JSONResponse(['message' => 'Contact with cloudID ' . $cloudId . ' already exists.'], Http::STATUS_CONFLICT);
		} catch (RequestException $e) { // this should catch OCM API request exceptions
			$this->logger->error('/invite-accepted returned an error: ' . $e->getMessage(), ['app' => Application::APP_ID]);
			/**
			 * 400: Invalid or non existing token
			 * 409: Invite already accepted
			 */
			$statusCode = $e->getResponse() !== null
				? $e->getResponse()->getStatusCode()
				: null;
			switch ($statusCode) {
				case Http::STATUS_BAD_REQUEST:
					return new JSONResponse(['message' => 'Invalid, non-existing, or expired invite code.'], Http::STATUS_BAD_REQUEST);
				case Http::STATUS_CONFLICT:
					return new JSONResponse(['message' => 'Invite already accepted'], Http::STATUS_CONFLICT);
			}
			$this->logger->error("An unexpected error occurred accepting invite with token=$token and provider=$provider. Stacktrace: " . $e->getTraceAsString(), ['app' => Application::APP_ID]);
			return new JSONResponse(['message' => 'An unexpected error occurred trying to accept invite.'], Http::STATUS_INTERNAL_SERVER_ERROR);
		} catch (OCMProviderException|OCMRequestException|Exception $e) {
			$this->logger->error("An unexpected error occurred accepting invite with token=$token and provider=$provider. Stacktrace: " . $e->getTraceAsString(), ['app' => Application::APP_ID]);
			return new JSONResponse(['message' => 'An unexpected error occurred trying to accept invite'], Http::STATUS_INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Re-sends an existing invite email while preserving invite lifetime metadata.
	 *
	 *
	 */
	#[NoAdminRequired]
	#[UserRateLimit(limit: 30, period: 3600)]
	#[BruteForceProtection(action: 'ocmInviteResend')]
	#[FrontpageRoute(verb: 'PATCH', url: '/ocm/invitations/{token}/resend')]
	public function resendInvite(string $token): JSONResponse {
		if (($disabled = $this->requireOcmInvitesEnabled()) !== null) {
			return $disabled;
		}

		$uid = $this->userSession->getUser()->getUID();
		try {
			$invite = $this->federatedInviteMapper->findInviteByTokenAndUid($token, $uid);
		} catch (DoesNotExistException $e) {
			$this->logger->warning("Could not find invite with token=$token for user with uid=$uid", ['app' => Application::APP_ID]);
			return new JSONResponse(['message' => 'Invite not found'], Http::STATUS_NOT_FOUND);
		} catch (Exception $e) {
			$this->logger->error("An unexpected error occurred loading invite with token=$token. Stacktrace: " . $e->getTraceAsString(), ['app' => Application::APP_ID]);
			return new JSONResponse(['message' => 'An unexpected error occurred trying to resend the invite'], Http::STATUS_INTERNAL_SERVER_ERROR);
		}

		// Cannot resend if no email address
		if (empty($invite->getRecipientEmail())) {
			return new JSONResponse(['message' => $this->il10->t('Cannot resend: no email address')], Http::STATUS_UNPROCESSABLE_ENTITY);
		}
		if ($this->isInviteAccepted($invite)) {
			return new JSONResponse([
				'code' => 'ocm_invite_already_accepted',
				'message' => $this->il10->t('Invite has already been accepted.'),
			], Http::STATUS_CONFLICT);
		}
		if ($this->isInviteExpired($invite)) {
			return new JSONResponse([
				'code' => 'ocm_invite_expired',
				'message' => $this->il10->t('Invite has expired. Please create a new one.'),
			], Http::STATUS_GONE);
		}

		$sendDate = date('Y-m-d', $invite->getCreatedAt());
		$initiatorDisplayName = $this->userSession->getUser()->getDisplayName();
		// a resend notification that refers to the previously sent invite
		$message = $this->il10->t(
			'This is a copy of an invite sent to you previously by %1$s on %2$s',
			[
				$initiatorDisplayName,
				$sendDate
			]
		);
		$senderProvider = $this->federatedInvitesService->getProviderFQDN();
		/** @var JSONResponse */
		$response = $this->sendEmail($token, $senderProvider, $invite->getRecipientEmail(), $message);
		if ($response->getStatus() !== Http::STATUS_OK) {
			$this->logger->error("An unexpected error occurred resending the invite with token $token. HTTP response status: " . $response->getStatus(), ['app' => Application::APP_ID]);
			return $response;
		}

		// the invite url, use token instead of email for routing
		$inviteUrl = $this->urlGenerator->getAbsoluteURL(
			$this->urlGenerator->linkToRoute('contacts.page.index') . 'ocm-invites/' . $invite->getToken()
		);
		return new JSONResponse(['invite' => $inviteUrl], Http::STATUS_OK);
	}

	/**
	 * Attaches a recipient email to an existing link-only invite and sends the
	 * invitation email. Refreshes the creation and expiration timestamps so the
	 * recipient receives a fresh expiry window. Reverts both the email and the
	 * timestamps if the mailer fails, so a failed call leaves the invite as it
	 * was before.
	 *
	 * @param string $token the invite token
	 * @param string $email the recipient email address
	 * @param string $message the optional message to include in the email
	 * @return JSONResponse the serialized invite on success or an error message
	 */
	#[NoAdminRequired]
	#[UserRateLimit(limit: 30, period: 3600)]
	#[BruteForceProtection(action: 'ocmInviteAttachEmail')]
	#[FrontpageRoute(verb: 'PATCH', url: '/ocm/invitations/{token}/email')]
	public function attachEmailAndSend(string $token, string $email = '', string $message = ''): JSONResponse {
		if (($disabled = $this->requireOcmInvitesEnabled()) !== null) {
			return $disabled;
		}

		$uid = $this->userSession->getUser()->getUID();
		try {
			$invite = $this->federatedInviteMapper->findInviteByTokenAndUid($token, $uid);
		} catch (DoesNotExistException $e) {
			$this->logger->warning("Could not find invite with token=$token for user with uid=$uid", ['app' => Application::APP_ID]);
			return new JSONResponse(['message' => 'Invite not found'], Http::STATUS_NOT_FOUND);
		} catch (Exception $e) {
			$this->logger->error("An unexpected error occurred loading invite with token=$token. Stacktrace: " . $e->getTraceAsString(), ['app' => Application::APP_ID]);
			return new JSONResponse(['message' => 'An unexpected error occurred attaching the email.'], Http::STATUS_INTERNAL_SERVER_ERROR);
		}

		if ($this->isInviteAccepted($invite)) {
			return new JSONResponse([
				'code' => 'ocm_invite_already_accepted',
				'message' => $this->il10->t('Invite has already been accepted.'),
			], Http::STATUS_CONFLICT);
		}
		if (!empty($invite->getRecipientEmail())) {
			return new JSONResponse([
				'code' => 'ocm_invite_already_has_email',
				'message' => $this->il10->t('Invite already has an email address.'),
			], Http::STATUS_CONFLICT);
		}

		if (empty($email)) {
			return new JSONResponse([
				'code' => 'ocm_invite_email_required',
				'message' => $this->il10->t('Email address is required.'),
			], Http::STATUS_BAD_REQUEST);
		}
		$validationError = $this->validateEmail($email);
		if ($validationError !== null) {
			return $validationError;
		}

		$this->cleanupSupersededInvitesForRecipient($uid, $email);

		// Reject when another open invite from this user already targets the same email.
		// The current invite is excluded by construction: it has no recipient_email yet
		// and findOpenInvitesByRecipientEmail() filters by recipient_email.
		$existingInvites = $this->federatedInviteMapper->findOpenInvitesByRecipientEmail($uid, $email);
		if (count($existingInvites) > 0) {
			$this->logger->error("An open invite already exists for user with uid $uid and for recipient email $email", ['app' => Application::APP_ID]);
			return new JSONResponse([
				'code' => 'ocm_invite_duplicate_recipient_email',
				'message' => $this->il10->t('An open invite for this email already exists.'),
			], Http::STATUS_CONFLICT);
		}

		$previousCreatedAt = $invite->getCreatedAt();
		$previousExpiredAt = $invite->getExpiredAt();
		$newCreatedAt = $this->timeFactory->now()->getTimestamp();
		$newExpiredAt = $this->federatedInvitesService->getInviteExpirationDate($newCreatedAt);

		try {
			$claimed = $this->federatedInviteMapper->claimInviteForEmail(
				$token,
				$uid,
				$email,
				$newCreatedAt,
				$newExpiredAt,
			);
		} catch (Exception $e) {
			$this->logger->error("An unexpected error occurred claiming invite with token=$token. Stacktrace: " . $e->getTraceAsString(), ['app' => Application::APP_ID]);
			return new JSONResponse([
				'code' => 'ocm_invite_claim_exception',
				'message' => 'An unexpected error occurred attaching the email.',
			], Http::STATUS_INTERNAL_SERVER_ERROR);
		}

		if ($claimed === false) {
			// A concurrent attach won the race or the invite was accepted between
			// the read and the conditional update. Treat as a 409 collision so the
			// client can refresh and decide what to do next.
			return new JSONResponse([
				'code' => 'ocm_invite_claim_failed',
				'message' => $this->il10->t('Could not claim invite for this email; please refresh and try again.'),
			], Http::STATUS_CONFLICT);
		}

		$invite->setRecipientEmail($email);
		$invite->setCreatedAt($newCreatedAt);
		$invite->setExpiredAt($newExpiredAt);

		$senderProvider = $this->federatedInvitesService->getProviderFQDN();
		/** @var JSONResponse */
		$response = $this->sendEmail($token, $senderProvider, $email, $message);
		if ($response->getStatus() !== Http::STATUS_OK) {
			$this->logger->error("An unexpected error occurred sending the invite with token $token. HTTP response status: " . $response->getStatus(), ['app' => Application::APP_ID]);
			$reverted = false;
			try {
				$reverted = $this->federatedInviteMapper->revertInviteEmail(
					$token,
					$uid,
					$email,
					$previousCreatedAt,
					$previousExpiredAt,
				);
			} catch (Exception $e) {
				$this->logger->error("Could not revert invite with token=$token after mailer failure. Stacktrace: " . $e->getTraceAsString(), ['app' => Application::APP_ID]);
			}
			if ($reverted !== true) {
				$mailFailure = $response->getData();
				$mailMessage = is_array($mailFailure) && isset($mailFailure['message']) && is_string($mailFailure['message'])
					? $mailFailure['message']
					: null;
				return new JSONResponse([
					'code' => 'ocm_invite_revert_failed',
					'message' => $this->il10->t('Could not revert invite after delivery failure. Please refresh and try again.'),
					'mailError' => $mailMessage,
				], $response->getStatus());
			}
			return $response;
		}

		return new JSONResponse($invite->jsonSerialize(), Http::STATUS_OK);
	}

	/**
	 * Do OCM discovery on behalf of VUE frontend to avoid CSRF issues
	 * @param string $base base url to discover
	 * @return DataResponse
	 */
	#[PublicPage]
	#[AnonRateLimit(limit: 120, period: 3600)]
	#[UserRateLimit(limit: 120, period: 3600)]
	#[BruteForceProtection(action: 'ocmInviteDiscover')]
	#[FrontpageRoute(verb: 'GET', url: '/discover')]
	public function discover(string $base): DataResponse {
		if (!$this->federatedInvitesService->isOcmInvitesEnabled()) {
			return new DataResponse([
				'code' => 'ocm_invites_disabled',
				'error' => $this->il10->t('OCM invites are disabled.'),
			], Http::STATUS_FORBIDDEN);
		}

		$base = $this->normalizeProviderBase($base);
		if ($base === null) {
			return new DataResponse(['error' => 'invalid base'], Http::STATUS_BAD_REQUEST);
		}

		try {
			/**
			 * @var \OCP\OCM\ICapabilityAwareOCMProvider $provider
			 *
			 */
			$provider = $this->discovery->discover($base);
			$dialog = trim((string)$provider->getInviteAcceptDialog());
			$absolute = $dialog === '' ? null : $this->buildInviteAcceptDialogAbsolute($base, $dialog);
			if ($absolute === null) {
				$dialog = $this->wayfProvider->getInviteAcceptDialogPath();
				$absolute = $this->buildInviteAcceptDialogAbsolute($base, $dialog);
			}
			if ($absolute === null) {
				return new DataResponse(['error' => 'OCM discovery failed', 'base' => $base], Http::STATUS_NOT_FOUND);
			}

			$baseHost = parse_url($base, PHP_URL_HOST);
			return new DataResponse([
				'base' => $base,
				'inviteAcceptDialog' => $dialog,
				'inviteAcceptDialogAbsolute' => $absolute,
				'providerDomain' => is_string($baseHost) ? $baseHost : '',
			], Http::STATUS_OK);
		} catch (Throwable $e) {
			$this->logger->warning('OCM discovery failed', [
				'app' => Application::APP_ID,
				'base' => $base,
				'exception' => $e,
			]);
			return new DataResponse(['error' => 'OCM discovery failed', 'base' => $base], Http::STATUS_NOT_FOUND);
		}
	}

	/**
	 * Accepts the invite and creates a new contact from the inviter.
	 * On success the user is redirected to the new contact url.
	 *
	 * @param string $token the token of the invite
	 * @param string $provider the provider of the sender of the invite
	 * @return TemplateResponse the WAYF page
	 */
	#[PublicPage]
	#[NoCSRFRequired]
	#[FrontpageRoute(verb: 'GET', url: '/wayf')]
	public function wayf(string $token = ''): TemplateResponse {
		Util::addScript(Application::APP_ID, 'contacts-wayf');
		Util::addStyle(Application::APP_ID, 'contacts-wayf');
		try {
			$federations = $this->wayfProvider->getMeshProvidersFromCache();
			$providerDomain = trim((string)$this->request->getParam('providerDomain', ''));
			if ($providerDomain === '') {
				$baseHost = parse_url($this->urlGenerator->getBaseUrl(), PHP_URL_HOST);
				$providerDomain = is_string($baseHost) ? $baseHost : '';
			}
			$this->initialState->provideInitialState('wayf', [
				'federations' => $federations,
				'providerDomain' => $providerDomain,
				'token' => $token,
			]);
		} catch (Exception $e) {
			$this->logger->error($e->getMessage() . ' Trace: ' . $e->getTraceAsString(), ['app' => Application::APP_ID]);
		}
		$template = new TemplateResponse('contacts', 'wayf', [], TemplateResponse::RENDER_AS_GUEST);
		return $template;
	}

	/**
	 * Sends a copy of the invite email to the sender.
	 *
	 * @param string $token the invite token
	 * @param string $senderProvider this provider
	 * @param string $senderAddress the sender's email address
	 * @param string $recipientAddress the original recipient's email address
	 * @param string $message the optional message included in the invite
	 */
	private function sendCcEmail(string $token, string $senderProvider, string $senderAddress, string $recipientAddress, string $message): void {
		try {
			$email = $this->mailer->createMessage();
			$email->setTo([$senderAddress]);

			$instanceName = $this->defaults->getName();
			$initiatorDisplayName = $this->userSession->getUser()->getDisplayName();
			$senderName = $this->il10->t(
				'%1$s via %2$s',
				[$initiatorDisplayName, $instanceName]
			);
			$email->setFrom([Util::getDefaultEmailAddress($instanceName) => $senderName]);
			$subject = $this->il10->t('[Copy] Invite sent to %1$s', [$recipientAddress]);
			$email->setSubject($subject);

			$wayfEndpoint = $this->wayfProvider->getWayfEndpoint();
			if ($wayfEndpoint === null || trim($wayfEndpoint) === '') {
				return;
			}
			$inviteLink = $this->buildWayfInviteLink($wayfEndpoint, $token, $senderProvider);
			$encoded = base64_encode("$token@$senderProvider");

			$recipientH = htmlspecialchars($recipientAddress, ENT_QUOTES, 'UTF-8');
			$inviteLinkH = htmlspecialchars($inviteLink, ENT_QUOTES, 'UTF-8');
			$tokenSenderH = htmlspecialchars("$token@$senderProvider", ENT_QUOTES, 'UTF-8');
			$encodedH = htmlspecialchars($encoded, ENT_QUOTES, 'UTF-8');
			$messageH = nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8'), false);

			$header = $this->il10->t('This is a copy of the invite you sent to %1$s.<br><br>', [$recipientH]);
			$inviteLinkNote = $this->il10->t('Invite link: %1$s<br>', [$inviteLinkH]);
			$inviteDetails = $this->il10->t('Invite code: %1$s<br>Encoded invite: %2$s<br>', [$tokenSenderH, $encodedH]);
			$messageHeading = $this->il10->t('Your message:');
			$messageSection = trim($message) === '' ? '' : "<br>$messageHeading<br>$messageH<br>";

			$htmlBody = "$header$messageSection$inviteLinkNote$inviteDetails";
			$email->setHtmlBody($htmlBody);

			$plainHeader = $this->il10->t('This is a copy of the invite you sent to %1$s.', [$recipientAddress]);
			$plainInviteLine = $this->il10->t('Invite link: %1$s', [$inviteLink]);
			$plainInviteCode = $this->il10->t('Invite code: %1$s', ["$token@$senderProvider"]);
			$plainEncoded = $this->il10->t('Encoded invite: %1$s', [$encoded]);
			$plainMessageSection = trim($message) === '' ? '' : "\n$messageHeading\n$message\n";
			$plainBody = "$plainHeader\n$plainMessageSection\n$plainInviteLine\n$plainInviteCode\n$plainEncoded\n";
			$email->setPlainBody($plainBody);

			$this->mailer->send($email);
		} catch (Exception $e) {
			$this->logger->warning('Could not send CC email to sender: ' . $e->getMessage(), ['app' => Application::APP_ID]);
		}
	}

	/**
	 * Persist an OCM invite bool admin setting. Admin-only by default since the
	 * method is not marked with NoAdminRequired.
	 *
	 * @param string $key one of FederatedInvitesService::OCM_INVITES_BOOL_KEYS
	 * @param bool $value the new value
	 * @return JSONResponse empty body with the appropriate HTTP status
	 */
	#[FrontpageRoute(verb: 'PUT', url: '/ocm/admin/settings/{key}')]
	public function setOcmInviteBoolSetting(string $key, bool $value): JSONResponse {
		if (!$this->federatedInvitesService->setOcmInviteBoolSetting($key, $value)) {
			return new JSONResponse(['message' => 'Unknown setting key'], Http::STATUS_FORBIDDEN);
		}
		return new JSONResponse([], Http::STATUS_OK);
	}

	/**
	 * Validate a recipient email address against the configured mailer.
	 *
	 * @return JSONResponse|null Error response on invalid input, null when valid.
	 */
	private function validateEmail(string $address): ?JSONResponse {
		if (!$this->mailer->validateMailAddress($address)) {
			$this->logger->debug("Invalid recipient email address '$address'", ['app' => Application::APP_ID]);
			return new JSONResponse(['message' => $this->il10->t('Recipient email address is invalid.')], Http::STATUS_UNPROCESSABLE_ENTITY);
		}
		return null;
	}

	/**
	 * @param string $token the invite token
	 * @param string $senderProvider this provider
	 * @param string $address the recipient email address to send the invitation to
	 * @param string $message the optional message to send with the invitation
	 * @return JSONResponse
	 */
	private function sendEmail(string $token, string $senderProvider, string $address, string $message): JSONResponse {
		$validationError = $this->validateEmail($address);
		if ($validationError !== null) {
			return $validationError;
		}
		/** @var IMessage */
		$email = $this->mailer->createMessage();
		$email->setTo([$address]);

		$instanceName = $this->defaults->getName();
		$initiatorDisplayName = $this->userSession->getUser()->getDisplayName();
		$senderName = $this->il10->t(
			'%1$s via %2$s',
			[
				$initiatorDisplayName,
				$instanceName
			]
		);
		$email->setFrom([Util::getDefaultEmailAddress($instanceName) => $senderName]);
		$subject = $this->il10->t('%1$s invites you to share contacts using your cloud account', [$initiatorDisplayName]);
		$email->setSubject($subject);

		$wayfEndpoint = $this->wayfProvider->getWayfEndpoint();
		if (empty($wayfEndpoint)) {
			$this->logger->error('Invalid WAYF endpoint (null).', ['app' => Application::APP_ID]);
			return new JSONResponse(['message' => 'Could not send invite.'], Http::STATUS_INTERNAL_SERVER_ERROR);
		}
		$inviteLink = $this->buildWayfInviteLink($wayfEndpoint, $token, $senderProvider);
		$encoded = base64_encode("$token@$senderProvider");

		$initiatorDisplayNameH = htmlspecialchars($initiatorDisplayName, ENT_QUOTES, 'UTF-8');
		$inviteLinkH = htmlspecialchars($inviteLink, ENT_QUOTES, 'UTF-8');
		$tokenSenderH = htmlspecialchars("$token@$senderProvider", ENT_QUOTES, 'UTF-8');
		$encodedH = htmlspecialchars($encoded, ENT_QUOTES, 'UTF-8');
		$messageH = nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8'), false);

		$header = $this->il10->t('Hi there,<br><br>%1$s invites you to exchange cloud accounts and contact information.<br>This will allow you to share data with each other.<br>', [$initiatorDisplayNameH]);
		$messageSection = trim($message) === '' ? '' : "<br>---<br>$messageH<br>---<br>";
		$inviteLinkNote = $this->il10->t('<br>To accept this invite, click the link below and sign in with your cloud provider:<br><br><a href="%1$s">%1$s</a><br>', [$inviteLinkH]);
		$technicalDetails = $this->il10->t('<br><small>Technical details (for advanced setups):<br>Invite code: %1$s<br>Encoded invite: %2$s</small>', [$tokenSenderH, $encodedH]);

		$htmlBody = "$header$messageSection$inviteLinkNote$technicalDetails";
		$email->setHtmlBody($htmlBody);

		$plainHeader = $this->il10->t('Hi there,', []) . "\n\n" . $this->il10->t('%1$s invites you to share contact information using your cloud account.', [$initiatorDisplayName]);
		$plainMessageSection = trim($message) === '' ? '' : "\n---\n$message\n---\n";
		$plainInviteLinkNote = $this->il10->t('To accept this invite, click the link below and sign in with your cloud provider:', []) . "\n\n" . $inviteLink;
		$plainTechnical = $this->il10->t('Technical details (for advanced setups):', []) . "\n"
			. $this->il10->t('Invite code: %1$s', ["$token@$senderProvider"]) . "\n"
			. $this->il10->t('Encoded invite: %1$s', [$encoded]);
		$plainBody = "$plainHeader\n$plainMessageSection\n$plainInviteLinkNote\n\n$plainTechnical\n";
		$email->setPlainBody($plainBody);

		try {
			/** @var string[] $failedRecipients */
			$failedRecipients = $this->mailer->send($email);
		} catch (\Throwable $e) {
			$this->logger->error("Mail transport failure while sending invite to '$address': " . $e->getMessage(), [
				'app' => Application::APP_ID,
				'exception' => $e,
			]);
			return new JSONResponse(['message' => "Could not send invite to '$address'"], Http::STATUS_BAD_GATEWAY);
		}

		if (!empty($failedRecipients)) {
			$this->logger->error("Could not send invite to '$address'", ['app' => Application::APP_ID]);
			return new JSONResponse(['message' => "Could not send invite to '$address'"], Http::STATUS_BAD_GATEWAY);
		}

		return new JSONResponse([], Http::STATUS_OK);
	}

	private function normalizeProviderBase(string $provider): ?string {
		$candidate = trim($provider);
		if ($candidate === '') {
			return null;
		}
		if (!preg_match('#^https?://#i', $candidate)) {
			$candidate = 'https://' . $candidate;
		}

		$parts = parse_url($candidate);
		if (!is_array($parts) || !isset($parts['scheme'], $parts['host'])) {
			return null;
		}

		$scheme = strtolower((string)$parts['scheme']);
		if (!in_array($scheme, ['http', 'https'], true)) {
			return null;
		}

		$host = strtolower((string)$parts['host']);
		if ($host === '') {
			return null;
		}
		if (!$this->federatedInvitesService->isSsrfGuardDisabled() && $this->isBlockedDiscoveryHost($host)) {
			return null;
		}

		$port = '';
		if (isset($parts['port'])) {
			$portNumber = (int)$parts['port'];
			if ($portNumber < 1 || $portNumber > 65535) {
				return null;
			}
			$port = ':' . $portNumber;
		}

		$path = '';
		if (isset($parts['path']) && is_string($parts['path']) && $parts['path'] !== '') {
			$path = '/' . trim($parts['path'], '/');
			$path = rtrim($path, '/');
		}

		return $scheme . '://' . $host . $port . $path;
	}

	private function isBlockedDiscoveryHost(string $host): bool {
		$normalizedHost = strtolower(trim($host));
		if ($normalizedHost === 'localhost' || str_ends_with($normalizedHost, '.localhost')) {
			return true;
		}

		if (filter_var($normalizedHost, FILTER_VALIDATE_IP) === false) {
			return false;
		}

		return filter_var(
			$normalizedHost,
			FILTER_VALIDATE_IP,
			FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE,
		) === false;
	}

	private function buildInviteAcceptDialogAbsolute(string $base, string $dialog): ?string {
		$trimmedDialog = trim($dialog);
		if ($trimmedDialog === '') {
			return null;
		}

		$baseParts = parse_url($base);
		if (!is_array($baseParts) || !isset($baseParts['scheme'], $baseParts['host'])) {
			return null;
		}

		if (preg_match('#^https?://#i', $trimmedDialog)) {
			$dialogUrl = $this->normalizeProviderBase($trimmedDialog);
			if ($dialogUrl === null) {
				return null;
			}
			$dialogParts = parse_url($dialogUrl);
			if (!is_array($dialogParts) || !isset($dialogParts['host'])) {
				return null;
			}

			$basePort = $baseParts['port'] ?? null;
			$dialogPort = $dialogParts['port'] ?? null;
			if (strtolower((string)$dialogParts['host']) !== strtolower((string)$baseParts['host']) || $basePort !== $dialogPort) {
				return null;
			}

			return $dialogUrl;
		}

		$origin = $baseParts['scheme'] . '://' . $baseParts['host'];
		if (isset($baseParts['port'])) {
			$origin .= ':' . $baseParts['port'];
		}

		if (str_starts_with($trimmedDialog, '/')) {
			return $origin . $trimmedDialog;
		}

		return rtrim($base, '/') . '/' . ltrim($trimmedDialog, '/');
	}

	private function buildWayfInviteLink(string $wayfEndpoint, string $token, string $senderProvider): string {
		$separator = str_contains($wayfEndpoint, '?') ? '&' : '?';
		$query = http_build_query([
			'token' => $token,
			'providerDomain' => $senderProvider,
		], '', '&', PHP_QUERY_RFC3986);
		return $wayfEndpoint . $separator . $query;
	}

	private function requireOcmInvitesEnabled(): ?JSONResponse {
		if ($this->federatedInvitesService->isOcmInvitesEnabled()) {
			return null;
		}

		return new JSONResponse([
			'code' => 'ocm_invites_disabled',
			'message' => $this->il10->t('OCM invites are disabled.'),
		], Http::STATUS_FORBIDDEN);
	}

	private function cleanupSupersededInvitesForRecipient(string $uid, string $email): int {
		if ($email === '') {
			return 0;
		}

		try {
			return $this->federatedInviteMapper->deleteSupersededInvitesForRecipientEmail(
				$uid,
				$email,
				$this->timeFactory->now()->getTimestamp(),
			);
		} catch (Exception $e) {
			$this->logger->warning('Could not clean up superseded invites for recipient email.', [
				'app' => Application::APP_ID,
				'userId' => $uid,
				'email' => $email,
				'exception' => $e,
			]);
			return 0;
		}
	}

	private function isInviteAccepted(FederatedInvite $invite): bool {
		return $invite->isAccepted() === true || $invite->getAcceptedAt() !== null;
	}

	private function isInviteExpired(FederatedInvite $invite): bool {
		$expiredAt = $invite->getExpiredAt();
		return $expiredAt !== null && $expiredAt <= $this->timeFactory->now()->getTimestamp();
	}

	private function isDuplicateConstraintException(Throwable $e): bool {
		$message = strtolower($e->getMessage());
		return str_contains($message, 'duplicate')
			|| str_contains($message, 'unique')
			|| str_contains($message, 'constraint');
	}
}
