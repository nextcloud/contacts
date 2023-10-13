<?php

namespace OCA\Contacts\Reference;

use OCP\Accounts\IAccount;
use OCP\Accounts\IAccountProperty;
use OCP\Collaboration\Reference\IReference;
use OCP\Collaboration\Reference\Reference;
use OCP\IUser;
use PHPUnit\Framework\MockObject\MockObject;
use ChristophWurst\Nextcloud\Testing\TestCase;

use OCP\Accounts\IAccountManager;
use OCP\IL10N;
use OCP\IURLGenerator;
use OCP\IUserManager;

class ProfilePickerReferenceProviderTest extends TestCase {
	private string $userId = 'admin';
	private IL10N|MockObject $l10n;
	private IURLGenerator|MockObject $urlGenerator;
	private IUserManager|MockObject $userManager;
	private IAccountManager|MockObject $accountManager;
	private ProfilePickerReferenceProvider $referenceProvider;

	private array $testUsersData = [
		'user1' => 	[
			'user_id' => 'user1',
			'displayname' => 'First User',
			'email' => 'user1@domain.co',
			'avatarurl' => 'https://nextcloud.local/index.php/avatar/user1/64',
		],
		'user2' => [
			'user_id' => 'user2',
			'displayname' => 'Second User',
			'email' => 'user2@domain.co',
			'avatarurl' => 'https://nextcloud.local/index.php/avatar/user2/64',
		],
		'user3' => null,
	];
	private array $testAccountsData = [
		'user1' => [
			IAccountManager::PROPERTY_BIOGRAPHY => [
				'scope' => IAccountManager::SCOPE_PRIVATE,
				'value' => 'This is a first test user',
			],
			IAccountManager::PROPERTY_HEADLINE => [
				'scope' => IAccountManager::SCOPE_LOCAL,
				'value' => 'I\'m a first test user',
			],
			IAccountManager::PROPERTY_ADDRESS => [
				'scope' => IAccountManager::SCOPE_LOCAL,
				'value' => 'Odessa',
			],
			IAccountManager::PROPERTY_WEBSITE => [
				'scope' => IAccountManager::SCOPE_LOCAL,
				'value' => 'https://domain.co/testuser1',
			],
			IAccountManager::PROPERTY_ORGANISATION => [
				'scope' => IAccountManager::SCOPE_PRIVATE,
				'value' => 'Nextcloud GmbH',
			],
			IAccountManager::PROPERTY_ROLE => [
				'scope' => IAccountManager::SCOPE_LOCAL,
				'value' => 'Non-existing user',
			],
		],
		'user2' => [
			IAccountManager::PROPERTY_BIOGRAPHY => [
				'scope' => IAccountManager::SCOPE_LOCAL,
				'value' => 'This is a test user',
			],
			IAccountManager::PROPERTY_HEADLINE => [
				'scope' => IAccountManager::SCOPE_LOCAL,
				'value' => 'Second test user',
			],
			IAccountManager::PROPERTY_ADDRESS => [
				'scope' => IAccountManager::SCOPE_LOCAL,
				'value' => 'Berlin',
			],
			IAccountManager::PROPERTY_WEBSITE => [
				'scope' => IAccountManager::SCOPE_LOCAL,
				'value' => 'https://domain.co/testuser2',
			],
			IAccountManager::PROPERTY_ORGANISATION => [
				'scope' => IAccountManager::SCOPE_PRIVATE,
				'value' => 'Nextcloud GmbH',
			],
			IAccountManager::PROPERTY_ROLE => [
				'scope' => IAccountManager::SCOPE_LOCAL,
				'value' => 'Non-existing user',
			],
		],
		'user3' => null,
	];
	private string $baseUrl = 'https://nextcloud.local';
	private string $testLink = 'https://nextcloud.local/index.php/u/user';
	private array $testLinks = [
		'user1' => 'https://nextcloud.local/index.php/u/user1',
		'user2' => 'https://nextcloud.local/index.php/u/user2',
		'user4' => 'https://nextcloud.local/index.php/u/user4',
	];

	public function setUp(): void {
		parent::setUp();

		$this->l10n = $this->createMock(IL10N::class);
		$this->urlGenerator = $this->createMock(IURLGenerator::class);
		$this->userManager = $this->createMock(IUserManager::class);
		$this->accountManager = $this->createMock(IAccountManager::class);

		$this->referenceProvider = new ProfilePickerReferenceProvider(
			$this->l10n,
			$this->urlGenerator,
			$this->userManager,
			$this->accountManager,
			$this->userId
		);

		$this->urlGenerator->expects($this->any())
			->method('getBaseUrl')
			->willReturn($this->baseUrl);
	}

	private function getTestAccountPropertyValue(string $testUserId, string $property): mixed {
		if ($this->testAccountsData[$testUserId][$property]['scope'] === IAccountManager::SCOPE_PRIVATE) {
			return null;
		}
		return $this->testAccountsData[$testUserId][$property]['value'];
	}

	/**
	 * @param string $userId
	 * @return IReference|null
	 */
	private function setupUserAccountReferenceExpectation(string $userId): ?IReference {
		$user = $this->createMock(IUser::class);

		if (isset($this->testUsersData[$userId])) {

			// setup user expectations
			$user->expects($this->any())
				->method('getUID')
				->willReturn($this->testUsersData[$userId]['user_id']);
			$user->expects($this->any())
				->method('getDisplayName')
				->willReturn($this->testUsersData[$userId]['displayname']);
			$user->expects($this->any())
				->method('getEMailAddress')
				->willReturn($this->testUsersData[$userId]['email']);

			$this->userManager->expects($this->any())
				->method('get')
				->with($userId)
				->willReturn($user);

			// setup account expectations
			$account = $this->createMock(IAccount::class);
			$account->expects($this->any())
				->method('getProperty')
				->willReturnCallback(function ($property) use ($userId) {
					$propertyMock = $this->createMock(IAccountProperty::class);
					$propertyMock->expects($this->any())
						->method('getValue')
						->willReturn($this->testAccountsData[$userId][$property]['value']);
					$propertyMock->expects($this->any())
						->method('getScope')
						->willReturn($this->testAccountsData[$userId][$property]['scope']);
					return $propertyMock;
				});

			$this->accountManager->expects($this->any())
				->method('getAccount')
				->with($user)
				->willReturn($account);

			// setup reference
			if ($this->testUsersData[$userId] === null) {
				$expectedReference = null;
			} else {
				$expectedReference = new Reference($this->testLinks[$userId]);
				$expectedReference->setTitle($this->testUsersData[$userId]['displayname']);
				$expectedReference->setDescription($this->testUsersData[$userId]['email']);
				$expectedReference->setImageUrl($this->testUsersData[$userId]['avatarurl']);
				$bio = $this->getTestAccountPropertyValue($userId, IAccountManager::PROPERTY_BIOGRAPHY);
				$location = $this->getTestAccountPropertyValue($userId, IAccountManager::PROPERTY_ADDRESS);

				$expectedReference->setRichObject(ProfilePickerReferenceProvider::RICH_OBJECT_TYPE, [
					'user_id' => $this->testUsersData[$userId]['user_id'],
					'title' => $this->testUsersData[$userId]['displayname'],
					'subline' => $this->testUsersData[$userId]['email'] ?? $this->testUsersData[$userId]['displayname'],
					'email' => $this->testUsersData[$userId]['email'],
					'bio' => $bio !== null ? substr_replace($bio, '...', 80, strlen($bio)) : null,
					'headline' => $this->getTestAccountPropertyValue($userId, IAccountManager::PROPERTY_HEADLINE),
					'location' => $location,
					'location_url' => $location !== null ? 'https://www.openstreetmap.org/search?query=' . urlencode($location) : null,
					'website' => $this->getTestAccountPropertyValue($userId, IAccountManager::PROPERTY_WEBSITE),
					'organisation' => $this->getTestAccountPropertyValue($userId, IAccountManager::PROPERTY_ORGANISATION),
					'role' => $this->getTestAccountPropertyValue($userId, IAccountManager::PROPERTY_ROLE),
					'url' => $this->testLinks[$userId],
				]);
			}

			$this->urlGenerator->expects($this->any())
				->method('linkToRouteAbsolute')
				->with('core.avatar.getAvatar', ['userId' => $userId, 'size' => 64])
				->willReturn($this->testUsersData[$userId]['avatarurl']);
		}

		return $expectedReference ?? null;
	}

	/**
	 * Resolved reference should contain the expected reference fields according to account property scope
	 *
	 * @dataProvider resolveReferenceDataProvider
	 */
	public function testResolveReference($expected, $reference, $userId) {
		if (isset($userId)) {
			$expectedReference = $this->setupUserAccountReferenceExpectation($userId);
		}

		$resultReference = $this->referenceProvider->resolveReference($reference);
		$this->assertEquals($expected, isset($resultReference));
		$this->assertEquals($expectedReference ?? null, $resultReference);
	}

	public function testGetId() {
		$this->assertEquals('profile_picker', $this->referenceProvider->getId());
	}

	/**
	 * @dataProvider referenceDataProvider
	 */
	public function testMatchReference($expected, $reference) {
		$this->assertEquals($expected, $this->referenceProvider->matchReference($reference));
	}

	/**
	 * @dataProvider cacheKeyDataProvider
	 */
	public function testGetCacheKey($expected, $reference) {
		$this->assertEquals($expected, $this->referenceProvider->getCacheKey($reference));
	}

	public function testGetCachePrefix() {
		$this->assertEquals($this->userId, $this->referenceProvider->getCachePrefix($this->testLink));
	}

	public function testGetTitle() {
		$this->l10n->expects($this->once())
			->method('t')
			->with('Profile picker')
			->willReturn('Profile picker');
		$this->assertEquals('Profile picker', $this->referenceProvider->getTitle());
	}

	/**
	 * Test getObjectId method.
	 * It should return the userid extracted from the link (http(s)://domain.com/(index.php)/u/{userid}).
	 *
	 * @dataProvider objectIdDataProvider
	 */
	public function testGetObjectId($expected, $reference) {
		$this->assertEquals($expected, $this->referenceProvider->getObjectId($reference));
	}

	/**
	 * @dataProvider locationDataProvider
	 */
	public function testGetOpenStreetLocationUrl($expected, $location) {
		$this->assertEquals($expected, $this->referenceProvider->getOpenStreetLocationUrl($location));
	}

	public function referenceDataProvider(): array {
		return [
			'not a link' => [false, 'profile_picker'],
			'valid link to test user' => [true, 'https://nextcloud.local/index.php/u/user1'],
			'pretty link to test user' => [true, 'https://nextcloud.local/u/user1'],
			'not valid link' => [false, 'https://nextcloud.local'],
		];
	}

	public function objectIdDataProvider(): array {
		return [
			'valid link to test user' => ['user1', 'https://nextcloud.local/index.php/u/user1'],
			'not valid link' => [null, 'https://nextcloud.local'],
		];
	}

	public function cacheKeyDataProvider(): array {
		return [
			'valid link to test user' => ['user1', 'https://nextcloud.local/index.php/u/user1'],
			'not valid link' => ['https://nextcloud.local', 'https://nextcloud.local'],
		];
	}

	public function locationDataProvider(): array {
		return [
			'link to location' => ['https://www.openstreetmap.org/search?query=location', 'location'],
			'link to Odessa' => ['https://www.openstreetmap.org/search?query=Odessa', 'Odessa'],
			'link to Frankfurt am Main' => ['https://www.openstreetmap.org/search?query=Frankfurt+am+Main', 'Frankfurt am Main'],
		];
	}

	public function resolveReferenceDataProvider(): array {
		return [
			'test reference for user1' => [true, 'https://nextcloud.local/index.php/u/user1', 'user1'],
			'test reference for user2' => [true, 'https://nextcloud.local/index.php/u/user2', 'user2'],
			'test reference for non-existing user' => [false, 'https://nextcloud.local/index.php/u/user4', 'user4'],
			'test reference for not valid link' => [null, 'https://nextcloud.local', null],
		];
	}
}
