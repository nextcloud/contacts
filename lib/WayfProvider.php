<?php

/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts;

use Exception;
use OCA\Contacts\AppInfo\Application;
use OCP\AppFramework\Http;
use OCP\Http\Client\IClientService;
use OCP\IAppConfig;
use OCP\IURLGenerator;
use OCP\OCM\IOCMDiscoveryService;
use Psr\Log\LoggerInterface;

/**
 * Class WayfProvider.
 * Provides a basic WAYF (Where Are You From) login implementation build from the list of available mesh providers.
 *
 */
class WayfProvider {

	public function __construct(
		private IAppConfig $appConfig,
		private IClientService $httpClient,
		private LoggerInterface $logger,
		private IOCMDiscoveryService $discovery,
		private IURLGenerator $urlGenerator,
	) {
	}

	/**
	 * Returns all providers from the mesh Directory Service.
	 *
	 * @see https://datatracker.ietf.org/doc/html/draft-ietf-ocm-open-cloud-mesh-04#name-appendix-c-directory-servic
	 *
	 * @return array an array containing all mesh providers
	 */
	public function getMeshProviders(): array {
		$urls = preg_split('/\s+/', trim($this->appConfig->getValueString(Application::APP_ID, ConfigLexicon::MESH_PROVIDERS_SERVICE)));
		$federations = [];
		$ourServerUrlParts = parse_url($this->urlGenerator->getAbsoluteUrl('/'));
		$ourFqdn = is_array($ourServerUrlParts) && isset($ourServerUrlParts['host']) ? (string)$ourServerUrlParts['host'] : '';

		$found = [];
		foreach ($urls as $url) {
			if ($url === '') {
				continue;
			}
			try {
				$res = $this->httpClient->newClient()->get($url);
				$code = $res->getStatusCode();
				if (!($code >= Http::STATUS_OK && $code < Http::STATUS_BAD_REQUEST)) {
					continue;
				}
				$data = json_decode($res->getBody(), true);
				$fed = $data['federation'] ?? 'Unknown';
				$federations[$fed] = $federations[$fed] ?? [];

				$servers = is_array($data['servers'] ?? null) ? $data['servers'] : [];
				foreach ($servers as $prov) {
					$providerUrl = is_array($prov) && isset($prov['url']) ? (string)$prov['url'] : '';
					if ($providerUrl === '') {
						continue;
					}
					$fqdn = parse_url($providerUrl, PHP_URL_HOST);
					if (!is_string($fqdn) || $fqdn === '') {
						continue;
					}
					if (($ourFqdn !== '' && $ourFqdn === $fqdn) || in_array($fqdn, $found, true)) {
						continue;
					}
					try {
						$disc = $this->discovery->discover($providerUrl, true);
						$inviteAcceptDialog = $disc->getInviteAcceptDialog();
					} catch (Exception $e) {
						$this->logger->error('Discovery failed for ' . $providerUrl . ': ' . $e->getMessage(), ['app' => Application::APP_ID]);
						continue;
					}
					if ($inviteAcceptDialog === '') {
						// We fall back on Nextcloud default path
						$inviteAcceptDialogPath = self::getInviteAcceptDialogPath();
						$inviteAcceptDialog = rtrim($providerUrl, '/') . $inviteAcceptDialogPath;
					}
					$federations[$fed][] = [
						'provider' => $disc->getProvider(),
						'name' => (string)($prov['displayName'] ?? $fqdn),
						'fqdn' => $fqdn,
						'inviteAcceptDialog' => $inviteAcceptDialog,
					];
					array_push($found, $fqdn);
				}
				usort($federations[$fed], fn ($a, $b) => strcmp($a['name'], $b['name']));
			} catch (Exception $e) {
				$this->logger->error('Fetch failed for ' . $url . ': ' . $e->getMessage(), ['app' => Application::APP_ID]);
			}
		}
		return $federations;
	}

	/**
	 * Returns all mesh providers from cache if possible.
	 *
	 * @return array an array containing all mesh providers
	 */
	public function getMeshProvidersFromCache(): array {
		$data = $this->appConfig->getValueArray(Application::APP_ID, ConfigLexicon::FEDERATIONS_CACHE, [], true);
		$expires = is_array($data) && array_key_exists('expires', $data) ? (int)$data['expires'] : 0;
		if (is_array($data) && $expires > time()) {
			$this->logger->debug('Cache hit, expires at: ' . $expires, ['app' => Application::APP_ID]);
			unset($data['expires']);
			return $data;
		}

		$this->logger->debug('Cache miss or expired: cron job should update providers.', ['app' => Application::APP_ID]);
		return $this->getMeshProviders();
	}

	/**
	 * Returns the WAYF (Where Are You From) login page endpoint to be used in the invitation link.
	 * Can be read from the app config key in ConfigLexicon::WAYF_ENDPOINT.
	 * If not set the endpoint the WAYF page implementation of this app is returned.
	 * Note that the invitation link still needs the token and provider parameters, eg. "https://<wayf-page-endpoint>?token=$token&provider=$provider"
	 *
	 * Security: the value of ConfigLexicon::WAYF_ENDPOINT is used as the base of every
	 * outgoing invitation URL. It is administrator-only configuration and
	 * must point to a trusted WAYF page that the recipient can safely visit.
	 * Setting it to an attacker-controlled origin would let invite links
	 * leak the token and provider query parameters to a third party.
	 *
	 * @return string|null the WAYF login page endpoint or null if it could not be created
	 */
	public function getWayfEndpoint(): ?string {
		// default wayf endpoint
		$defaultWayfEndpoint = $this->urlGenerator->linkToRouteAbsolute(Application::APP_ID . '.federatedinvites.wayf');
		$configuredEndpoint = trim($this->appConfig->getValueString(Application::APP_ID, ConfigLexicon::WAYF_ENDPOINT));
		return $configuredEndpoint === '' ? $defaultWayfEndpoint : $configuredEndpoint;
	}

	/**
	 * Returns the path of the invite accept dialog route.
	 *
	 * @return string
	 */
	public function getInviteAcceptDialogPath(): string {
		return $this->urlGenerator->linkToRoute(Application::APP_ID . '.federatedinvites.inviteacceptdialog');
	}
}
