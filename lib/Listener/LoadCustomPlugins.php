<?php

declare(strict_types=1);

/**
 * @copyright Copyright (c) 2021, Thomas Citharel <nextcloud@tcit.fr>
 *
 * @author Thomas Citharel <nextcloud@tcit.fr>
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

namespace OCA\Contacts\Listener;

use OCA\Contacts\Dav\PatchPlugin;
use OCA\DAV\Events\SabreAddPluginEvent;
use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;

class LoadCustomPlugins implements IEventListener {
	/** @var PatchPlugin */
	private $patchPlugin;

	public function __construct(PatchPlugin $patchPlugin) {
		$this->patchPlugin = $patchPlugin;
	}

	public function handle(Event $event): void {
		if (!($event instanceof SabreAddPluginEvent)) {
			return;
		}

		if ($event->getServer() === null) {
			return;
		}

		// We have to register the PatchPlugin here and not info.xml,
		// because info.xml plugins are loaded, after the
		// beforeMethod:* hook has already been emitted.
		$event->getServer()->addPlugin($this->patchPlugin);
	}
}
