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
use OCA\DAV\CardDAV\CardDavBackend;
use OCA\FederatedFileSharing\AddressHandler;
use OCP\App\IAppManager;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\AppFramework\Http\Attribute\NoCSRFRequired;
use OCP\AppFramework\Http\Attribute\PublicPage;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Http\JSONResponse;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Utility\ITimeFactory;
use OCP\Contacts\IManager;
use OCP\Defaults;
use OCP\Http\Client\IClientService;
use OCP\IConfig;
use OCP\IInitialStateService;
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
use OCP\OCM\IOCMProvider;
use OCP\Util;
use Psr\Log\LoggerInterface;
use Sabre\DAV\UUIDUtil;

/**
 * Controller for federated invites related routes.
 *
 */

class FederatedInvitesController extends PageController {
	public function __construct(
		IRequest $request,
		private AddressHandler $addressHandler,
		private CardDavBackend $cardDavBackend,
		private Defaults $defaults,
		private FederatedInviteMapper $federatedInviteMapper,
		private FederatedInvitesService $federatedInvitesService,
		private IAppManager $appManager,
		private IClientService $httpClient,
		private IConfig $config,
		private IInitialStateService $initialStateService,
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
	 * Returns all open (not yet accepted) invites.
	 *
	 * @return JSONResponse
	 */
	#[NoAdminRequired]
	public function getInvites(): JSONResponse {
		$_invites = $this->federatedInviteMapper->findOpenInvitesByUid($this->userSession->getUser()->getUID());
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
	}

	/**
	 * Deletes the invite with the specified token.
	 *
	 * @param string $token the token of the invite to delete
	 * @return JSONResponse with data signature ['token' | 'message'] - the token of the deleted invitation or an error message in case of error
	 */
	#[NoAdminRequired]
	public function deleteInvite(string $token): JSONResponse {
		try {
			$uid = $this->userSession->getUser()->getUID();
			$invite = $this->federatedInviteMapper->findInviteByTokenAndUidd($token, $uid);
			$this->federatedInviteMapper->delete($invite);
			return new JSONResponse(['token' => $token], Http::STATUS_OK);
		} catch (DoesNotExistException $e) {
			$this->logger->error("Could not find invite with token=$token for user with uid=$uid . Stacktrace: " . $e->getTraceAsString(), ['app' => Application::APP_ID]);
			return new JSONResponse(['message' => 'An unexpected error occurred trying to delete the invite'], Http::STATUS_NOT_FOUND);
		} catch (Exception $e) {
			$this->logger->error("An unexpected error occurred deleting invite with token=$token. Stacktrace: " . $e->getTraceAsString(), ['app' => Application::APP_ID]);
			return new JSONResponse(['message' => 'An unexpected error occurred trying to delete the invite'], Http::STATUS_NOT_FOUND);
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
	public function inviteAcceptDialog(string $token = '', string $providerDomain = ''): TemplateResponse {
		$this->initialStateService->provideInitialState(Application::APP_ID, 'inviteToken', $token);
		$this->initialStateService->provideInitialState(Application::APP_ID, 'inviteProvider', $providerDomain);
		$this->initialStateService->provideInitialState(Application::APP_ID, 'acceptInviteDialogUrl', FederatedInvitesService::OCM_INVITE_ACCEPT_DIALOG_ROUTE);

		return $this->index();
	}

	/**
	 * Creates an invitation to exchange contact info with the remote user.
	 *
	 * @param string $emailAddress the recipient's (remote user's) email address to send the invitation to.
	 * @param string $message optional message to send with the invitation.
	 * @return JSONResponse with data signature ['invite' | 'message'] - the invite url or an error message in case of error.
	 */
	#[NoAdminRequired]
	public function createInvite(string $email, ?string $message): JSONResponse {
		if (!isset($email)) {
			return new JSONResponse(['message' => 'Recipient email is required'], Http::STATUS_BAD_REQUEST);
		}

		// check for existing open invite for the specified email and return 'invite exists'
		$uid = $this->userSession->getUser()->getUID();
		$existingInvites = $this->federatedInviteMapper->findOpenInvitesByRecipientEmail(
			$uid,
			$email,
		);
		if (count($existingInvites) > 0) {
			$this->logger->error("An open invite already exists for user with uid $uid and for recipient email $email", ['app' => Application::APP_ID]);
			return new JSONResponse(['message' => $this->il10->t('An open invite already exists.')], Http::STATUS_CONFLICT);
		}

		$invite = new FederatedInvite();
		$invite->setUserId($uid);
		$token = UUIDUtil::getUUID();
		$invite->setToken($token);
		// created-/expiredAt in seconds
		$invite->setCreatedAt($this->timeFactory->now()->getTimestamp());
		$invite->setExpiredAt($this->federatedInvitesService->getInviteExpirationDate($invite->getCreatedAt()));
		$invite->setRecipientEmail($email);
		$invite->setAccepted(false);
		try {
			$this->federatedInviteMapper->insert($invite);
		} catch (Exception $e) {
			$this->logger->error('An unexpected error occurred saving a new invite. Stacktrace: ' . $e->getTraceAsString(), ['app' => Application::APP_ID]);
			return new JSONResponse(['message' => 'An unexpected error occurred creating the invite.'], Http::STATUS_NOT_FOUND);
		}

		$senderProvider = $this->federatedInvitesService->getProviderFQDN();
		/** @var JSONResponse */
		$response = $this->sendEmail($token, $senderProvider, $email, $message);
		if ($response->getStatus() !== Http::STATUS_OK) {
			// delete invite in case sending the email has failed
			try {
				$this->federatedInviteMapper->delete($invite);
			} catch (Exception $e) {
				$this->logger->error("An unexpected error occurred deleting invite with token $token. Stacktrace: " . $e->getTraceAsString(), ['app' => Application::APP_ID]);
				return new JSONResponse(['message' => 'An unexpected error occurred creating the invite.'], Http::STATUS_NOT_FOUND);
			}
			return $response;
		}

		// the new invite url
		$inviteUrl = $this->urlGenerator->getAbsoluteURL(
			$this->urlGenerator->linkToRoute('contacts.page.index') . 'ocm-invites/' . $email
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
	public function acceptInvite(string $token = '', string $provider = ''): JSONResponse {
		if ($token === '' || $provider === '') {
			$this->logger->error("Both token and provider must be specified. Received: token=$token, provider=$provider", ['app' => Application::APP_ID]);
			return new JSONResponse(['message' => 'Both token and provider must be specified.'], Http::STATUS_NOT_FOUND);
		}
		$localUser = $this->userSession->getUser();
		$recipientProvider = $this->federatedInvitesService->getProviderFQDN();
		$userId = $localUser->getUID();
		$email = $localUser->getEMailAddress();
		$name = $localUser->getDisplayName();
		if ($recipientProvider === '' || $userId === '' || $email === '' || $name === '') {
			$this->logger->error("All of these must be set: recipientProvider: $recipientProvider, email: $email, userId: $userId, name: $name", ['app' => Application::APP_ID]);
			return new JSONResponse(['message' => 'Could not accept invite, user data is incomplete.'], Http::STATUS_NOT_FOUND);
		}
		try {
			// accept the invite by calling provider OCM /invite-accepted
			// this returns a response with the following data signature: ['userID', 'email', 'name']
			// @link https://cs3org.github.io/OCM-API/docs.html?branch=v1.1.0&repo=OCM-API&user=cs3org#/paths/~1invite-accepted/post
			$client = $this->httpClient->newClient();
			/**
			 * @var IOCMProvider $discovered
			 *
			 */
			$discovered = $this->discovery->discover($provider);
			$capabilities = $discovered->getCapabilities();
			if (in_array('invite-accepted', $capabilities)) {

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

				$cloudId = $data['userID'] . '@' . $this->addressHandler->removeProtocolFromUrl($provider);

				$contactRef = $this->federatedInvitesService->createNewContact(
					$cloudId,
					$data['email'],
					$data['name'],
					null
				);
				if (!isset($contactRef)) {
					return new JSONResponse(['message' => 'An unexpected error occurred trying to accept invite.'], Http::STATUS_NOT_FOUND);
				}
				$key = base64_encode($contactRef);
				$contactUrl = $this->urlGenerator->getAbsoluteURL(
					$this->urlGenerator->linkToRoute('contacts.page.index') . $this->il10->t('All contacts') . '/' . $key
				);
				return new JSONResponse(['contact' => $contactUrl], Http::STATUS_OK);
			} else {
				$this->logger->error('Provider: ' . $provider . ' does not support invites.', ['app' => Application::APP_ID]);
				return new JSONResponse(['message' => 'Provider: ' . $provider . ' does not support invites.'], Http::STATUS_NOT_FOUND);
			}
		} catch (ContactExistsException $e) {
			return new JSONResponse(['message' => 'Contact with cloudID ' . $cloudId . ' already exists.'], Http::STATUS_CONFLICT);
		} catch (RequestException $e) { // this should catch OCM API request exceptions
			$this->logger->error('/invite-accepted returned an error: ' . $e->getMessage(), ['app' => Application::APP_ID]);
			/**
			 * 400: Invalid or non existing token
			 * 409: Invite already accepted
			 */
			$statusCode = $e->getCode();
			switch ($statusCode) {
				case Http::STATUS_BAD_REQUEST:
					return new JSONResponse(['message' => 'Invalid, non existing or expired token'], $e->getCode());
				case Http::STATUS_CONFLICT:
					return new JSONResponse(['message' => 'Invite already accepted'], $e->getCode());
			}
			$this->logger->error("An unexpected error occurred accepting invite with token=$token and provider=$provider. Stacktrace: " . $e->getTraceAsString(), ['app' => Application::APP_ID]);
			return new JSONResponse(['message' => 'An unexpected error occurred trying to accept invite.'], Http::STATUS_NOT_FOUND);
		} catch (OCMProviderException|OCMRequestException|Exception $e) {
			$this->logger->error("An unexpected error occurred accepting invite with token=$token and provider=$provider. Stacktrace: " . $e->getTraceAsString(), ['app' => Application::APP_ID]);
			return new JSONResponse(['message' => 'An unexpected error occurred trying to accept invite'], Http::STATUS_NOT_FOUND);
		}
	}

	/**
	 * Resets the creation and expiration dates, and sends a new invite to the recipient.
	 *
	 *
	 */
	#[NoAdminRequired]
	public function resendInvite(string $token): JSONResponse {
		$invite = $this->federatedInviteMapper->findByToken($token);
		$sendDate = date('Y-m-d', $invite->getCreatedAt());
		$invite->setCreatedAt($this->timeFactory->now()->getTimestamp());
		$invite->setExpiredAt($this->federatedInvitesService->getInviteExpirationDate($invite->getCreatedAt()));
		$this->federatedInviteMapper->update($invite);
		$initiatorDisplayName = $this->userSession->getUser()->getDisplayName();
		// a resend notification that refers to the previously sent invite
		$message = $this->il10->t(
			'This is a copy of an invite send to you previously by %1$s on %2$s',
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

		// the invite url
		$inviteUrl = $this->urlGenerator->getAbsoluteURL(
			$this->urlGenerator->linkToRoute('contacts.page.index') . 'ocm-invites/' . $invite->getRecipientEmail()
		);
		return new JSONResponse(['invite' => $inviteUrl], Http::STATUS_OK);
	}

	/**
	 * Do OCM discovery on behalf of VUE frontend to avoid CSRF issues
	 * @param string $base base url to discover
	 * @return DataResponse
	 */
	#[PublicPage]
	public function discover(string $base): DataResponse {
		$base = trim($base);
		if ($base === '') {
			return new DataResponse(['error' => 'empty base'], 400);
		}
		if (!preg_match('#^https?://#i', $base)) {
			$base = 'https://' . $base;
		}
		$base = rtrim($base, '/');

		/**
		 * @var OCP\OCM\ICapabilityAwareOCMProvider $provider
		 *
		 */
		$provider = $this->discovery->discover($base);
		$dialog = $provider->getInviteAcceptDialog();
		if (!empty($dialog)) {
			$absolute = preg_match('#^https?://#i', $dialog) ? $dialog : $base . $dialog;
			return new DataResponse([
				'base' => $base,
				'inviteAcceptDialog' => $dialog,
				'inviteAcceptDialogAbsolute' => $absolute,
				'raw' => $provider->jsonSerialize(),
			]);
		} elseif (empty($dialog)) {
			// We can not check and see, because we have to be logged in here
			// so we will just risk it.
			$dialog = $base . $this->wayfProvider->getInviteAcceptDialogPath();
			$absolute = preg_match('#^https?://#i', $dialog) ? $dialog : $base . $dialog;
			return new DataResponse([
				'base' => $base,
				'inviteAcceptDialog' => $dialog,
				'inviteAcceptDialogAbsolute' => $absolute,
				'raw' => $provider->jsonSerialize(),
			]);
		}
		return new DataResponse(['error' => 'OCM discovery failed', 'base' => $base], 404);
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
	public function wayf(string $token = ''): TemplateResponse {
		Util::addScript(Application::APP_ID, 'contacts-wayf');
		Util::addStyle(Application::APP_ID, 'contacts-wayf');
		try {
			$federations = $this->wayfProvider->getMeshProvidersFromCache();
			$providerDomain = parse_url($this->urlGenerator->getBaseUrl(), PHP_URL_HOST);
			$this->initialStateService->provideInitialState(Application::APP_ID, 'wayf', [
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
	 * @param string $token the invite token
	 * @param string $senderProvider this provider
	 * @param string $address the recipient email address to send the invitation to
	 * @param string $message the optional message to send with the invitation
	 * @return JSONResponse
	 */
	private function sendEmail(string $token, string $senderProvider, string $address, string $message): JSONResponse {
		/** @var IMessage */
		$email = $this->mailer->createMessage();
		if (!$this->mailer->validateMailAddress($address)) {
			$this->logger->error("Could not sent invite, invalid email address '$address'", ['app' => Application::APP_ID]);
			return new JSONResponse(['message' => 'Recipient email address is invalid'], Http::STATUS_NOT_FOUND);
		}
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
		$subject = $this->il10->t('%1$s invites you to exchange cloud IDs', [$initiatorDisplayName]);
		$email->setSubject($subject);

		$wayfEndpoint = $this->wayfProvider->getWayfEndpoint();
		if (empty($wayfEndpoint)) {
			$this->logger->error('Invalid WAYF endpoint (null).', ['app' => Application::APP_ID]);
			return new JSONResponse(['message' => 'Could not sent invite.'], Http::STATUS_NOT_FOUND);
		}
		$inviteLink = "$wayfEndpoint?token=$token";

		$this->logger->debug("message: $message : " . print_r($message, true));

		$header = $this->il10->t('Hi there,<br><br>%1$s invites you to exchange cloud IDs.<br>', [$initiatorDisplayName]);
		$inviteLinkNote = $this->il10->t('<br>To accept this invite use the following invite link: %1$s <br>There you will be requested to sign in at your Cloud Provider.<br>', [$inviteLink]);
		$encoded = base64_encode("$token@$senderProvider");
		$inviteDetails = $this->il10->t('<br>Details:<br>Invite string: %1$s<br>token: %2$s<br>provider: %3$s<br>', [$encoded, $token, $senderProvider]);

		$messageLineBreaksToHtml = str_replace("\n", '<br>', $message);
		$message = trim($message) === '' ? '' : "<br>---<br>$messageLineBreaksToHtml<br>---<br>";

		$body = "$header$message$inviteLinkNote$inviteDetails";
		$email->setHtmlBody($body);
		$email->setPlainBody(strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $body)));

		/** @var string[] */
		$failedRecipients = $this->mailer->send($email);
		if (!empty($failedRecipients)) {
			$this->logger->error("Could not sent invite to '$address'", ['app' => Application::APP_ID]);
			return new JSONResponse(['message' => "Could not sent invite to '$address'"], Http::STATUS_NOT_FOUND);
		}

		return new JSONResponse([], Http::STATUS_OK);
	}
}
