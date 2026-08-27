<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Tests;

use OCA\Contacts\AppInfo\Application;
use OCA\Contacts\Db\FederatedInvite;
use OCA\Contacts\Db\FederatedInviteMapper;
use OCA\Contacts\Exception\ContactAlreadyExistsException;
use OCA\Contacts\Service\FederatedInvitesService;
use OCA\Contacts\Service\SocialApiService;
use OCA\DAV\CardDAV\CardDavBackend;
use OCA\FederatedFileSharing\AddressHandler;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Utility\ITimeFactory;
use OCP\IAppConfig;
use OCP\IURLGenerator;
use OCP\IUser;
use OCP\IUserManager;
use OCP\IUserSession;
use PHPUnit\Framework\MockObject\MockObject;
use Psr\Log\LoggerInterface;
use Test\TestCase;

class FederatedInvitesServiceTest extends TestCase {

	private AddressHandler&MockObject $addressHandler;
	private IAppConfig&MockObject $appConfig;
	private ITimeFactory&MockObject $timeFactory;
	private IURLGenerator&MockObject $urlGenerator;
	private IUserManager&MockObject $userManager;
	private IUserSession&MockObject $userSession;
	private FederatedInviteMapper&MockObject $federatedInviteMapper;
	private LoggerInterface&MockObject $logger;
	private SocialApiService&MockObject $socialApiService;

	private FederatedInvitesService $federatedInvitesService;

	protected function setUp(): void {
		parent::setUp();

		$this->addressHandler = $this->createMock(AddressHandler::class);
		$this->appConfig = $this->createMock(IAppConfig::class);
		$this->timeFactory = $this->createMock(ITimeFactory::class);
		$this->urlGenerator = $this->createMock(IURLGenerator::class);
		$this->userManager = $this->createMock(IUserManager::class);
		$this->userSession = $this->createMock(IUserSession::class);
		$this->federatedInviteMapper = $this->createMock(FederatedInviteMapper::class);
		$this->logger = $this->createMock(LoggerInterface::class);
		$this->socialApiService = $this->createMock(SocialApiService::class);

		$this->federatedInvitesService = new FederatedInvitesService(
			$this->addressHandler,
			$this->appConfig,
			$this->timeFactory,
			$this->urlGenerator,
			$this->userManager,
			$this->userSession,
			$this->federatedInviteMapper,
			$this->logger,
			$this->socialApiService,
		);
	}

	private function buildInvitation(
		string $token = 'token-123',
		string $userId = 'sender',
		bool $accepted = false,
		?int $expiredAt = null,
	): FederatedInvite {
		$invitation = new FederatedInvite();
		$invitation->setToken($token);
		$invitation->setUserId($userId);
		$invitation->setAccepted($accepted);
		$invitation->setExpiredAt($expiredAt);
		return $invitation;
	}

	private function buildUser(string $uid = 'sender', ?string $email = 'sender@example.org', string $name = 'Sender User'): IUser {
		$user = $this->createMock(IUser::class);
		$user->method('getUID')->willReturn($uid);
		$user->method('getEMailAddress')->willReturn($email);
		$user->method('getDisplayName')->willReturn($name);
		return $user;
	}

	public function testSetOcmInviteBoolSettingWritesAllowedKey(): void {
		$this->appConfig->expects(self::once())
			->method('setValueBool')
			->with('contacts', 'ocm_invites_optional_mail', true);

		$result = $this->federatedInvitesService->setOcmInviteBoolSetting('ocm_invites_optional_mail', true);

		$this->assertTrue($result);
	}

	public function testSetOcmInviteBoolSettingRejectsUnknownKey(): void {
		$this->appConfig->expects(self::never())
			->method('setValueBool');

		$result = $this->federatedInvitesService->setOcmInviteBoolSetting('ocm_invites_arbitrary_unknown_key', true);

		$this->assertFalse($result);
	}

	public function testIsSsrfGuardDisabledReadsConfigToggle(): void {
		$this->appConfig->expects(self::once())
			->method('getValueBool')
			->with(Application::APP_ID, 'ocm_invites_disable_ssrf_guard')
			->willReturn(true);

		$this->assertTrue($this->federatedInvitesService->isSsrfGuardDisabled());
	}

	public function testCreateNewContactUsesReturnedAddressBookUriInContactRef(): void {
		$this->socialApiService->expects(self::once())
			->method('createContact')
			->with('remote@example.org', 'remote@example.org', 'Remote User', 'sender')
			->willReturn([
				'UID' => 'new-contact-uid',
				'ADDRESSBOOK_URI' => 'work',
			]);

		$result = $this->federatedInvitesService->createNewContact(
			'remote@example.org',
			'remote@example.org',
			'Remote User',
			'sender',
		);

		$this->assertSame('new-contact-uid~work', $result);
	}

	public function testCreateNewContactFallsBackToPersonalAddressBookUri(): void {
		$this->socialApiService->expects(self::once())
			->method('createContact')
			->with('remote@example.org', 'remote@example.org', 'Remote User', 'sender')
			->willReturn([
				'UID' => 'new-contact-uid',
			]);

		$result = $this->federatedInvitesService->createNewContact(
			'remote@example.org',
			'remote@example.org',
			'Remote User',
			'sender',
		);

		$this->assertSame(
			'new-contact-uid~' . CardDavBackend::PERSONAL_ADDRESSBOOK_URI,
			$result,
		);
	}

	public function testSetOcmInviteBoolSettingCoversEachAllowedKey(): void {
		$keys = FederatedInvitesService::OCM_INVITES_BOOL_KEYS;
		$this->assertNotEmpty(
			$keys,
			'OCM_INVITES_BOOL_KEYS must not be empty; otherwise the allowlist coverage is vacuous.',
		);

		$expectedCalls = [];
		foreach ($keys as $key) {
			$expectedCalls[] = [Application::APP_ID, $key, false];
		}

		$invocation = $this->exactly(count($keys));
		$this->appConfig->expects($invocation)
			->method('setValueBool')
			->willReturnCallback(function (string $appId, string $configKey, bool $value) use (&$expectedCalls, $invocation): bool {
				$index = $invocation->numberOfInvocations() - 1;
				$this->assertSame($expectedCalls[$index][0], $appId);
				$this->assertSame($expectedCalls[$index][1], $configKey);
				$this->assertSame($expectedCalls[$index][2], $value);
				return true;
			});

		foreach ($keys as $key) {
			$this->assertTrue(
				$this->federatedInvitesService->setOcmInviteBoolSetting($key, false),
				"Allowed key '$key' should be writable",
			);
		}
	}

	public function testInviteAcceptedRejectsEmptyToken(): void {
		$response = $this->federatedInvitesService->inviteAccepted(
			'https://nextcloud2.docker',
			'',
			'michiel',
			'michiel@example.test',
			'Michiel',
		);

		$this->assertSame(Http::STATUS_BAD_REQUEST, $response->getStatus());
		$this->assertSame('Invalid or non existing token', $response->getData()['message']);
	}

	public function testInviteAcceptedRejectsMissingInvite(): void {
		$this->federatedInviteMapper->expects(self::once())
			->method('findByToken')
			->with('token-123')
			->willThrowException(new DoesNotExistException('not found'));

		$response = $this->federatedInvitesService->inviteAccepted(
			'https://nextcloud2.docker',
			'token-123',
			'michiel',
			'michiel@example.test',
			'Michiel',
		);

		$this->assertSame(Http::STATUS_BAD_REQUEST, $response->getStatus());
		$this->assertSame('Invalid or non existing token', $response->getData()['message']);
	}

	public function testInviteAcceptedRejectsAlreadyAcceptedInvite(): void {
		$invitation = $this->buildInvitation(accepted: true);
		$this->federatedInviteMapper->expects(self::once())
			->method('findByToken')
			->with('token-123')
			->willReturn($invitation);

		$response = $this->federatedInvitesService->inviteAccepted(
			'https://nextcloud2.docker',
			'token-123',
			'michiel',
			'michiel@example.test',
			'Michiel',
		);

		$this->assertSame(Http::STATUS_CONFLICT, $response->getStatus());
		$this->assertSame('Invite already accepted', $response->getData()['message']);
	}

	public function testInviteAcceptedRejectsMissingRecipientEmail(): void {
		$this->federatedInviteMapper->expects(self::never())->method('findByToken');

		$response = $this->federatedInvitesService->inviteAccepted(
			'https://nextcloud2.docker',
			'token-123',
			'michiel',
			'',
			'Michiel',
		);

		$this->assertSame(Http::STATUS_BAD_REQUEST, $response->getStatus());
		$this->assertSame('Could not accept invite, user data is incomplete.', $response->getData()['message']);
	}

	public function testInviteAcceptedRejectsMissingSenderEmail(): void {
		$invitation = $this->buildInvitation();
		$this->federatedInviteMapper->expects(self::once())
			->method('findByToken')
			->with('token-123')
			->willReturn($invitation);
		$this->timeFactory->expects(self::once())
			->method('getTime')
			->willReturn(1_800_000_000);
		$this->userManager->expects(self::once())
			->method('get')
			->with('sender')
			->willReturn($this->buildUser(email: null));

		$response = $this->federatedInvitesService->inviteAccepted(
			'https://nextcloud2.docker',
			'token-123',
			'michiel',
			'michiel@example.test',
			'Michiel',
		);

		$this->assertSame(Http::STATUS_BAD_REQUEST, $response->getStatus());
		$this->assertSame('Invalid or non existing token', $response->getData()['message']);
	}

	public function testInviteAcceptedMarksInviteAcceptedAndCreatesSenderSideContact(): void {
		$invitation = $this->buildInvitation();
		$this->federatedInviteMapper->expects(self::once())
			->method('findByToken')
			->with('token-123')
			->willReturn($invitation);
		$this->timeFactory->expects(self::once())
			->method('getTime')
			->willReturn(1_800_000_000);
		$this->userManager->expects(self::once())
			->method('get')
			->with('sender')
			->willReturn($this->buildUser());
		$this->federatedInviteMapper->expects(self::once())
			->method('update')
			->with(self::callback(static function (FederatedInvite $updated): bool {
				return $updated->isAccepted() === true
					&& $updated->getAcceptedAt() === 1_800_000_000
					&& $updated->getRecipientProvider() === 'https://nextcloud2.docker'
					&& $updated->getRecipientUserId() === 'michiel'
					&& $updated->getRecipientName() === 'Michiel'
					&& $updated->getRecipientEmail() === 'michiel@example.test';
			}))
			->willReturnCallback(static fn (FederatedInvite $updated): FederatedInvite => $updated);
		$this->addressHandler->expects(self::once())
			->method('removeProtocolFromUrl')
			->with('https://nextcloud2.docker')
			->willReturn('nextcloud2.docker');
		$this->socialApiService->expects(self::once())
			->method('createContact')
			->with('michiel@nextcloud2.docker', 'michiel@example.test', 'Michiel', 'sender')
			->willReturn([
				'UID' => 'created-uid',
				'ADDRESSBOOK_URI' => 'work',
			]);

		$response = $this->federatedInvitesService->inviteAccepted(
			'https://nextcloud2.docker',
			'token-123',
			'michiel',
			'michiel@example.test',
			'Michiel',
		);

		$this->assertSame(Http::STATUS_OK, $response->getStatus());
		$this->assertSame([
			'userID' => 'sender',
			'email' => 'sender@example.org',
			'name' => 'Sender User',
		], $response->getData());
	}

	public function testInviteAcceptedReturnsInternalServerErrorWhenSenderContactCreationFails(): void {
		$invitation = $this->buildInvitation();
		$this->federatedInviteMapper->expects(self::once())
			->method('findByToken')
			->with('token-123')
			->willReturn($invitation);
		$this->timeFactory->expects(self::once())
			->method('getTime')
			->willReturn(1_800_000_000);
		$this->userManager->expects(self::once())
			->method('get')
			->with('sender')
			->willReturn($this->buildUser());
		$this->addressHandler->expects(self::once())
			->method('removeProtocolFromUrl')
			->with('https://nextcloud2.docker')
			->willReturn('nextcloud2.docker');
		$this->socialApiService->expects(self::once())
			->method('createContact')
			->with('michiel@nextcloud2.docker', 'michiel@example.test', 'Michiel', 'sender')
			->willReturn(null);
		$this->federatedInviteMapper->expects(self::never())->method('update');

		$response = $this->federatedInvitesService->inviteAccepted(
			'https://nextcloud2.docker',
			'token-123',
			'michiel',
			'michiel@example.test',
			'Michiel',
		);

		$this->assertSame(Http::STATUS_INTERNAL_SERVER_ERROR, $response->getStatus());
		$this->assertSame('Could not create sender-side contact after invite acceptance.', $response->getData()['message']);
	}

	public function testInviteAcceptedReturnsSuccessWhenContactAlreadyExists(): void {
		$invitation = $this->buildInvitation();
		$this->federatedInviteMapper->expects(self::once())
			->method('findByToken')
			->with('token-123')
			->willReturn($invitation);
		$this->timeFactory->expects(self::once())
			->method('getTime')
			->willReturn(1_800_000_000);
		$this->userManager->expects(self::once())
			->method('get')
			->with('sender')
			->willReturn($this->buildUser());
		$this->federatedInviteMapper->expects(self::once())
			->method('update')
			->willReturnCallback(static fn (FederatedInvite $updated): FederatedInvite => $updated);
		$this->addressHandler->expects(self::once())
			->method('removeProtocolFromUrl')
			->with('https://nextcloud2.docker')
			->willReturn('nextcloud2.docker');
		$this->socialApiService->expects(self::once())
			->method('createContact')
			->willThrowException(new ContactAlreadyExistsException('exists'));

		$response = $this->federatedInvitesService->inviteAccepted(
			'https://nextcloud2.docker',
			'token-123',
			'michiel',
			'michiel@example.test',
			'Michiel',
		);

		$this->assertSame(Http::STATUS_OK, $response->getStatus());
		$this->assertSame([
			'userID' => 'sender',
			'email' => 'sender@example.org',
			'name' => 'Sender User',
		], $response->getData());
	}
}
