<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
namespace OCA\Contacts\Listener;

use OC\Core\AppInfo\ConfigLexicon;
use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;
use OCP\IAppConfig;
use OCP\IURLGenerator;
use OCP\OCM\Events\LocalOCMDiscoveryEvent;

/** @template-implements IEventListener<LocalOCMDiscoveryEvent> */
class OcmDiscoveryListener implements IEventListener {

	public function __construct(
		private IAppConfig $appConfig,
		private IURLGenerator $urlGenerator,
	) {
	}

	/**
	 * This handler will register the capability invite-accepted
	 * and set the invite accept dialog url.
	 *
	 * @param Event $event an event of type LocalOCMDiscoveryEvent
	 * @return void
	 */
	public function handle(Event $event): void {
		if ($event instanceof LocalOCMDiscoveryEvent) {
			$event->addCapability('invite-accepted');
			$inviteAcceptDialog = $this->appConfig->getValueString('core', ConfigLexicon::OCM_INVITE_ACCEPT_DIALOG);
			if ($inviteAcceptDialog !== '') {
				$event->getProvider()->setInviteAcceptDialog($this->urlGenerator->linkToRouteAbsolute($inviteAcceptDialog));
			}
		}
	}
}
