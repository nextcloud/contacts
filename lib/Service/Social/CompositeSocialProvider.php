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
					FacebookProvider $facebookProvider,
					TwitterProvider $twitterProvider,
					TumblrProvider $tumblrProvider) {

		// This determines the priority of known providers
		$this->providers = [
			'instagram' 	=> $instagramProvider,
			'mastodon' 	=> $mastodonProvider,
			'twitter' 	=> $twitterProvider,
			'facebook'	=> $facebookProvider,
			'tumblr'	=> $tumblrProvider,
		];
	}

	/**
	 * returns an array of supported social providers
	 *
	 * @returns {array} array of the supported social networks
	 */
	public function getSupportedNetworks() : array {
		return array_keys($this->providers);
	}


	/**
	 * generate download url for a social entry
	 *
	 * @param {array} socialEntries all social data from the contact
	 * @param {String} network the choice which network to use (fallback: take first available)
	 *
	 * @returns {String} the url to the requested information or null in case of errors
	 */
	public function getSocialConnector(array $socialEntries, string $network) : ?string {

		$connector = null;
		$selection = $this->providers;
		// check if dedicated network selected
		if (isset($this->providers[$network])) {
			$selection = array($network => $this->providers[$network]);
		}

		// check selected providers in order
		foreach($selection as $type => $socialProvider) {

			// search for this network in user's profile
			foreach ($socialEntries as $socialEntry) {

				if (strtolower($type) === strtolower($socialEntry['type'])) {
					$profileId = $socialProvider->cleanupId($socialEntry['value']);
					if (!is_null($profileId)) {
						$connector = $socialProvider->getImageUrl($profileId);
					}
					break;
				}
			}
			if ($connector) {
				break;
			}
		}
		return ($connector);
	}
}
