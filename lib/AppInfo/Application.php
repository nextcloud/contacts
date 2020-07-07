<?php
/**
 * @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
 *
 * @author John Molakvoæ <skjnldsv@protonmail.com>
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
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */
namespace OCA\Contacts\AppInfo;

use OCA\Contacts\Dav\PatchPlugin;
use OCA\Contacts\Listener\LoadContactsFilesActions;
use OCA\Files\Event\LoadAdditionalScriptsEvent;
use OCP\AppFramework\App;
use OCP\EventDispatcher\IEventDispatcher;
use OCP\IL10N;
use OCP\INavigationManager;
use OCP\IURLGenerator;
use OCP\SabrePluginEvent;

class Application extends App {

	const APP_ID = 'contacts';

	public function __construct() {
		parent::__construct(self::APP_ID);
	}

	public function register() {
		$server = $this->getContainer()->getServer();

		/** @var INavigationManager $navigationManager */
		$navigationManager = $server->query(INavigationManager::class);

		/** @var IURLGenerator $urlGenerator */
		$urlGenerator = $server->query(IURLGenerator::class);

		/** @var IEventDispatcher $eventDispatcher */
		$eventDispatcher = $server->query(IEventDispatcher::class);
		$eventDispatcher->addListener('OCA\DAV\Connector\Sabre::addPlugin', function (SabrePluginEvent $event) {
			$server = $event->getServer();

			if ($server !== null) {
				// We have to register the LockPlugin here and not info.xml,
				// because info.xml plugins are loaded, after the
				// beforeMethod:* hook has already been emitted.
				$server->addPlugin($this->getContainer()->query(PatchPlugin::class));
			}
		});

		// Register files action
		$eventDispatcher->addServiceListener(LoadAdditionalScriptsEvent::class, LoadContactsFilesActions::class);

		/** @var IL10N $l10n */
		$l10n = $server->getL10N(self::APP_ID);

		$navigationManager->add([
			// the string under which your app will be referenced in Nextcloud
			'id' => self::APP_ID,
	
			// sorting weight for the navigation. The higher the number, the higher
			// will it be listed in the navigation
			'order' => 4,
	
			// the route that will be shown on startup
			'href' => $urlGenerator->linkToRoute('contacts.page.index'),
	
			// the icon that will be shown in the navigation
			// this file needs to exist in img/
			'icon' => $urlGenerator->imagePath(self::APP_ID, 'app.svg'),
	
			// the title of your application. This will be used in the
			// navigation or on the settings page of your app
			'name' => $l10n->t('Contacts'),
		]);

	}
}
