<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Service;

use OCA\Contacts\AppInfo\Application;
use OCA\Contacts\Service\Social\CompositeSocialProvider;
use OCA\DAV\CardDAV\ContactsManager;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\JSONResponse;
use OCP\AppFramework\Utility\ITimeFactory;
use OCP\Contacts\IManager;
use OCP\Http\Client\IClientService;
use OCP\IAddressBook;
use OCP\IConfig;
use OCP\IL10N;
use OCP\IURLGenerator;
use Psr\Container\ContainerInterface;

class SocialApiService {
	private $appName;

	public function __construct(
		private CompositeSocialProvider $socialProvider,
		private ContainerInterface $serverContainer,
		private IManager $manager,
		private IConfig $config,
		private IClientService $clientService,
		private IL10N $l10n,
		private IURLGenerator $urlGen,
		private ITimeFactory $timeFactory,
		private ImageResizer $imageResizer,
	) {
		$this->appName = Application::APP_ID;
	}


	/**
	 * returns an array of supported social networks
	 *
	 * @return {array} array of the supported social networks
	 */
	public function getSupportedNetworks() : array {
		$syncAllowedByAdmin = $this->config->getAppValue($this->appName, 'allowSocialSync', 'yes');
		if ($syncAllowedByAdmin !== 'yes') {
			return [];
		}
		return $this->socialProvider->getSupportedNetworks();
	}


	/**
	 * Adds/updates photo for contact
	 *
	 * @param {pointer} contact reference to the contact to update
	 * @param {string} imageType the image type of the photo
	 * @param {string} photo the photo as base64 string
	 */
	protected function addPhoto(array &$contact, string $imageType, string $photo) {
		$version = $contact['VERSION'];

		if (!empty($contact['PHOTO'])) {
			// overwriting without notice!
		}

		if ($version >= 4.0) {
			// overwrite photo
			$contact['PHOTO'] = 'data:' . $imageType . ';base64,' . $photo;
		} elseif ($version >= 3.0) {
			// add new photo
			$imageType = str_replace('image/', '', $imageType);
			$contact['PHOTO;ENCODING=b;TYPE=' . $imageType . ';VALUE=BINARY'] = $photo;

			// remove previous photo (necessary as new attribute is not equal to 'PHOTO')
			unset($contact['PHOTO']);
		}
	}


	/**
	 * Gets the addressbook of an addressbookId
	 *
	 * @param {String} addressbookId the identifier of the addressbook
	 * @param {IManager} manager optional a ContactManager to use
	 *
	 * @returns {IAddressBook} the corresponding addressbook or null
	 */
	protected function getAddressBook(string $addressbookId, ?IManager $manager = null) : ?IAddressBook {
		$addressBook = null;
		if ($manager === null) {
			$manager = $this->manager;
		}
		$addressBooks = $manager->getUserAddressBooks();
		foreach ($addressBooks as $ab) {
			if ($ab->getUri() === $addressbookId) {
				$addressBook = $ab;
			}
		}
		return $addressBook;
	}


	/**
	 * Retrieves and initiates all addressbooks from a user
	 *
	 * @param {string} userId the user to query
	 * @param {IManager} the contact manager to load
	 */
	protected function registerAddressbooks($userId, IManager $manager) {
		$coma = $this->serverContainer->get(ContactsManager::class);
		$coma->setupContactsProvider($manager, $userId, $this->urlGen);
		$this->manager = $manager;
	}

	/**
	 * Retrieves social profile data for a contact and updates the entry
	 *
	 * @param {String} addressbookId the addressbook identifier
	 * @param {String} contactId the contact identifier
	 * @param {String} network the social network to use (if unkown: take first match)
	 *
	 * @returns {JSONResponse} an empty JSONResponse with respective http status code
	 */
	public function updateContact(string $addressbookId, string $contactId, ?string $network) : JSONResponse {
		$socialdata = null;
		$imageType = null;
		$urls = [];
		$allConnectors = $this->socialProvider->getSocialConnectors();

		try {
			// get corresponding addressbook
			$addressBook = $this->getAddressBook(urldecode($addressbookId));
			if (is_null($addressBook)) {
				return new JSONResponse([], Http::STATUS_BAD_REQUEST);
			}

			// search contact in that addressbook, get social data
			$contacts = $addressBook->search($contactId, ['UID'], ['types' => true]);

			if (!isset($contacts[0])) {
				return new JSONResponse([], Http::STATUS_PRECONDITION_FAILED);
			}

			$contact = $contacts[0];

			if ($network) {
				$allConnectors = [$this->socialProvider->getSocialConnector($network)];
			}

			$connectors = array_filter($allConnectors, function ($connector) use ($contact) {
				return $connector->supportsContact($contact);
			});

			if (count($connectors) == 0) {
				return new JSONResponse([], Http::STATUS_PRECONDITION_FAILED);
			}

			foreach ($connectors as $connector) {
				$urls = array_filter(array_merge($urls, $connector->getImageUrls($contact)), function ($url) {
					return filter_var($url, FILTER_VALIDATE_URL) !== false;
				});
			}

			if (count($urls) == 0) {
				return new JSONResponse([], Http::STATUS_BAD_REQUEST);
			}

			foreach ($urls as $url) {
				try {
					$httpResult = $this->clientService->newClient()->get($url);
					$socialdata = $httpResult->getBody();
					$imageType = $httpResult->getHeader('content-type');
					if (isset($socialdata) && isset($imageType)) {
						break;
					}
				} catch (\Exception $e) {
				}
			}

			if (!$socialdata || $imageType === null) {
				return new JSONResponse([], Http::STATUS_NOT_FOUND);
			}

			if (is_resource($socialdata)) {
				$socialdata = stream_get_contents($socialdata);
			}

			$socialdata = $this->imageResizer->resizeImage($socialdata);

			if (!$socialdata) {
				return new JSONResponse([], Http::STATUS_INTERNAL_SERVER_ERROR);
			}

			// update contact
			$changes = [];
			$changes['URI'] = $contact['URI'];
			$changes['VERSION'] = $contact['VERSION'];

			$this->addPhoto($changes, $imageType, base64_encode($socialdata));

			if (isset($changes['PHOTO'], $contact['PHOTO']) && $changes['PHOTO'] === $contact['PHOTO']) {
				return new JSONResponse([], Http::STATUS_NOT_MODIFIED);
			}

			$addressBook->createOrUpdate($changes, $addressbookId);
		} catch (\Exception $e) {
			return new JSONResponse([], Http::STATUS_INTERNAL_SERVER_ERROR);
		}
		return new JSONResponse([], Http::STATUS_OK);
	}

	/**
	 * checks an addressbook is existing
	 *
	 * @param {string} searchBookId the UID of the addressbook to verify
	 * @param {string} userId the user that should have access
	 *
	 * @returns {bool} true if the addressbook exists
	 */
	public function existsAddressBook(string $searchBookId, string $userId): bool {
		$manager = $this->manager;
		$coma = $this->serverContainer->get(ContactsManager::class);
		$coma->setupContactsProvider($manager, $userId, $this->urlGen);
		return $this->getAddressBook($searchBookId, $manager) !== null;
	}

	/**
	 * checks a contact exists in an addressbook
	 *
	 * @param string searchContactId the UID of the contact to verify
	 * @param string searchBookId the UID of the addressbook to look in
	 * @param string userId the user that should have access
	 *
	 * @returns bool true if the contact exists
	 */
	public function existsContact(string $searchContactId, string $searchBookId, string $userId): bool {
		// load address books for the user
		$manager = $this->manager;
		$coma = $this->serverContainer->get(ContactsManager::class);
		$coma->setupContactsProvider($manager, $userId, $this->urlGen);
		$addressBook = $this->getAddressBook($searchBookId, $manager);
		if ($addressBook == null) {
			return false;
		}

		$check = $addressBook->search($searchContactId, ['UID'], ['types' => true]);
		return !empty($check);
	}

	/**
	 * Stores the result of social avatar updates for each contact
	 * (used during batch updates in updateAddressbooks)
	 *
	 * @param {array} report where the results are added
	 * @param {String} entry the element to add
	 * @param {int} status the (http) status code
	 *
	 * @returns {array} the report including the new entry
	 */
	protected function registerUpdateResult(array $report, string $entry, int $status) : array {
		// initialize report on first call
		if (empty($report)) {
			$report = [
				'updated' => [],
				'checked' => [],
				'failed' => [],
			];
		}
		// add entry to respective sub-array
		switch ($status) {
			case Http::STATUS_OK:
				array_push($report['updated'], $entry);
				break;
			case Http::STATUS_NOT_MODIFIED:
				array_push($report['checked'], $entry);
				break;
			default:
				if (!isset($report['failed'][$status])) {
					$report['failed'][$status] = [];
				}
				array_push($report['failed'][$status], $entry);
		}
		return $report;
	}

	/**
	 * sorts an array of address books
	 *
	 * @param {IAddressBook} a
	 * @param {IAddressBook} b
	 *
	 * @returns {bool} comparison by URI
	 */
	protected function sortAddressBooks(IAddressBook $a, IAddressBook $b) {
		return strcmp($a->getURI(), $b->getURI());
	}

	/**
	 * sorts an array of contacts
	 *
	 * @param {array} a
	 * @param {array} b
	 *
	 * @returns {bool} comparison by UID
	 */
	protected function sortContacts(array $a, array $b) {
		return strcmp($a['UID'], $b['UID']);
	}

	/**
	 * Updates social profile data for all contacts of an addressbook
	 *
	 * @param {String|null} network the social network to use (take first match if unset)
	 * @param {String} userId the address book owner
	 *
	 * @returns {JSONResponse} JSONResponse with the list of changed and failed contacts
	 */
	public function updateAddressbooks(string $userId, ?string $offsetBook = null, ?string $offsetContact = null, ?string $network = null) : JSONResponse {
		// double check!
		$syncAllowedByAdmin = $this->config->getAppValue($this->appName, 'allowSocialSync', 'yes');
		$bgSyncEnabledByUser = $this->config->getUserValue($userId, $this->appName, 'enableSocialSync', 'no');
		if (($syncAllowedByAdmin !== 'yes') || ($bgSyncEnabledByUser !== 'yes')) {
			return new JSONResponse([], Http::STATUS_FORBIDDEN);
		}

		$delay = 1;
		$response = [];
		$startTime = $this->timeFactory->getTime();

		// get corresponding addressbook
		$this->registerAddressbooks($userId, $this->manager);
		$addressBooks = $this->manager->getUserAddressBooks();
		usort($addressBooks, [$this, 'sortAddressBooks']); // make sure the order stays the same in consecutive calls

		foreach ($addressBooks as $addressBook) {
			if ((is_null($addressBook) ||
				($addressBook->isShared() || $addressBook->isSystemAddressBook()))) {
				// TODO: filter out deactivated books, see https://github.com/nextcloud/server/issues/17537
				continue;
			}

			// in case this is a follow-up, jump to the last stopped address book
			if (!is_null($offsetBook)) {
				if ($addressBook->getURI() !== $offsetBook) {
					continue;
				}
				$offsetBook = null;
			}

			// get contacts in that addressbook
			$contacts = $addressBook->search('', ['X-SOCIALPROFILE'], ['types' => true]);
			usort($contacts, [$this, 'sortContacts']); // make sure the order stays the same in consecutive calls

			// update one contact after another
			foreach ($contacts as $contact) {
				// in case this is a follow-up, jump to the last stopped contact
				if (!is_null($offsetContact)) {
					if ($contact['UID'] !== $offsetContact) {
						continue;
					}
					$offsetContact = null;
				}

				try {
					$r = $this->updateContact($addressBook->getURI(), $contact['UID'], $network);
					$response = $this->registerUpdateResult($response, $contact['FN'], (int)$r->getStatus());
				} catch (\Exception $e) {
					$response = $this->registerUpdateResult($response, $contact['FN'], -1);
				}

				// stop after 15sec (to be continued with next chunk)
				if (($this->timeFactory->getTime() - $startTime) > 15) {
					$response['stoppedAt'] = [
						'addressBook' => $addressBook->getURI(),
						'contact' => $contact['UID'],
					];
					return new JSONResponse([$response], Http::STATUS_PARTIAL_CONTENT);
				}

				// delay to prevent rate limiting issues
				sleep($delay);
			}
		}
		return new JSONResponse([$response], Http::STATUS_OK);
	}
}
