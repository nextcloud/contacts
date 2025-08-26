<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Controller;

use ChristophWurst\Nextcloud\Testing\TestCase;
use OCP\Contacts\IManager as IContactsManager;
use OCP\Files\File;
use OCP\Files\Folder;
use OCP\Files\IRootFolder;
use OCP\IAddressBook;
use OCP\ICreateContactFromString;
use OCP\IRequest;
use OCP\IUser;
use OCP\IUserSession;
use OCP\Security\ISecureRandom;
use PHPUnit\Framework\MockObject\MockObject;

class ImportControllerTest extends TestCase {
	private ImportController $controller;

	private IRequest&MockObject $request;
	private IUserSession&MockObject $userSession;
	private IContactsManager&MockObject $contactsManager;
	private IRootFolder&MockObject $rootFolder;
	private ISecureRandom&MockObject $secureRandom;

	protected function setUp(): void {
		parent::setUp();

		$this->request = $this->createMock(IRequest::class);
		$this->userSession = $this->createMock(IUserSession::class);
		$this->contactsManager = $this->createMock(IContactsManager::class);
		$this->rootFolder = $this->createMock(IRootFolder::class);
		$this->secureRandom = $this->createMock(ISecureRandom::class);

		$this->controller = new ImportController(
			$this->request,
			$this->userSession,
			$this->contactsManager,
			$this->rootFolder,
			$this->secureRandom,
		);
	}

	public static function provideImportFileData(): array {
		return [
			// Correct mime type and ending
			['11', null, 'text/vcard', 'vcf'],
			[null, 'foo', 'text/vcard', 'vcf'],

			// Correct mime type but incorrect ending
			['11', null, 'text/vcard', 'baz'],
			[null, 'foo', 'text/vcard', 'baz'],

			// Incorrect mime type but correct ending
			['11', null, 'invalid/mimetype', 'vcf'],
			[null, 'foo', 'invalid/mimetype', 'vcf'],
		];
	}

	/**
	 * @dataProvider provideImportFileData
	 */
	public function testImport(
		?string $addressBookKey,
		?string $addressBookUri,
		string $mimeType,
		string $extension,
	): void {
		$vCard1 = <<<EOF
BEGIN:VCARD
VERSION:3.0
PRODID:-//Sabre//Sabre VObject 4.5.6//EN
N:Gump;Forrest;;Mr.;
FN:Forrest Gump
ORG:Sheri Nom Co.
TITLE:Ultimate Warrior
EMAIL:sherinnom@example.com
REV;VALUE=DATE:20250822
X-QQ:21588891
UID:5efe2430-92e5-4ea2-9a7c-a05aed152ec92
END:VCARD
EOF;
		$vCard2 = <<<EOF
BEGIN:VCARD
VERSION:3.0
PRODID:-//Sabre//Sabre VObject 4.5.6//EN
N:Bar;Foo;;;
FN:Foo Bar
TITLE:Testing Data
EMAIL:foobar@baz.com
REV;VALUE=DATE:20250822
X-CUSTOM:foobarbaz
UID:8befe502-6cff-4435-a6a5-96ab7cc8df8b
END:VCARD
EOF;
		$vCards = "$vCard1\n\n$vCard2";

		$user = $this->createMock(IUser::class);
		$user->method('getUID')
			->willReturn('user1');
		$this->userSession->expects(self::once())
			->method('getUser')
			->willReturn($user);

		$addressBook1 = $this->createMock(ICreateContactFromString::class);
		$addressBook1->method('getKey')
			->willReturn('10');
		$addressBook1->method('getUri')
			->willReturn('contacts');
		$addressBook2 = $this->createMock(ICreateContactFromString::class);
		$addressBook2->method('getKey')
			->willReturn('11');
		$addressBook2->method('getUri')
			->willReturn('foo');
		$this->contactsManager->expects(self::once())
			->method('getUserAddressBooks')
			->willReturn([
				$addressBook1,
				$addressBook2,
			]);

		$file = $this->createMock(File::class);
		$file->method('getMimeType')
			->willReturn($mimeType);
		$file->method('getExtension')
			->willReturn($extension);
		$file->expects(self::once())
			->method('getContent')
			->willReturn($vCards);
		$userFolder = $this->createMock(Folder::class);
		$userFolder->expects(self::once())
			->method('getFirstNodeById')
			->with(42)
			->willReturn($file);
		$this->rootFolder->expects(self::once())
			->method('getUserFolder')
			->with('user1')
			->willReturn($userFolder);

		$this->secureRandom->expects(self::exactly(2))
			->method('generate')
			->with(32, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789')
			->willReturn('RANDOM-UID');

		$addressBook1->expects(self::never())
			->method('createFromString');
		$addressBook2->expects(self::exactly(2))
			->method('createFromString')
			->willReturnMap([
				['RANDOM-UID.vcf', $vCard1],
				['RANDOM-UID.vcf', $vCard2],
			]);

		$actual = $this->controller->import(42, $addressBookKey, $addressBookUri);
		$this->assertEqualsCanonicalizing([
			'importedContactUris' => [
				'RANDOM-UID.vcf',
				'RANDOM-UID.vcf',
			],
		], $actual->getData());
		$this->assertEquals(200, $actual->getStatus());
	}

	public function testImportWithoutUserSession(): void {
		$this->userSession->expects(self::once())
			->method('getUser')
			->willReturn(null);

		$actual = $this->controller->import(42, '11');
		$this->assertEquals(401, $actual->getStatus());
		$this->assertEquals('Not logged in', $actual->getData());
	}

	public function provideAddressBookNotFoundData(): array {
		$addressBook1 = $this->createMock(ICreateContactFromString::class);
		$addressBook1->method('getKey')
			->willReturn('10');

		$createAddressBook = function (string $class, string $key, string $uri) {
			$addressBook = $this->createMock($class);
			$addressBook->method('getKey')
				->willReturn($key);
			$addressBook->method('getUri')
				->willReturn($uri);
			if ($class === ICreateContactFromString::class) {
				$addressBook->expects(self::never())
					->method('createFromString');
			}
			return $addressBook;
		};

		return [
			// Invalid key
			[
				'12', null,
				[
					$createAddressBook(ICreateContactFromString::class, '10', 'contacts'),
					$createAddressBook(ICreateContactFromString::class, '11', 'foo'),
				],
			],
			// Invalid uri
			[
				null, 'not-existing',
				[
					$createAddressBook(ICreateContactFromString::class, '10', 'contacts'),
					$createAddressBook(ICreateContactFromString::class, '11', 'foo'),
				],
			],
			// Correct key but incorrect interface
			[
				'11', null,
				[
					$createAddressBook(ICreateContactFromString::class, '10', 'contacts'),
					$createAddressBook(IAddressBook::class, '11', 'foo'),
				],
			],
			// Correct uri but incorrect interface
			[
				null, 'foo',
				[
					$createAddressBook(ICreateContactFromString::class, '10', 'contacts'),
					$createAddressBook(IAddressBook::class, '11', 'foo'),
				],
			],
		];
	}

	/**
	 * @dataProvider provideAddressBookNotFoundData
	 */
	public function testImportWithAddressBookNotFound(
		?string $key,
		?string $uri,
		array $addressBooks,
	): void {
		$user = $this->createMock(IUser::class);
		$user->method('getUID')
			->willReturn('user1');
		$this->userSession->expects(self::once())
			->method('getUser')
			->willReturn($user);

		$this->contactsManager->expects(self::once())
			->method('getUserAddressBooks')
			->willReturn($addressBooks);

		$actual = $this->controller->import(42, $key, $uri);
		$this->assertEquals('Address book not found', $actual->getData());
		$this->assertEquals(404, $actual->getStatus());
	}

	public function testImportWithFileNotFound(): void {
		$user = $this->createMock(IUser::class);
		$user->method('getUID')
			->willReturn('user1');
		$this->userSession->expects(self::once())
			->method('getUser')
			->willReturn($user);

		$addressBook1 = $this->createMock(ICreateContactFromString::class);
		$addressBook1->method('getKey')
			->willReturn('10');
		$addressBook2 = $this->createMock(ICreateContactFromString::class);
		$addressBook2->method('getKey')
			->willReturn('11');
		$this->contactsManager->expects(self::once())
			->method('getUserAddressBooks')
			->willReturn([
				$addressBook1,
				$addressBook2,
			]);

		$file = $this->createMock(File::class);
		$userFolder = $this->createMock(Folder::class);
		$userFolder->expects(self::once())
			->method('getFirstNodeById')
			->with(42)
			->willReturn(null);
		$this->rootFolder->expects(self::once())
			->method('getUserFolder')
			->with('user1')
			->willReturn($userFolder);

		$addressBook1->expects(self::never())
			->method('createFromString');
		$addressBook2->expects(self::never())
			->method('createFromString');

		$actual = $this->controller->import(42, '11');
		$this->assertEquals('File not found', $actual->getData());
		$this->assertEquals(404, $actual->getStatus());
	}

	public function testImportWithNotAFile(): void {
		$user = $this->createMock(IUser::class);
		$user->method('getUID')
			->willReturn('user1');
		$this->userSession->expects(self::once())
			->method('getUser')
			->willReturn($user);

		$addressBook1 = $this->createMock(ICreateContactFromString::class);
		$addressBook1->method('getKey')
			->willReturn('10');
		$addressBook2 = $this->createMock(ICreateContactFromString::class);
		$addressBook2->method('getKey')
			->willReturn('11');
		$this->contactsManager->expects(self::once())
			->method('getUserAddressBooks')
			->willReturn([
				$addressBook1,
				$addressBook2,
			]);

		$file = $this->createMock(Folder::class);
		$userFolder = $this->createMock(Folder::class);
		$userFolder->expects(self::once())
			->method('getFirstNodeById')
			->with(42)
			->willReturn($file);
		$this->rootFolder->expects(self::once())
			->method('getUserFolder')
			->with('user1')
			->willReturn($userFolder);

		$addressBook1->expects(self::never())
			->method('createFromString');
		$addressBook2->expects(self::never())
			->method('createFromString');

		$actual = $this->controller->import(42, '11');
		$this->assertEquals('Not a file', $actual->getData());
		$this->assertEquals(400, $actual->getStatus());
	}

	public function testImportWithInvalidFileType(): void {
		$user = $this->createMock(IUser::class);
		$user->method('getUID')
			->willReturn('user1');
		$this->userSession->expects(self::once())
			->method('getUser')
			->willReturn($user);

		$addressBook1 = $this->createMock(ICreateContactFromString::class);
		$addressBook1->method('getKey')
			->willReturn('10');
		$addressBook2 = $this->createMock(ICreateContactFromString::class);
		$addressBook2->method('getKey')
			->willReturn('11');
		$this->contactsManager->expects(self::once())
			->method('getUserAddressBooks')
			->willReturn([
				$addressBook1,
				$addressBook2,
			]);

		$file = $this->createMock(File::class);
		$file->method('getMimeType')
			->willReturn('invalid/mimetype');
		$file->method('getExtension')
			->willReturn('baz');
		$userFolder = $this->createMock(Folder::class);
		$userFolder->expects(self::once())
			->method('getFirstNodeById')
			->with(42)
			->willReturn($file);
		$this->rootFolder->expects(self::once())
			->method('getUserFolder')
			->with('user1')
			->willReturn($userFolder);

		$addressBook1->expects(self::never())
			->method('createFromString');
		$addressBook2->expects(self::never())
			->method('createFromString');

		$actual = $this->controller->import(42, '11');
		$this->assertEqualsCanonicalizing('Not a vCard file', $actual->getData());
		$this->assertEquals(400, $actual->getStatus());
	}
}
