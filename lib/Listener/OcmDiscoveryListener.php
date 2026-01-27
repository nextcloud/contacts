<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
namespace OCA\Contacts\Listener;

use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;
use OCP\OCM\Events\LocalOCMDiscoveryEvent;

/** @template-implements IEventListener<LocalOCMDiscoveryEvent> */
class OcmDiscoveryListener implements IEventListener {

    public function __construct() {}

	/**
	 * This handler will register the capability: invite-accepted
	 *
	 * @param Event $event an event of type LocalOCMDiscoveryEvent
	 * @return void
	 */
	public function handle(Event $event): void {
        if($event instanceof LocalOCMDiscoveryEvent) {
            $event->addCapability('invite-accepted');
        }
    }

}