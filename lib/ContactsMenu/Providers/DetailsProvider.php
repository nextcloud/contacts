<?php

/**
 * @copyright 2017 Christoph Wurst <christoph@winzerhof-wurst.at>
 *
 * @author 2017 Christoph Wurst <christoph@winzerhof-wurst.at>
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

namespace OCA\Contacts\ContactsMenu\Providers;

use OCP\Contacts\ContactsMenu\IActionFactory;
use OCP\Contacts\ContactsMenu\IEntry;
use OCP\Contacts\ContactsMenu\IProvider;
use OCP\IL10N;
use OCP\IURLGenerator;

class DetailsProvider implements IProvider {

	/** @var IURLGenerator */
	private $urlGenerator;

	/** @var IActionFactory */
	private $actionFactory;

	/** @var IL10N */
	private $l10n;

	/**
	 * @param IURLGenerator $urlGenerator
	 * @param IActionFactory $actionFactory
	 */
	public function __construct(IURLGenerator $urlGenerator, IActionFactory $actionFactory, IL10N $l10n) {
		$this->actionFactory = $actionFactory;
		$this->urlGenerator = $urlGenerator;
		$this->l10n = $l10n;
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

		$iconUrl = $this->urlGenerator->getAbsoluteURL($this->urlGenerator->imagePath('core', 'actions/info.svg'));
		$contactsUrl = $this->urlGenerator->getAbsoluteURL('/index.php/apps/contacts#/contact/' . $uid);
		$action = $this->actionFactory->newLinkAction($iconUrl, $this->l10n->t('Details'), $contactsUrl);
		$action->setPriority(0);
		$entry->addAction($action);
	}

}
