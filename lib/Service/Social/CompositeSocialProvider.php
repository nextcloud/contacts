<?php
/**
 * @copyright 2020 Matthias Heinisch <nextcloud@matthiasheinisch.de>
 *
 * @author Matthias Heinisch <nextcloud@matthiasheinisch.de>
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
