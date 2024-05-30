<?php
/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Service\Social;

/**
 * Composition of all social providers for easier usage
 */
class CompositeSocialProvider {
	/** @var ISocialProvider[] */
	private $providers;

	public function __construct(InstagramProvider $instagramProvider,
		MastodonProvider $mastodonProvider,
		// FacebookProvider $facebookProvider,
		TumblrProvider $tumblrProvider,
		DiasporaProvider $diasporaProvider,
		XingProvider $xingProvider,
		TelegramProvider $telegramProvider,
		GravatarProvider $gravatarProvider) {
		// This determines the priority of known providers
		$this->providers = [
			$instagramProvider->name => $instagramProvider,
			$mastodonProvider->name => $mastodonProvider,
			// $facebookProvider->name => $facebookProvider,
			$tumblrProvider->name => $tumblrProvider,
			$diasporaProvider->name => $diasporaProvider,
			$xingProvider->name => $xingProvider,
			$telegramProvider->name => $telegramProvider,
			$gravatarProvider->name => $gravatarProvider
		];
	}

	/**
	 * returns an array of supported social providers
	 *
	 * @returns String[] array of the supported social networks
	 */
	public function getSupportedNetworks() : array {
		return array_keys($this->providers);
	}

	/**
	 * generate download url for a social entry
	 *
	 * @param String network the choice which network to use
	 *
	 * @return ISocialProvider if provider of 'network' is found, otherwise null
	 */
	public function getSocialConnector(string $network) : ?ISocialProvider {
		$connector = null;
		// check if dedicated network selected
		if (isset($this->providers[$network])) {
			$connector = $this->providers[$network];
		}
		return $connector;
	}

	/**
	 * generate download url for a social entry
	 *
	 * @return ISocialProvider[] all social providers
	 */
	public function getSocialConnectors() : array {
		return array_values($this->providers);
	}
}
