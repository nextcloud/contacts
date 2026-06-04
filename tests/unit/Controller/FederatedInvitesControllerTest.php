<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Controller;

use ChristophWurst\Nextcloud\Testing\TestCase;
use OC\App\CompareVersion;
use OCA\Contacts\Db\FederatedInvite;
use OCA\Contacts\Db\FederatedInviteMapper;
use OCA\Contacts\Service\FederatedInvitesService;
use OCA\Contacts\Service\GroupSharingService;
use OCA\Contacts\Service\SocialApiService;
use OCA\Contacts\WayfProvider;
use OCA\FederatedFileSharing\AddressHandler;
use OCP\App\IAppManager;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Services\IInitialState;
use OCP\AppFramework\Utility\ITimeFactory;
use OCP\Contacts\IManager;
use OCP\Defaults;
use OCP\Http\Client\IClient;
use OCP\Http\Client\IClientService;
use OCP\Http\Client\IResponse;
use OCP\IConfig;
use OCP\IL10N;
use OCP\IRequest;
use OCP\IURLGenerator;
use OCP\IUser;
use OCP\IUserManager;
use OCP\IUserSession;
use OCP\L10N\IFactory;
use OCP\Mail\IMailer;
use OCP\OCM\ICapabilityAwareOCMProvider;
use OCP\OCM\IOCMDiscoveryService;
use PHPUnit\Framework\MockObject\MockObject;
use Psr\Log\LoggerInterface;

abstract class TestIOCMDiscoveryService implements IOCMDiscoveryService {
	abstract public function discover(
		string $remote,
		bool $skipCache = false,
	): ICapabilityAwareOCMProvider;

	abstract public function requestRemoteOcmEndpoint(
		?string $capability,
		string $remote,
		string $ocmSubPath,
		?array $payload = null,
		string $method = 'get',
		?IClient $client = null,
		?array $options = null,
		bool $signed = true,
	): IResponse;
}

class FederatedInvitesControllerTest extends TestCase {
	private const UID = 'alice';
	private const OTHER_UID = 'bob';
	private const TOKEN = 'token-1234';

	private FederatedInvitesController $controller;

	private IRequest|MockObject $request;
	private AddressHandler|MockObject $addressHandler;
	private Defaults|MockObject $defaults;
	private FederatedInviteMapper|MockObject $mapper;
	private FederatedInvitesService|MockObject $invitesService;
	private IAppManager|MockObject $appManager;
	private IClientService|MockObject $httpClient;
	private IConfig|MockObject $config;
	private IInitialState|MockObject $initialState;
	private IFactory|MockObject $languageFactory;
	private IManager|MockObject $contactsManager;
	private IMailer|MockObject $mailer;
	private TestIOCMDiscoveryService|MockObject $discovery;
	private IUserSession|MockObject $userSession;
	private WayfProvider|MockObject $wayfProvider;
	private SocialApiService|MockObject $socialApi;
	private ITimeFactory|MockObject $timeFactory;
	private CompareVersion|MockObject $compareVersion;
	private GroupSharingService|MockObject $groupSharingService;
	private IL10N|MockObject $l10n;
	private IURLGenerator|MockObject $urlGenerator;
	private IUserManager|MockObject $userManager;
	private LoggerInterface|MockObject $logger;

	protected function setUp(): void {
		parent::setUp();

		$this->request = $this->createMock(IRequest::class);
		$this->addressHandler = $this->createMock(AddressHandler::class);
		$this->defaults = $this->createMock(Defaults::class);
		$this->mapper = $this->createMock(FederatedInviteMapper::class);
		$this->invitesService = $this->createMock(FederatedInvitesService::class);
		$this->appManager = $this->createMock(IAppManager::class);
		$this->httpClient = $this->createMock(IClientService::class);
		$this->config = $this->createMock(IConfig::class);
		$this->initialState = $this->createMock(IInitialState::class);
		$this->languageFactory = $this->createMock(IFactory::class);
		$this->contactsManager = $this->createMock(IManager::class);
		$this->mailer = $this->createMock(IMailer::class);
		$this->discovery = $this->createMock(TestIOCMDiscoveryService::class);
		$this->userSession = $this->createMock(IUserSession::class);
		$this->wayfProvider = $this->createMock(WayfProvider::class);
		$this->socialApi = $this->createMock(SocialApiService::class);
		$this->timeFactory = $this->createMock(ITimeFactory::class);
		$this->compareVersion = $this->createMock(CompareVersion::class);
		$this->groupSharingService = $this->createMock(GroupSharingService::class);
		$this->l10n = $this->createMock(IL10N::class);
		$this->urlGenerator = $this->createMock(IURLGenerator::class);
		$this->userManager = $this->createMock(IUserManager::class);
		$this->logger = $this->createMock(LoggerInterface::class);

		$this->l10n->method('t')->willReturnCallback(static fn (string $text, array $params = []): string => vsprintf($text, $params));
		$this->invitesService->method('isOcmInvitesEnabled')->willReturn(true);
		$this->mapper->method('deleteSupersededInvitesForRecipientEmail')->willReturn(0);

		$user = $this->createMock(IUser::class);
		$user->method('getUID')->willReturn(self::UID);
		$user->method('getDisplayName')->willReturn('Alice');
		$user->method('getEMailAddress')->willReturn('alice@example.org');
		$this->userSession->method('getUser')->willReturn($user);

		$this->controller = new FederatedInvitesController(
			$this->request,
			$this->addressHandler,
			$this->defaults,
			$this->mapper,
			$this->invitesService,
			$this->appManager,
			$this->httpClient,
			$this->config,
			$this->initialState,
			$this->languageFactory,
			$this->contactsManager,
			$this->mailer,
			$this->discovery,
			$this->userSession,
			$this->wayfProvider,
			$this->socialApi,
			$this->timeFactory,
			$this->compareVersion,
			$this->groupSharingService,
			$this->l10n,
			$this->urlGenerator,
			$this->userManager,
			$this->logger,
		);
	}

	private function makeInvite(?string $email = null, bool $accepted = false, string $uid = self::UID): FederatedInvite {
		$invite = new FederatedInvite();
		$invite->setUserId($uid);
		$invite->setToken(self::TOKEN);
		$invite->setRecipientEmail($email);
		$invite->setAccepted($accepted);
		$invite->setCreatedAt(1_700_000_000);
		$invite->setExpiredAt(1_700_000_000 + 2_592_000);
		return $invite;
	}

	public function testGetInvitesReturnsStructuredErrorWhenMapperFails(): void {
		$this->mapper->expects($this->once())
			->method('findOpenInvitesByUid')
			->with(self::UID)
			->willThrowException(new \RuntimeException('db fail'));

		$response = $this->controller->getInvites();

		$this->assertSame(Http::STATUS_INTERNAL_SERVER_ERROR, $response->getStatus());
		$this->assertSame('ocm_invites_fetch_failed', $response->getData()['code']);
	}

	public function testAttachEmailAndSendUpdatesAndSends(): void {
		$invite = $this->makeInvite(null);

		$this->mapper->expects($this->once())
			->method('findInviteByTokenAndUid')
			->with(self::TOKEN, self::UID)
			->willReturn($invite);
		$this->mapper->method('findOpenInvitesByRecipientEmail')->willReturn([]);
		$this->mailer->method('validateMailAddress')->willReturn(true);
		$this->mailer->method('createMessage')->willReturn($this->createMock(\OCP\Mail\IMessage::class));
		$this->mailer->method('send')->willReturn([]);
		$this->wayfProvider->method('getWayfEndpoint')->willReturn('https://example.org/wayf');
		$this->invitesService->method('getProviderFQDN')->willReturn('example.org');
		$this->invitesService->method('getInviteExpirationDate')->willReturnCallback(static fn (int $t): int => $t + 2_592_000);
		$now = $this->createMock(\DateTimeImmutable::class);
		$now->method('getTimestamp')->willReturn(1_800_000_000);
		$this->timeFactory->method('now')->willReturn($now);

		$this->mapper->expects($this->once())
			->method('claimInviteForEmail')
			->with(self::TOKEN, self::UID, 'recipient@example.org', 1_800_000_000, 1_800_000_000 + 2_592_000)
			->willReturn(true);
		$this->mapper->expects($this->never())->method('revertInviteEmail');

		$response = $this->controller->attachEmailAndSend(self::TOKEN, 'recipient@example.org', 'hello');

		$this->assertSame(Http::STATUS_OK, $response->getStatus());
		$body = $response->getData();
		$this->assertSame('recipient@example.org', $body['recipientEmail']);
		$this->assertSame(self::TOKEN, $body['token']);
		$this->assertSame(1_800_000_000, $body['createdAt']);
	}

	public function testAttachEmailAndSendRejectsWhenClaimLosesRace(): void {
		$invite = $this->makeInvite(null);

		$this->mapper->method('findInviteByTokenAndUid')->willReturn($invite);
		$this->mapper->method('findOpenInvitesByRecipientEmail')->willReturn([]);
		$this->mailer->method('validateMailAddress')->willReturn(true);
		$this->invitesService->method('getInviteExpirationDate')->willReturnCallback(static fn (int $t): int => $t + 2_592_000);
		$now = $this->createMock(\DateTimeImmutable::class);
		$now->method('getTimestamp')->willReturn(1_800_000_000);
		$this->timeFactory->method('now')->willReturn($now);

		$this->mapper->expects($this->once())
			->method('claimInviteForEmail')
			->willReturn(false);
		$this->mailer->expects($this->never())->method('send');
		$this->mapper->expects($this->never())->method('revertInviteEmail');

		$response = $this->controller->attachEmailAndSend(self::TOKEN, 'recipient@example.org');

		$this->assertSame(Http::STATUS_CONFLICT, $response->getStatus());
		$this->assertSame('ocm_invite_claim_failed', $response->getData()['code']);
		$this->assertNull($invite->getRecipientEmail());
	}

	public function testAttachEmailAndSendReturnsClaimExceptionCodeWhenClaimFails(): void {
		$invite = $this->makeInvite(null);

		$this->mapper->method('findInviteByTokenAndUid')->willReturn($invite);
		$this->mapper->method('findOpenInvitesByRecipientEmail')->willReturn([]);
		$this->mailer->method('validateMailAddress')->willReturn(true);
		$this->invitesService->method('getInviteExpirationDate')->willReturnCallback(static fn (int $t): int => $t + 2_592_000);
		$now = $this->createMock(\DateTimeImmutable::class);
		$now->method('getTimestamp')->willReturn(1_800_000_000);
		$this->timeFactory->method('now')->willReturn($now);

		$this->mapper->expects($this->once())
			->method('claimInviteForEmail')
			->willThrowException(new \RuntimeException('claim boom'));
		$this->mailer->expects($this->never())->method('send');
		$this->mapper->expects($this->never())->method('revertInviteEmail');

		$response = $this->controller->attachEmailAndSend(self::TOKEN, 'recipient@example.org');

		$this->assertSame(Http::STATUS_INTERNAL_SERVER_ERROR, $response->getStatus());
		$this->assertSame('ocm_invite_claim_exception', $response->getData()['code']);
	}

	public function testAttachEmailAndSendRejectsWhenInviteBelongsToAnotherUser(): void {
		$this->mapper->expects($this->once())
			->method('findInviteByTokenAndUid')
			->with(self::TOKEN, self::UID)
			->willThrowException(new DoesNotExistException('not found'));

		$this->mailer->expects($this->never())->method('send');
		$this->mapper->expects($this->never())->method('claimInviteForEmail');
		$this->mapper->expects($this->never())->method('revertInviteEmail');

		$response = $this->controller->attachEmailAndSend(self::TOKEN, 'recipient@example.org');

		$this->assertSame(Http::STATUS_NOT_FOUND, $response->getStatus());
	}

	public function testAttachEmailAndSendRejectsWhenInviteAlreadyAccepted(): void {
		$invite = $this->makeInvite(null, accepted: true);
		$this->mapper->method('findInviteByTokenAndUid')->willReturn($invite);

		$this->mailer->expects($this->never())->method('send');
		$this->mapper->expects($this->never())->method('claimInviteForEmail');

		$response = $this->controller->attachEmailAndSend(self::TOKEN, 'recipient@example.org');

		$this->assertSame(Http::STATUS_CONFLICT, $response->getStatus());
		$this->assertSame('ocm_invite_already_accepted', $response->getData()['code']);
	}

	public function testAttachEmailAndSendRejectsWhenInviteAlreadyHasEmail(): void {
		$invite = $this->makeInvite('existing@example.org');
		$this->mapper->method('findInviteByTokenAndUid')->willReturn($invite);

		$this->mailer->expects($this->never())->method('send');
		$this->mapper->expects($this->never())->method('claimInviteForEmail');

		$response = $this->controller->attachEmailAndSend(self::TOKEN, 'recipient@example.org');

		$this->assertSame(Http::STATUS_CONFLICT, $response->getStatus());
		$this->assertSame('ocm_invite_already_has_email', $response->getData()['code']);
	}

	public function testAttachEmailAndSendRejectsInvalidEmail(): void {
		$invite = $this->makeInvite(null);
		$this->mapper->method('findInviteByTokenAndUid')->willReturn($invite);
		$this->mailer->method('validateMailAddress')->willReturn(false);

		$this->mailer->expects($this->never())->method('send');
		$this->mapper->expects($this->never())->method('claimInviteForEmail');

		$response = $this->controller->attachEmailAndSend(self::TOKEN, 'not-an-email');

		$this->assertSame(Http::STATUS_UNPROCESSABLE_ENTITY, $response->getStatus());
		$this->assertNull($invite->getRecipientEmail());
	}

	public function testAttachEmailAndSendRejectsCollidingOpenInvite(): void {
		$invite = $this->makeInvite(null);
		$other = $this->makeInvite('recipient@example.org');
		$other->setToken('other-token');

		$this->mapper->method('findInviteByTokenAndUid')->willReturn($invite);
		$this->mapper->method('findOpenInvitesByRecipientEmail')->willReturn([$other]);
		$this->mailer->method('validateMailAddress')->willReturn(true);

		$this->mailer->expects($this->never())->method('send');
		$this->mapper->expects($this->never())->method('claimInviteForEmail');

		$response = $this->controller->attachEmailAndSend(self::TOKEN, 'recipient@example.org');

		$this->assertSame(Http::STATUS_CONFLICT, $response->getStatus());
		$this->assertSame('ocm_invite_duplicate_recipient_email', $response->getData()['code']);
	}

	public function testAttachEmailAndSendRevertsOnMailerFailure(): void {
		$invite = $this->makeInvite(null);
		$originalCreatedAt = $invite->getCreatedAt();
		$originalExpiredAt = $invite->getExpiredAt();

		$this->mapper->method('findInviteByTokenAndUid')->willReturn($invite);
		$this->mapper->method('findOpenInvitesByRecipientEmail')->willReturn([]);
		$this->mailer->method('validateMailAddress')->willReturn(true);
		$this->mailer->method('createMessage')->willReturn($this->createMock(\OCP\Mail\IMessage::class));
		$this->mailer->method('send')->willReturn(['recipient@example.org']);
		$this->wayfProvider->method('getWayfEndpoint')->willReturn('https://example.org/wayf');
		$this->invitesService->method('getProviderFQDN')->willReturn('example.org');
		$this->invitesService->method('getInviteExpirationDate')->willReturnCallback(static fn (int $t): int => $t + 2_592_000);
		$now = $this->createMock(\DateTimeImmutable::class);
		$now->method('getTimestamp')->willReturn(1_800_000_000);
		$this->timeFactory->method('now')->willReturn($now);

		$this->mapper->expects($this->once())
			->method('claimInviteForEmail')
			->willReturn(true);
		$this->mapper->expects($this->once())
			->method('revertInviteEmail')
			->with(self::TOKEN, self::UID, 'recipient@example.org', $originalCreatedAt, $originalExpiredAt)
			->willReturn(true);

		$response = $this->controller->attachEmailAndSend(self::TOKEN, 'recipient@example.org');

		$this->assertNotSame(Http::STATUS_OK, $response->getStatus());
	}

	public function testAttachEmailAndSendReturnsRevertFailureWhenRevertMisses(): void {
		$invite = $this->makeInvite(null);
		$originalCreatedAt = $invite->getCreatedAt();
		$originalExpiredAt = $invite->getExpiredAt();

		$this->mapper->method('findInviteByTokenAndUid')->willReturn($invite);
		$this->mapper->method('findOpenInvitesByRecipientEmail')->willReturn([]);
		$this->mailer->method('validateMailAddress')->willReturn(true);
		$this->mailer->method('createMessage')->willReturn($this->createMock(\OCP\Mail\IMessage::class));
		$this->mailer->method('send')->willReturn(['recipient@example.org']);
		$this->wayfProvider->method('getWayfEndpoint')->willReturn('https://example.org/wayf');
		$this->invitesService->method('getProviderFQDN')->willReturn('example.org');
		$this->invitesService->method('getInviteExpirationDate')->willReturnCallback(static fn (int $t): int => $t + 2_592_000);
		$now = $this->createMock(\DateTimeImmutable::class);
		$now->method('getTimestamp')->willReturn(1_800_000_000);
		$this->timeFactory->method('now')->willReturn($now);

		$this->mapper->expects($this->once())
			->method('claimInviteForEmail')
			->willReturn(true);
		$this->mapper->expects($this->once())
			->method('revertInviteEmail')
			->with(self::TOKEN, self::UID, 'recipient@example.org', $originalCreatedAt, $originalExpiredAt)
			->willReturn(false);

		$response = $this->controller->attachEmailAndSend(self::TOKEN, 'recipient@example.org');

		$this->assertSame(Http::STATUS_BAD_GATEWAY, $response->getStatus());
		$body = $response->getData();
		$this->assertSame('ocm_invite_revert_failed', $body['code']);
		$this->assertNotEmpty($body['mailError']);
	}

	public function testAttachEmailAndSendEscapesUserContentInHtmlBody(): void {
		$invite = $this->makeInvite(null);
		$this->mapper->method('findInviteByTokenAndUid')->willReturn($invite);
		$this->mapper->method('findOpenInvitesByRecipientEmail')->willReturn([]);
		$this->mailer->method('validateMailAddress')->willReturn(true);
		$this->wayfProvider->method('getWayfEndpoint')->willReturn('https://example.org/wayf');
		$this->invitesService->method('getProviderFQDN')->willReturn('example.org');
		$this->invitesService->method('getInviteExpirationDate')->willReturnCallback(static fn (int $t): int => $t + 2_592_000);
		$now = $this->createMock(\DateTimeImmutable::class);
		$now->method('getTimestamp')->willReturn(1_800_000_000);
		$this->timeFactory->method('now')->willReturn($now);
		$this->mapper->method('claimInviteForEmail')->willReturn(true);

		$user = $this->createMock(IUser::class);
		$user->method('getUID')->willReturn(self::UID);
		$user->method('getDisplayName')->willReturn('Eve <script>');
		$user->method('getEMailAddress')->willReturn(null);
		$session = $this->createMock(IUserSession::class);
		$session->method('getUser')->willReturn($user);
		$reflection = new \ReflectionProperty(FederatedInvitesController::class, 'userSession');
		$reflection->setAccessible(true);
		$reflection->setValue($this->controller, $session);

		$capturedHtml = null;
		$capturedPlain = null;
		$message = $this->createMock(\OCP\Mail\IMessage::class);
		$message->method('setHtmlBody')->willReturnCallback(function ($body) use (&$capturedHtml, $message) {
			$capturedHtml = $body;
			return $message;
		});
		$message->method('setPlainBody')->willReturnCallback(function ($body) use (&$capturedPlain, $message) {
			$capturedPlain = $body;
			return $message;
		});
		$this->mailer->method('createMessage')->willReturn($message);
		$this->mailer->method('send')->willReturn([]);

		$response = $this->controller->attachEmailAndSend(self::TOKEN, 'recipient@example.org', '<b>note</b>');

		$this->assertSame(Http::STATUS_OK, $response->getStatus());
		$this->assertNotNull($capturedHtml);
		$this->assertStringNotContainsString('<script>', (string)$capturedHtml);
		$this->assertStringContainsString('Eve &lt;script&gt;', (string)$capturedHtml);
		$this->assertStringNotContainsString('<b>note</b>', (string)$capturedHtml);
		$this->assertStringContainsString('&lt;b&gt;note&lt;/b&gt;', (string)$capturedHtml);
		$this->assertNotNull($capturedPlain);
		$this->assertStringContainsString('<b>note</b>', (string)$capturedPlain);
	}

	public function testAttachEmailAndSendRevertsWhenMailerThrows(): void {
		$invite = $this->makeInvite(null);
		$originalCreatedAt = $invite->getCreatedAt();
		$originalExpiredAt = $invite->getExpiredAt();

		$this->mapper->method('findInviteByTokenAndUid')->willReturn($invite);
		$this->mapper->method('findOpenInvitesByRecipientEmail')->willReturn([]);
		$this->mailer->method('validateMailAddress')->willReturn(true);
		$this->mailer->method('createMessage')->willReturn($this->createMock(\OCP\Mail\IMessage::class));
		$this->mailer->method('send')->willThrowException(new \RuntimeException('SMTP refused'));
		$this->wayfProvider->method('getWayfEndpoint')->willReturn('https://example.org/wayf');
		$this->invitesService->method('getProviderFQDN')->willReturn('example.org');
		$this->invitesService->method('getInviteExpirationDate')->willReturnCallback(static fn (int $t): int => $t + 2_592_000);
		$now = $this->createMock(\DateTimeImmutable::class);
		$now->method('getTimestamp')->willReturn(1_800_000_000);
		$this->timeFactory->method('now')->willReturn($now);

		$this->mapper->expects($this->once())
			->method('claimInviteForEmail')
			->willReturn(true);
		$this->mapper->expects($this->once())
			->method('revertInviteEmail')
			->with(self::TOKEN, self::UID, 'recipient@example.org', $originalCreatedAt, $originalExpiredAt)
			->willReturn(true);

		$response = $this->controller->attachEmailAndSend(self::TOKEN, 'recipient@example.org');

		$this->assertSame(Http::STATUS_BAD_GATEWAY, $response->getStatus());
	}

	public function testResendInviteRejectsWhenInviteBelongsToAnotherUser(): void {
		$this->mapper->expects($this->once())
			->method('findInviteByTokenAndUid')
			->with(self::TOKEN, self::UID)
			->willThrowException(new DoesNotExistException('not found'));

		$this->mailer->expects($this->never())->method('send');

		$response = $this->controller->resendInvite(self::TOKEN);

		$this->assertSame(Http::STATUS_NOT_FOUND, $response->getStatus());
	}

	public function testResendInvitePreservesLifetimeOnSuccessfulSend(): void {
		$invite = $this->makeInvite('recipient@example.org');
		$createdAt = $invite->getCreatedAt();
		$expiredAt = $invite->getExpiredAt();
		$capturedHtml = null;
		$capturedPlain = null;
		$message = $this->createMock(\OCP\Mail\IMessage::class);
		$message->method('setHtmlBody')->willReturnCallback(function ($body) use (&$capturedHtml, $message) {
			$capturedHtml = $body;
			return $message;
		});
		$message->method('setPlainBody')->willReturnCallback(function ($body) use (&$capturedPlain, $message) {
			$capturedPlain = $body;
			return $message;
		});

		$this->mapper->method('findInviteByTokenAndUid')->willReturn($invite);
		$this->mailer->method('validateMailAddress')->willReturn(true);
		$this->mailer->method('createMessage')->willReturn($message);
		$this->mailer->method('send')->willReturn([]);
		$this->wayfProvider->method('getWayfEndpoint')->willReturn('https://example.org/wayf');
		$this->invitesService->method('getProviderFQDN')->willReturn('example.org');

		$this->mapper->expects($this->never())->method('update');

		$response = $this->controller->resendInvite(self::TOKEN);

		$this->assertSame(Http::STATUS_OK, $response->getStatus());
		$this->assertSame($createdAt, $invite->getCreatedAt());
		$this->assertSame($expiredAt, $invite->getExpiredAt());
		$this->assertStringContainsString('This is a copy of an invite sent to you previously by Alice', (string)$capturedPlain);
		$this->assertStringNotContainsString('invite send to you', (string)$capturedPlain);
		$this->assertStringContainsString('This is a copy of an invite sent to you previously by Alice', (string)$capturedHtml);
	}

	public function testCreateInviteAllowsLinkOnlyWhenOptionalMailEnabled(): void {
		$capturedInvite = null;
		$now = $this->createMock(\DateTimeImmutable::class);
		$now->method('getTimestamp')->willReturn(1_800_000_000);

		$this->invitesService->method('isOptionalMailEnabled')->willReturn(true);
		$this->invitesService->method('getInviteExpirationDate')->willReturn(1_800_000_000 + 2_592_000);
		$this->timeFactory->method('now')->willReturn($now);
		$this->mapper->expects($this->once())
			->method('insert')
			->willReturnCallback(static function (FederatedInvite $invite) use (&$capturedInvite): FederatedInvite {
				$capturedInvite = $invite;
				return $invite;
			});
		$this->mailer->expects($this->never())->method('createMessage');
		$this->mailer->expects($this->never())->method('send');
		$this->urlGenerator->method('linkToRoute')->with('contacts.page.index')->willReturn('/apps/contacts/');
		$this->urlGenerator->method('getAbsoluteURL')->willReturnCallback(static fn (string $path): string => 'https://local.example' . $path);

		$response = $this->controller->createInvite('', '', 'mesh peer', false);

		$this->assertSame(Http::STATUS_OK, $response->getStatus());
		$this->assertNotNull($capturedInvite);
		$this->assertSame('mesh peer', $capturedInvite->getRecipientName());
		$this->assertSame(self::UID, $capturedInvite->getUserId());
		$this->assertStringContainsString('/apps/contacts/ocm-invites/', $response->getData()['invite']);
	}

	public function testCreateInviteIncludesPersonalMessageInFirstEmail(): void {
		$capturedHtml = null;
		$capturedPlain = null;
		$message = $this->createMock(\OCP\Mail\IMessage::class);
		$message->method('setHtmlBody')->willReturnCallback(function ($body) use (&$capturedHtml, $message) {
			$capturedHtml = $body;
			return $message;
		});
		$message->method('setPlainBody')->willReturnCallback(function ($body) use (&$capturedPlain, $message) {
			$capturedPlain = $body;
			return $message;
		});
		$now = $this->createMock(\DateTimeImmutable::class);
		$now->method('getTimestamp')->willReturn(1_800_000_000);

		$this->invitesService->method('isOptionalMailEnabled')->willReturn(true);
		$this->invitesService->method('getInviteExpirationDate')->willReturn(1_800_000_000 + 2_592_000);
		$this->timeFactory->method('now')->willReturn($now);
		$this->mapper->method('findOpenInvitesByRecipientEmail')->willReturn([]);
		$this->mapper->method('insert')->willReturnArgument(0);
		$this->mailer->method('validateMailAddress')->willReturn(true);
		$this->mailer->method('createMessage')->willReturn($message);
		$this->mailer->method('send')->willReturn([]);
		$this->wayfProvider->method('getWayfEndpoint')->willReturn('https://example.org/wayf');
		$this->invitesService->method('getProviderFQDN')->willReturn('example.org');
		$this->urlGenerator->method('linkToRoute')->with('contacts.page.index')->willReturn('/apps/contacts/');
		$this->urlGenerator->method('getAbsoluteURL')->willReturnCallback(static fn (string $path): string => 'https://local.example' . $path);

		$response = $this->controller->createInvite('recipient@example.org', '<b>hello</b>', '', false);

		$this->assertSame(Http::STATUS_OK, $response->getStatus());
		$this->assertStringContainsString('&lt;b&gt;hello&lt;/b&gt;', (string)$capturedHtml);
		$this->assertStringNotContainsString('<b>hello</b>', (string)$capturedHtml);
		$this->assertStringContainsString('<b>hello</b>', (string)$capturedPlain);
	}

	public function testCreateInviteRejectsMissingEmailWhenOptionalMailDisabled(): void {
		$this->invitesService->expects($this->once())
			->method('isOptionalMailEnabled')
			->willReturn(false);
		$this->mapper->expects($this->never())->method('insert');

		$response = $this->controller->createInvite('', '', '', false);

		$this->assertSame(Http::STATUS_BAD_REQUEST, $response->getStatus());
		$this->assertSame('Email address is required.', $response->getData()['message']);
	}

	public function testAcceptInviteReturnsContactUrlOnSuccess(): void {
		$client = $this->createMock(\OCP\Http\Client\IClient::class);
		$provider = $this->createMock(\OCP\OCM\ICapabilityAwareOCMProvider::class);
		$remoteResponse = $this->createMock(IResponse::class);
		$remoteBody = json_encode([
			'userID' => 'bob',
			'email' => 'bob@example.org',
			'name' => 'Bob',
		]);
		$this->assertIsString($remoteBody);
		$remoteResponse->method('getBody')->willReturn($remoteBody);

		$this->httpClient->method('newClient')->willReturn($client);
		$this->discovery->method('discover')->with('https://remote.example')->willReturn($provider);
		$provider->method('getCapabilities')->willReturn(['invites']);
		$this->discovery->expects($this->once())
			->method('requestRemoteOcmEndpoint')
			->with(
				null,
				'https://remote.example',
				'/invite-accepted',
				$this->callback(static function (array $payload): bool {
					return $payload['token'] === self::TOKEN
						&& $payload['userID'] === self::UID
						&& $payload['email'] === 'alice@example.org'
						&& $payload['name'] === 'Alice';
				}),
				'POST',
				$client,
			)
			->willReturn($remoteResponse);
		$this->addressHandler->method('removeProtocolFromUrl')->with('https://remote.example')->willReturn('remote.example');
		$this->invitesService->method('getProviderFQDN')->willReturn('local.example');
		$this->invitesService->method('createNewContact')->with(
			'bob@remote.example',
			'bob@example.org',
			'Bob',
			null,
		)->willReturn('contact-uid~contacts');
		$this->urlGenerator->method('linkToRoute')->with('contacts.page.index')->willReturn('/apps/contacts/');
		$this->urlGenerator->method('getAbsoluteURL')->willReturnCallback(static fn (string $path): string => 'https://local.example' . $path);

		$response = $this->controller->acceptInvite(self::TOKEN, 'remote.example');

		$this->assertSame(Http::STATUS_OK, $response->getStatus());
		$this->assertSame(
			'https://local.example/apps/contacts/All contacts/' . base64_encode('contact-uid~contacts'),
			$response->getData()['contact'],
		);
	}

	public function testAcceptInviteRejectsAuthenticatedUserWithoutEmail(): void {
		$user = $this->createMock(IUser::class);
		$user->method('getUID')->willReturn(self::UID);
		$user->method('getDisplayName')->willReturn('Alice');
		$user->method('getEMailAddress')->willReturn('');
		$session = $this->createMock(IUserSession::class);
		$session->method('getUser')->willReturn($user);
		$reflection = new \ReflectionProperty(FederatedInvitesController::class, 'userSession');
		$reflection->setAccessible(true);
		$reflection->setValue($this->controller, $session);
		$this->invitesService->method('getProviderFQDN')->willReturn('local.example');
		$this->discovery->expects($this->never())->method('requestRemoteOcmEndpoint');

		$response = $this->controller->acceptInvite(self::TOKEN, 'remote.example');

		$this->assertSame(Http::STATUS_UNPROCESSABLE_ENTITY, $response->getStatus());
		$this->assertSame('Could not accept invite, user data is incomplete.', $response->getData()['message']);
	}

	public function testAcceptInviteRejectsMalformedInviteAcceptedPayload(): void {
		$client = $this->createMock(\OCP\Http\Client\IClient::class);
		$provider = $this->createMock(\OCP\OCM\ICapabilityAwareOCMProvider::class);
		$remoteResponse = $this->createMock(IResponse::class);
		$remoteBody = json_encode([
			'userID' => 'bob',
		]);
		$this->assertIsString($remoteBody);
		$remoteResponse->method('getBody')->willReturn($remoteBody);

		$this->httpClient->method('newClient')->willReturn($client);
		$this->discovery->method('discover')->willReturn($provider);
		$provider->method('getCapabilities')->willReturn(['invites']);
		$this->discovery->method('requestRemoteOcmEndpoint')->willReturn($remoteResponse);
		$this->invitesService->method('getProviderFQDN')->willReturn('local.example');
		$this->invitesService->expects($this->never())->method('createNewContact');

		$response = $this->controller->acceptInvite(self::TOKEN, 'remote.example');

		$this->assertSame(Http::STATUS_BAD_GATEWAY, $response->getStatus());
		$this->assertSame(
			'Could not accept invite because the remote provider returned an invalid response.',
			$response->getData()['message'],
		);
	}

	public function testAcceptInviteRejectsInviteAcceptedPayloadWithEmptyEmail(): void {
		$client = $this->createMock(\OCP\Http\Client\IClient::class);
		$provider = $this->createMock(\OCP\OCM\ICapabilityAwareOCMProvider::class);
		$remoteResponse = $this->createMock(IResponse::class);
		$remoteBody = json_encode([
			'userID' => 'bob',
			'email' => '',
			'name' => 'Bob',
		]);
		$this->assertIsString($remoteBody);
		$remoteResponse->method('getBody')->willReturn($remoteBody);

		$this->httpClient->method('newClient')->willReturn($client);
		$this->discovery->method('discover')->willReturn($provider);
		$provider->method('getCapabilities')->willReturn(['invites']);
		$this->discovery->method('requestRemoteOcmEndpoint')->willReturn($remoteResponse);
		$this->invitesService->method('getProviderFQDN')->willReturn('local.example');
		$this->invitesService->expects($this->never())->method('createNewContact');

		$response = $this->controller->acceptInvite(self::TOKEN, 'remote.example');

		$this->assertSame(Http::STATUS_BAD_GATEWAY, $response->getStatus());
		$this->assertSame(
			'Could not accept invite because the remote provider returned an invalid response.',
			$response->getData()['message'],
		);
	}

	public function testDiscoverRejectsBlockedTargets(): void {
		$response = $this->controller->discover('localhost');

		$this->assertSame(Http::STATUS_BAD_REQUEST, $response->getStatus());
		$this->assertSame('invalid base', $response->getData()['error']);
	}

	public function testDiscoverAllowsBlockedTargetsWhenSsrfGuardDisabled(): void {
		$provider = $this->createMock(\OCP\OCM\ICapabilityAwareOCMProvider::class);
		$provider->method('getInviteAcceptDialog')->willReturn('/index.php/apps/contacts/ocm/invite-accept-dialog');

		$this->invitesService->expects($this->atLeastOnce())
			->method('isSsrfGuardDisabled')
			->willReturn(true);
		$this->discovery->expects($this->once())
			->method('discover')
			->with('https://localhost')
			->willReturn($provider);

		$response = $this->controller->discover('localhost');

		$this->assertSame(Http::STATUS_OK, $response->getStatus());
		$this->assertSame('https://localhost', $response->getData()['base']);
	}

	public function testDiscoverUsesFallbackDialogAndOmitsRawPayload(): void {
		$provider = $this->createMock(\OCP\OCM\ICapabilityAwareOCMProvider::class);
		$provider->method('getInviteAcceptDialog')->willReturn('');

		$this->discovery->expects($this->once())
			->method('discover')
			->with('https://remote.example')
			->willReturn($provider);
		$this->wayfProvider->method('getInviteAcceptDialogPath')->willReturn('/index.php/apps/contacts/ocm/invite-accept-dialog');

		$response = $this->controller->discover('remote.example');

		$this->assertSame(Http::STATUS_OK, $response->getStatus());
		$body = $response->getData();
		$this->assertSame('https://remote.example', $body['base']);
		$this->assertSame('remote.example', $body['providerDomain']);
		$this->assertSame('https://remote.example/index.php/apps/contacts/ocm/invite-accept-dialog', $body['inviteAcceptDialogAbsolute']);
		$this->assertArrayNotHasKey('raw', $body);
	}

	public function testWayfUsesIncomingProviderDomainWhenPresent(): void {
		$this->request->expects($this->once())
			->method('getParam')
			->with('providerDomain', '')
			->willReturn('sender.example');
		$this->wayfProvider->expects($this->once())
			->method('getMeshProvidersFromCache')
			->willReturn(['mesh' => []]);
		$this->urlGenerator->expects($this->never())->method('getBaseUrl');
		$this->initialState->expects($this->once())
			->method('provideInitialState')
			->with('wayf', $this->callback(static function (array $state): bool {
				return $state['providerDomain'] === 'sender.example'
					&& $state['token'] === self::TOKEN
					&& isset($state['federations']);
			}));

		$response = $this->controller->wayf(self::TOKEN);

		$this->assertSame(Http::STATUS_OK, $response->getStatus());
	}

	public function testWayfFallsBackToBaseHostWhenProviderDomainMissing(): void {
		$this->request->expects($this->once())
			->method('getParam')
			->with('providerDomain', '')
			->willReturn('');
		$this->wayfProvider->expects($this->once())
			->method('getMeshProvidersFromCache')
			->willReturn(['mesh' => []]);
		$this->urlGenerator->expects($this->once())
			->method('getBaseUrl')
			->willReturn('https://receiver.example');
		$this->initialState->expects($this->once())
			->method('provideInitialState')
			->with('wayf', $this->callback(static function (array $state): bool {
				return $state['providerDomain'] === 'receiver.example'
					&& $state['token'] === self::TOKEN
					&& isset($state['federations']);
			}));

		$response = $this->controller->wayf(self::TOKEN);

		$this->assertSame(Http::STATUS_OK, $response->getStatus());
	}

	public function testAcceptInviteRejectsInvalidProviderTarget(): void {
		$response = $this->controller->acceptInvite(self::TOKEN, '127.0.0.1');

		$this->assertSame(Http::STATUS_BAD_REQUEST, $response->getStatus());
	}

	public function testSetOcmInviteBoolSettingReturnsForbiddenOnUnknownKey(): void {
		$this->invitesService->expects($this->once())
			->method('setOcmInviteBoolSetting')
			->with('not_a_real_key', true)
			->willReturn(false);

		$response = $this->controller->setOcmInviteBoolSetting('not_a_real_key', true);

		$this->assertSame(Http::STATUS_FORBIDDEN, $response->getStatus());
	}
}
