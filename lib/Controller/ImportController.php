<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Controller;

use OCA\Contacts\AppInfo\Application;
use OCA\DAV\CardDAV\CardDavBackend;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\Attribute\ApiRoute;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\OCSController;
use OCP\Constants;
use OCP\Contacts\IManager as IContactsManager;
use OCP\Files\File;
use OCP\Files\IRootFolder;
use OCP\IAddressBook;
use OCP\ICreateContactFromString;
use OCP\IL10N;
use OCP\IRequest;
use OCP\L10N\IFactory as IL10nFactory;
use OCP\Security\ISecureRandom;
use Psr\Log\LoggerInterface;

class ImportController extends OCSController {
	private const UID_PREFIX = 'UID:';

	private readonly IL10N $l10n;

	public function __construct(
		IRequest $request,
		IL10nFactory $l10nFactory,
		private readonly ?string $userId,
		private readonly IContactsManager $contactsManager,
		private readonly IRootFolder $rootFolder,
		private readonly ISecureRandom $random,
		private readonly LoggerInterface $logger,
	) {
		parent::__construct(Application::APP_ID, $request);

		$this->l10n = $l10nFactory->get(Application::APP_ID);
	}

	/**
	 * Import the given vCard file (by id) into the given address book of the current user.
	 * If no address book URI is posted as a payload, an attempt will be made to determine the
	 * user's default address book.
	 *
	 * @param int $fileId The id of a vCard file to import
	 * @param ?string $addressBookUri Optional URI of the address book to import into - {@see \OCP\IAddressBook::getUri}
	 * @return DataResponse A translated string indicating the outcome of the import action.
	 *
	 * 200: Contacts were processed (check the response data for stats)
	 * 400: Not a vCard file or given both $addressBookKey and $addressBookUri
	 * 401: User is not logged in
	 * 404: File or address book was not found
	 */
	#[NoAdminRequired]
	#[ApiRoute('POST', '/api/v1/import/{fileId}')]
	public function import(int $fileId, ?string $addressBookUri = null): DataResponse {
		if ($this->userId === null) {
			return new DataResponse('Not logged in', Http::STATUS_UNAUTHORIZED);
		}

		$addressBook = $this->findUserAddressBook($addressBookUri);
		if ($addressBook === null) {
			return new DataResponse('Address book not found', Http::STATUS_NOT_FOUND);
		}

		$userRoot = $this->rootFolder->getUserFolder($this->userId);
		$file = $userRoot->getFirstNodeById($fileId);
		if ($file === null) {
			return new DataResponse('File not found', Http::STATUS_NOT_FOUND);
		}

		if (!($file instanceof File)) {
			return new DataResponse('Not a file', Http::STATUS_BAD_REQUEST);
		}

		if ($file->getMimetype() !== 'text/vcard' && $file->getExtension() !== 'vcf') {
			return new DataResponse('Not a vCard file', Http::STATUS_BAD_REQUEST);
		}

		/** @var array{uid: ?string, data: string}[] $contacts */
		$contacts = [];
		$currentContact = null;
		$currentContactUid = null;

		// The vcf file might contain multiple contacts -> split each vcard
		$vcf = $file->getContent();
		$vcfLines = explode("\n", $vcf);
		foreach ($vcfLines as $line) {
			$line = rtrim($line, "\r");

			if ($line === 'BEGIN:VCARD') {
				$currentContact = [$line];
				continue;
			}

			if ($line === 'END:VCARD') {
				$currentContact[] = $line;
				$contacts[] = [
					'uid' => $currentContactUid,
					'data' => implode("\n", $currentContact),
				];
				$currentContact = null;
				$currentContactUid = null;
				continue;
			}

			if ($currentContact === null) {
				continue;
			}

			if (str_starts_with($line, self::UID_PREFIX)) {
				$currentContactUid = substr($line, strlen(self::UID_PREFIX));
			}

			$currentContact[] = $line;
		}

		$skipped = 0;
		$errors = [];
		$imported = [];
		foreach ($contacts as $contact) {
			$uid = $contact['uid'];
			$vcf = $contact['data'];

			if ($uid !== null) {
				$existingContacts = $addressBook->search($uid, ['UID'], [
					'limit' => 1,
					'wildcard' => false,
				]);
				if (!empty($existingContacts) && $existingContacts[0]['UID'] === $uid) {
					$skipped++;
					continue;
				}
			}

			$uri = $this->random->generate(
				32,
				'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
			);
			$uri = "$uri.vcf";
			try {
				$addressBook->createFromString($uri, $vcf);
			} catch (\Exception $e) {
				$errors[] = $e->getMessage();
				$skipped++;
				continue;
			}

			$imported[] = $uri;
		}

		if (!empty($errors)) {
			$this->logger->error('Failed to import ' . count($errors) . ' contacts via OCS', [
				'errors' => $errors,
				'fileId' => $fileId,
			]);
		}

		if ($skipped === 0) {
			$message = $this->l10n->n(
				'Imported 1 contact',
				'Imported %n contacts',
				count($imported),
			);
		} else {
			$message = $this->l10n->n(
				'Imported 1 contact (skipped %d)',
				'Imported %n contacts (skipped %d)',
				count($imported),
				[$skipped],
			);
		}
		return new DataResponse($message);
	}

	private function findUserAddressBook(?string $uri): ?ICreateContactFromString {
		/** @var ICreateContactFromString[] $addressBooks */
		$addressBooks = array_filter(
			$this->contactsManager->getUserAddressBooks(),
			static fn ($addressBook) => $addressBook instanceof ICreateContactFromString,
		);

		// Try the given address book by URI first
		if ($uri !== null) {
			foreach ($addressBooks as $addressBook) {
				if ($addressBook->getUri() === $uri) {
					return $addressBook;
				}
			}

			return null;
		}

		// Try to find the user's default address book
		foreach ($addressBooks as $addressBook) {
			if ($addressBook->getUri() === CardDavBackend::PERSONAL_ADDRESSBOOK_URI) {
				return $addressBook;
			}
		}

		// Otherwise, use the first writable, owned address book
		foreach ($addressBooks as $addressBook) {
			if ($addressBook->isShared()) {
				continue;
			}

			if (($addressBook->getPermissions() & Constants::PERMISSION_CREATE) === 0) {
				continue;
			}

			return $addressBook;
		}

		return null;
	}

	/**
	 * Get a list of all available address books of the currently logged in user.
	 *
	 * @return DataResponse A list of address books with. Each one has an id and a display name.
	 *
	 * 200: List of address book options
	 * 401: User is not logged in
	 */
	#[NoAdminRequired]
	#[ApiRoute('POST', '/api/v1/address-book-options')]
	public function addressBookOptions(): DataResponse {
		if ($this->userId === null) {
			return new DataResponse('Not logged in', Http::STATUS_UNAUTHORIZED);
		}

		$addressBooks = $this->contactsManager->getUserAddressBooks();
		$options = array_map(static fn (IAddressBook $addressBook) => [
			'id' => $addressBook->getKey(),
			'displayName' => $addressBook->getDisplayName(),
		], $addressBooks);

		return new DataResponse($options);
	}
}
