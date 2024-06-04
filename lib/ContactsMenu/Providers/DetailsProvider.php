<?php

/**
 * SPDX-FileCopyrightText: 2017 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\ContactsMenu\Providers;

use OCP\Contacts\ContactsMenu\IActionFactory;
use OCP\Contacts\ContactsMenu\IEntry;
use OCP\Contacts\ContactsMenu\IProvider;
use OCP\Contacts\IManager;
use OCP\IL10N;
use OCP\IURLGenerator;

class DetailsProvider implements IProvider {
	/** @var IURLGenerator */
	private $urlGenerator;

	/** @var IActionFactory */
	private $actionFactory;

	/** @var IL10N */
	private $l10n;

	/** @var IManager */
	private $manager;

	/**
	 * @param IURLGenerator $urlGenerator
	 * @param IActionFactory $actionFactory
	 */
	public function __construct(IURLGenerator $urlGenerator,
		IActionFactory $actionFactory,
		IL10N $l10n,
		IManager $manager) {
		$this->actionFactory = $actionFactory;
		$this->urlGenerator = $urlGenerator;
		$this->l10n = $l10n;
		$this->manager = $manager;
	}

	/**
	 * Return a list of the user's addressbooks unique uris
	 *
	 * @return array
	 * @since 16.0.0
	 */
	protected function getAddressBooksUris(): array {
		$result = [];
		foreach ($this->manager->getUserAddressbooks() as $addressBook) {
			$result[$addressBook->getKey()] = $addressBook->getUri();
		}

		return $result;
	}

	/**
	 * Get (and load when needed) the address book URI for $key
	 *
	 * @param string $addressBookKey
	 * @return string
	 */
	protected function getAddressBookUri($addressBookKey) {
		$addressBooks = $this->getAddressBooksUris();
		if (!array_key_exists($addressBookKey, $addressBooks)) {
			return null;
		}

		return $addressBooks[$addressBookKey];
	}

	/**
	 * @param IEntry $entry
	 */
	public function process(IEntry $entry) {
		$uid = $entry->getProperty('UID');

		if (is_null($uid)) {
			// Nothing to do
			return;
		}

		if ($entry->getProperty('isLocalSystemBook') === true) {
			// Cannot show details -> ignore
			return;
		}

		$addressBookUri = $this->getAddressBookUri($entry->getProperty('addressbook-key'));

		$iconUrl = $this->urlGenerator->getAbsoluteURL($this->urlGenerator->imagePath('core', 'actions/info.svg'));

		$contactsUrl = $this->urlGenerator->getAbsoluteURL(
			$this->urlGenerator->linkToRoute('contacts.contacts.direct', [
				'contact' => $uid . '~' . $addressBookUri
			])
		);

		$action = $this->actionFactory->newLinkAction($iconUrl, $this->l10n->t('Details'), $contactsUrl);
		$action->setPriority(0);
		$entry->addAction($action);
	}
}
