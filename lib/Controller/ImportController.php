<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Controller;

use OCA\Contacts\AppInfo\Application;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\Attribute\ApiRoute;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\OCSController;
use OCP\Contacts\IManager as IContactsManager;
use OCP\Files\File;
use OCP\Files\IRootFolder;
use OCP\ICreateContactFromString;
use OCP\IRequest;
use OCP\IUserSession;
use OCP\Security\ISecureRandom;

class ImportController extends OCSController {
	private const UID_PREFIX = 'UID:';

	public function __construct(
		IRequest $request,
		private readonly IUserSession $userSession,
		private readonly IContactsManager $contactsManager,
		private readonly IRootFolder $rootFolder,
		private readonly ISecureRandom $random,
	) {
		parent::__construct(Application::APP_ID, $request);
	}

	/**
	 * Import the given vCard file (by id) into the given address book of the current user.
	 * Exactly one of $addressBookKey or $addressBookUri is expected.
	 *
	 * @param int $fileId The id of a vCard file to import
	 * @param ?string $addressBookKey The key or id of the address book - {@see \OCP\IAddressBook::getKey}
	 * @param ?string $addressBookUri The uri of the address book - {@see \OCP\IAddressBook::getUri}
	 * @return DataResponse
	 *
	 * 200: Contacts were imported successfully
	 * 400: Not a vCard file or given both $addressBookKey and $addressBookUri
	 * 401: User is not logged in
	 * 404: File or address book was not found
	 */
	#[NoAdminRequired]
	#[ApiRoute('POST', '/api/v1/import')]
	public function import(
		int $fileId,
		?string $addressBookKey = null,
		?string $addressBookUri = null,
	): DataResponse {
		if (empty($addressBookKey) === empty($addressBookUri)) {
			return new DataResponse(
				'Expected one of addressBookKey or addressBookUri',
				Http::STATUS_BAD_REQUEST,
			);
		}

		$user = $this->userSession->getUser();
		if ($user === null) {
			return new DataResponse('Not logged in', Http::STATUS_UNAUTHORIZED);
		}

		$addressBook = $this->findUserAddressBook($addressBookKey, $addressBookUri);
		if ($addressBook === null) {
			return new DataResponse('Address book not found', Http::STATUS_NOT_FOUND);
		}

		$userRoot = $this->rootFolder->getUserFolder($user->getUID());
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

		$contacts = [];
		$currentContact = null;

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
				$contacts[] = implode("\n", $currentContact);
				$currentContact = null;
				continue;
			}

			if ($currentContact === null) {
				continue;
			}

			$currentContact[] = $line;
		}

		$imported = [];
		foreach ($contacts as $contact) {
			$uid = $this->random->generate(
				32,
				'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
			);
			$name = "$uid.vcf";
			try {
				$addressBook->createFromString($name, $contact);
			} catch (\Exception $e) {
				continue;
			}

			$imported[] = $name;
		}

		return new DataResponse([
			'importedContactUris' => $imported,
		]);
	}

	private function findUserAddressBook(?string $key, ?string $uri): ?ICreateContactFromString {
		$addressBooks = $this->contactsManager->getUserAddressBooks();
		foreach ($addressBooks as $addressBook) {
			if (!($addressBook instanceof ICreateContactFromString)) {
				continue;
			}

			if ($addressBook->getKey() === $key || $addressBook->getUri() === $uri) {
				return $addressBook;
			}
		}

		return null;
	}
}
