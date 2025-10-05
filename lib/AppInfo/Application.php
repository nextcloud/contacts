<?php

/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
namespace OCA\Contacts\AppInfo;

use OCA\CloudFederationAPI\Events\FederatedInviteAcceptedEvent;
use OCA\Contacts\Capabilities;
use OCA\Contacts\Dav\PatchPlugin;
use OCA\Contacts\Event\LoadContactsOcaApiEvent;
use OCA\Contacts\IWayfProvider;
use OCA\Contacts\Listener\FederatedInviteAcceptedListener;
use OCA\Contacts\Listener\LoadContactsFilesActions;
use OCA\Contacts\Listener\LoadContactsOcaApi;
use OCA\Contacts\WayfProvider;
use OCA\Files\Event\LoadAdditionalScriptsEvent;
use OCP\AppFramework\App;
use OCP\AppFramework\Bootstrap\IBootContext;
use OCP\AppFramework\Bootstrap\IBootstrap;
use OCP\AppFramework\Bootstrap\IRegistrationContext;
use OCP\EventDispatcher\IEventDispatcher;
use OCP\SabrePluginEvent;

class Application extends App implements IBootstrap {
	public const APP_ID = 'contacts';

	public const AVAIL_SETTINGS = [
		'allowSocialSync' => 'yes',
	];

	public function __construct() {
		parent::__construct(self::APP_ID);
	}

	#[\Override]
	public function register(IRegistrationContext $context): void {
		$context->registerCapability(Capabilities::class);
		$context->registerServiceAlias(IWayfProvider::class, WayfProvider::class);

		$context->registerEventListener(LoadAdditionalScriptsEvent::class, LoadContactsFilesActions::class);
		$context->registerEventListener(LoadContactsOcaApiEvent::class, LoadContactsOcaApi::class);
		$context->registerEventListener(FederatedInviteAcceptedEvent::class, FederatedInviteAcceptedListener::class);
	}

	#[\Override]
	public function boot(IBootContext $context): void {
		$appContainer = $context->getAppContainer();
		$serverContainer = $context->getServerContainer();

		/** @var IEventDispatcher $eventDispatcher */
		$eventDispatcher = $serverContainer->get(IEventDispatcher::class);
		$eventDispatcher->addListener('OCA\DAV\Connector\Sabre::addPlugin', static function (SabrePluginEvent $event) use ($appContainer) {
			if ($event->getServer() === null) {
				return;
			}

			// We have to register the PatchPlugin here and not info.xml,
			// because info.xml plugins are loaded, after the
			// beforeMethod:* hook has already been emitted.
			$event->getServer()->addPlugin($appContainer->get(PatchPlugin::class));
		});
	}
}
