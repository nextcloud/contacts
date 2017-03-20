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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

namespace OC\Contacts\ContactsMenu\Providers;

use OCP\Contacts\ContactsMenu\IActionFactory;
use OCP\Contacts\ContactsMenu\IEntry;
use OCP\Contacts\ContactsMenu\IProvider;
use OCP\IURLGenerator;

/**
 * @todo move to contacts app
 */
class DetailsProvider implements IProvider {

	/** @var IURLGenerator */
	private $urlGenerator;

	/** @var IActionFactory */
	private $actionFactory;

	/**
	 * @param IURLGenerator $urlGenerator
	 * @param IActionFactory $actionFactory
	 */
	public function __construct(IURLGenerator $urlGenerator, IActionFactory $actionFactory) {
		$this->actionFactory = $actionFactory;
		$this->urlGenerator = $urlGenerator;
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

		// TODO: unique contact URL to the contacts app
		// TODO: l10n
		$contactsUrl = $this->urlGenerator->getAbsoluteURL('/index.php/apps/contacts');
		$action = $this->actionFactory->newLinkAction('icon-info', 'Details', $contactsUrl);
		$action->setPriority(0);
		$entry->addAction($action);
	}

}
