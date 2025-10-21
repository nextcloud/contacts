<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Controller;

use ChristophWurst\Nextcloud\Testing\TestCase;
use OCP\Constants;
use OCP\Contacts\IManager as IContactsManager;
use OCP\Files\File;
use OCP\Files\Folder;
use OCP\Files\IRootFolder;
use OCP\IAddressBook;
use OCP\ICreateContactFromString;
use OCP\IL10N;
use OCP\IRequest;
use OCP\L10N\IFactory as IL10nFactory;
use OCP\Security\ISecureRandom;
use PHPUnit\Framework\MockObject\MockObject;
use Psr\Log\LoggerInterface;

class ImportControllerTest extends TestCase {
	private const USER_ID = 'user1';

	private ImportController $controller;

	private IRequest&MockObject $request;
	private IL10nFactory&MockObject $l10nFactory;
	private IL10N&MockObject $l10n;
	private IContactsManager&MockObject $contactsManager;
	private IRootFolder&MockObject $rootFolder;
	private ISecureRandom&MockObject $secureRandom;
	private LoggerInterface&MockObject $logger;

	protected function setUp(): void {
		parent::setUp();

		$this->request = $this->createMock(IRequest::class);
		$this->l10nFactory = $this->createMock(IL10nFactory::class);
		$this->contactsManager = $this->createMock(IContactsManager::class);
		$this->rootFolder = $this->createMock(IRootFolder::class);
		$this->secureRandom = $this->createMock(ISecureRandom::class);
		$this->logger = $this->createMock(LoggerInterface::class);

		$this->l10n = $this->createMock(IL10N::class);
		$this->l10nFactory->expects(self::once())
			->method('get')
			->with('contacts')
			->willReturn($this->l10n);

		$this->controller = new ImportController(
			$this->request,
			$this->l10nFactory,
			self::USER_ID,
			$this->contactsManager,
			$this->rootFolder,
			$this->secureRandom,
			$this->logger,
		);
	}

	public static function provideImportFileData(): array {
		return [
			// Correct mime type and ending
			['text/vcard', 'vcf'],
			// Correct mime type but incorrect ending
			['text/vcard', 'baz'],
			// Incorrect mime type but correct ending
			['invalid/mimetype', 'vcf'],
		];
	}

	/**
	 * @dataProvider provideImportFileData
	 */
	public function testImport(string $mimeType, string $extension): void {
		$vCard1 = file_get_contents(__DIR__ . '/../../assets/forrest-gump.vcf');
		$vCard2 = file_get_contents(__DIR__ . '/../../assets/without-uid.vcf');
		$vCards = "$vCard1\n\n$vCard2";

		$addressBook1 = $this->createMock(ICreateContactFromString::class);
		$addressBook1->method('getUri')
			->willReturn('contacts');
		$addressBook1->method(('getPermissions'))
			->willReturn(Constants::PERMISSION_UPDATE);
		$addressBook2 = $this->createMock(ICreateContactFromString::class);
		$addressBook2->method('getUri')
			->willReturn('foo');
		$addressBook2->method(('getPermissions'))
			->willReturn(Constants::PERMISSION_UPDATE);
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
			->with(self::USER_ID)
			->willReturn($userFolder);

		$addressBook1->expects(self::never())
			->method('search');
		$addressBook2->expects(self::once())
			->method('search')
			->with('5efe2430-92e5-4ea2-9a7c-a05aed152ec92', ['UID'], [
				'limit' => 1,
				'wildcard' => false,
			])
			->willReturn([]);

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

		$this->mockL10n();

		$actual = $this->controller->import(42, 'foo');
		$this->assertEqualsCanonicalizing('Imported %n contacts', $actual->getData());
		$this->assertEquals(200, $actual->getStatus());
	}

	public function provideImportDefaultAddressBookData(): array {
		$createMockAddressBook = function (
			string $class,
			string $uri,
			bool $isShared,
			int $permissions,
		): MockObject {
			$addressBook = $this->createMock($class);
			$addressBook->method('getUri')
				->willReturn($uri);
			$addressBook->method('isShared')
				->willReturn($isShared);
			$addressBook->method('getPermissions')
				->willReturn($permissions);
			return $addressBook;
		};

		return [
			// Default address book
			[$createMockAddressBook(ICreateContactFromString::class, 'contacts', false, Constants::PERMISSION_ALL)],
			// Owned and writable
			[$createMockAddressBook(ICreateContactFromString::class, 'foo', false, Constants::PERMISSION_CREATE)],
		];
	}

	/**
	 * @dataProvider provideImportDefaultAddressBookData
	 */
	public function testImportWithDefaultAddressBook(MockObject $addressBook): void {
		$vCard1 = file_get_contents(__DIR__ . '/../../assets/forrest-gump.vcf');
		$vCard2 = file_get_contents(__DIR__ . '/../../assets/without-uid.vcf');
		$vCards = "$vCard1\n\n$vCard2";

		$this->contactsManager->expects(self::once())
			->method('getUserAddressBooks')
			->willReturn([$addressBook]);

		$file = $this->createMock(File::class);
		$file->method('getMimeType')
			->willReturn('text/vcard');
		$file->method('getExtension')
			->willReturn('vcf');
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
			->with(self::USER_ID)
			->willReturn($userFolder);

		$this->secureRandom->expects(self::exactly(2))
			->method('generate')
			->with(32, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789')
			->willReturn('RANDOM-UID');

		$addressBook->expects(self::exactly(2))
			->method('createFromString')
			->willReturnMap([
				['RANDOM-UID.vcf', $vCard1],
				['RANDOM-UID.vcf', $vCard2],
			]);

		$this->mockL10n();

		$actual = $this->controller->import(42);
		$this->assertEquals('Imported %n contacts', $actual->getData());
		$this->assertEquals(200, $actual->getStatus());
	}

	public function testImportWithExisting(): void {
		$vCard = file_get_contents(__DIR__ . '/../../assets/forrest-gump.vcf');

		$addressBook1 = $this->createMock(ICreateContactFromString::class);
		$addressBook1->method('getUri')
			->willReturn('contacts');
		$addressBook1->method(('getPermissions'))
			->willReturn(Constants::PERMISSION_UPDATE);
		$this->contactsManager->expects(self::once())
			->method('getUserAddressBooks')
			->willReturn([
				$addressBook1,
			]);

		$file = $this->createMock(File::class);
		$file->method('getMimeType')
			->willReturn('text/vcard');
		$file->method('getExtension')
			->willReturn('vcf');
		$file->expects(self::once())
			->method('getContent')
			->willReturn($vCard);
		$userFolder = $this->createMock(Folder::class);
		$userFolder->expects(self::once())
			->method('getFirstNodeById')
			->with(42)
			->willReturn($file);
		$this->rootFolder->expects(self::once())
			->method('getUserFolder')
			->with(self::USER_ID)
			->willReturn($userFolder);

		$addressBook1->expects(self::once())
			->method('search')
			->with('5efe2430-92e5-4ea2-9a7c-a05aed152ec92', ['UID'], [
				'limit' => 1,
				'wildcard' => false,
			])
			->willReturn([
				['UID' => '5efe2430-92e5-4ea2-9a7c-a05aed152ec92'],
			]);

		$addressBook1->expects(self::never())
			->method('createFromString');

		$this->mockL10n();

		$actual = $this->controller->import(42, 'contacts');
		$this->assertEquals('Imported %n contacts (skipped %d)', $actual->getData());
		$this->assertEquals(200, $actual->getStatus());
	}

	public function testImportWithNoPermissions(): void {
		$uri = 'contacts_shared_from_another_user';
		$addressBook1 = $this->createMock(ICreateContactFromString::class);
		$addressBook1->method('getUri')
			->willReturn($uri);

		$addressBook1->method('getPermissions')
			->willReturn(Constants::PERMISSION_READ);
		$this->contactsManager->expects(self::once())
			->method('getUserAddressBooks')
			->willReturn([
				$addressBook1,
			]);

		$actual = $this->controller->import(42, addressBookUri: $uri);
		$this->assertEquals(expected: 'Insufficient permissions to import into the address book ' . $uri, actual: $actual->getData());
		$this->assertEquals(expected: 403, actual: $actual->getStatus());
	}

	public function testImportWithoutUserSession(): void {
		$l10nFactory = $this->createMock(IL10nFactory::class);
		$l10nFactory->expects(self::once())
			->method('get')
			->with('contacts')
			->willReturn($this->createMock(IL10N::class));

		$controller = new ImportController(
			$this->request,
			$l10nFactory,
			null,
			$this->contactsManager,
			$this->rootFolder,
			$this->secureRandom,
			$this->logger,
		);

		$actual = $controller->import(42);
		$this->assertEquals(401, $actual->getStatus());
		$this->assertEquals('Not logged in', $actual->getData());
	}

	public function provideAddressBookNotFoundData(): array {
		$createMockAddressBook = function (string $class, string $uri): MockObject {
			$addressBook = $this->createMock($class);
			$addressBook->method('getUri')
				->willReturn($uri);
			if ($class === ICreateContactFromString::class) {
				$addressBook->expects(self::never())
					->method('createFromString');
			}
			return $addressBook;
		};

		return [
			// Invalid uri
			[
				'not-existing',
				[
					$createMockAddressBook(ICreateContactFromString::class, 'contacts'),
					$createMockAddressBook(ICreateContactFromString::class, 'foo'),
					$createMockAddressBook(ICreateContactFromString::class, 'bar'),
				],
			],
			// Correct uri but incorrect interface
			[
				'bar',
				[
					$createMockAddressBook(ICreateContactFromString::class, 'contacts'),
					$createMockAddressBook(ICreateContactFromString::class, 'foo'),
					$createMockAddressBook(IAddressBook::class, 'bar'),
				],
			],
		];
	}

	/**
	 * @dataProvider provideAddressBookNotFoundData
	 */
	public function testImportWithAddressBookNotFound(string $uri, array $addressBooks): void {
		$this->contactsManager->expects(self::once())
			->method('getUserAddressBooks')
			->willReturn($addressBooks);

		$actual = $this->controller->import(42, $uri);
		$this->assertEquals('Address book not found', $actual->getData());
		$this->assertEquals(404, $actual->getStatus());
	}

	public function testImportWithAddressBookNotFoundWithDefaultAddressBook(): void {
		$addressBook1 = $this->createMock(ICreateContactFromString::class);
		$addressBook1->method('getUri')
			->willReturn('shared-ro');
		$addressBook1->method('isShared')
			->willReturn(true);
		$addressBook1->method('getPermissions')
			->willReturn(Constants::PERMISSION_READ);
		$addressBook2 = $this->createMock(ICreateContactFromString::class);
		$addressBook2->method('getUri')
			->willReturn('shared-rw');
		$addressBook2->method('isShared')
			->willReturn(true);
		$addressBook2->method('getPermissions')
			->willReturn(Constants::PERMISSION_CREATE);
		$addressBook3 = $this->createMock(ICreateContactFromString::class);
		$addressBook3->method('getUri')
			->willReturn('owned-ro');
		$addressBook3->method('isShared')
			->willReturn(false);
		$addressBook3->method('getPermissions')
			->willReturn(Constants::PERMISSION_READ);
		$this->contactsManager->expects(self::once())
			->method('getUserAddressBooks')
			->willReturn([
				$addressBook1,
				$addressBook2,
				$addressBook3,
			]);

		$actual = $this->controller->import(42);
		$this->assertEquals('Address book not found', $actual->getData());
		$this->assertEquals(404, $actual->getStatus());
	}

	public function testImportWithFileNotFound(): void {
		$addressBook1 = $this->createMock(ICreateContactFromString::class);
		$addressBook1->method('getUri')
			->willReturn('contacts');
		$addressBook2 = $this->createMock(ICreateContactFromString::class);
		$addressBook2->method('getUri')
			->willReturn('foo');
		$this->contactsManager->expects(self::once())
			->method('getUserAddressBooks')
			->willReturn([
				$addressBook1,
				$addressBook2,
			]);

		$userFolder = $this->createMock(Folder::class);
		$userFolder->expects(self::once())
			->method('getFirstNodeById')
			->with(42)
			->willReturn(null);
		$this->rootFolder->expects(self::once())
			->method('getUserFolder')
			->with(self::USER_ID)
			->willReturn($userFolder);

		$addressBook1->expects(self::never())
			->method('createFromString');
		$addressBook2->expects(self::never())
			->method('createFromString');

		$actual = $this->controller->import(42);
		$this->assertEquals('File not found', $actual->getData());
		$this->assertEquals(404, $actual->getStatus());
	}

	public function testImportWithNotAFile(): void {
		$addressBook1 = $this->createMock(ICreateContactFromString::class);
		$addressBook1->method('getUri')
			->willReturn('contacts');
		$addressBook2 = $this->createMock(ICreateContactFromString::class);
		$addressBook2->method('getUri')
			->willReturn('foo');
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
			->with(self::USER_ID)
			->willReturn($userFolder);

		$addressBook1->expects(self::never())
			->method('createFromString');
		$addressBook2->expects(self::never())
			->method('createFromString');

		$actual = $this->controller->import(42);
		$this->assertEquals('Not a file', $actual->getData());
		$this->assertEquals(400, $actual->getStatus());
	}

	public function testImportWithInvalidFileType(): void {
		$addressBook1 = $this->createMock(ICreateContactFromString::class);
		$addressBook1->method('getUri')
			->willReturn('contacts');
		$addressBook2 = $this->createMock(ICreateContactFromString::class);
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
			->with(self::USER_ID)
			->willReturn($userFolder);

		$addressBook1->expects(self::never())
			->method('createFromString');
		$addressBook2->expects(self::never())
			->method('createFromString');

		$actual = $this->controller->import(42);
		$this->assertEqualsCanonicalizing('Not a vCard file', $actual->getData());
		$this->assertEquals(400, $actual->getStatus());
	}

	private function mockL10n(): void {
		$this->l10n->method('n')
			->willReturnCallback(function (string $singular, string $plural, int $count) {
				if ($count === 1) {
					return $singular;
				}

				return $plural;
			});
	}
}
