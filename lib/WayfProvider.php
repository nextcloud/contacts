<?php

namespace OCA\Contacts;

use Exception;
use OCA\Contacts\AppInfo\Application;
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
	 * Returns all mesh providers.
	 *
	 * @return array an array containing all mesh providers
	 */
	public function getMeshProviders(): array {
		$urls = preg_split('/\s+/', trim($this->appConfig->getValueString(Application::APP_ID, 'mesh_providers_service')));
		$federations = [];

		$found = [];
		foreach ($urls as $url) {
			if ($url === '') {
				continue;
			}
			try {
				$res = $this->httpClient->newClient()->get($url);
				$code = $res->getStatusCode();
				if (!($code >= 200 && $code < 400)) {
					continue;
				}
				$data = json_decode($res->getBody(), true);
				$fed = $data['federation'] ?? 'Unknown';
				$federations[$fed] = $federations[$fed] ?? [];

				foreach ($data['servers'] as $prov) {
					$fqdn = parse_url($prov['url'], PHP_URL_HOST);
					$our_fqdn = parse_url($this->urlGenerator->getAbsoluteUrl('/'))['host'];
					if (($our_fqdn == $fqdn) || in_array($fqdn, $found)) {
						continue;
					}
					try {
						$disc = $this->discovery->discover($prov['url'], true);
						$inviteAcceptDialog = $disc->getInviteAcceptDialog();
					} catch (Exception $e) {
						$this->logger->error('Discovery failed for ' . $prov['url'] . ': ' . $e->getMessage(), ['app' => Application::APP_ID]);
						continue;
					}
					if ($inviteAcceptDialog === '') {
						// We fall back on Nextcloud default path
						$inviteAcceptDialogPath = self::getInviteAcceptDialogPath();
						$inviteAcceptDialog = rtrim($prov['url'], '/') . $inviteAcceptDialogPath;
					}
					$federations[$fed][] = [
						'provider' => $disc->getProvider(),
						'name' => $prov['displayName'],
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
		$data = $this->appConfig->getValueArray(Application::APP_ID, 'federations_cache', [], true);
		if (isset($data) && array_key_exists('expires', $data)) {
			$this->logger->debug('Cache hit, expires at: ' . $data['expires'], ['app' => Application::APP_ID]);
			unset($data['expires']);
		} else {
			$this->logger->debug('Cache miss: cron job should update providers.', ['app' => Application::APP_ID]);
			$data = $this->getMeshProviders();
		}
		return $data;
	}

	/**
	 * Returns the WAYF (Where Are You From) login page endpoint to be used in the invitation link.
	 * Can be read from the app config key 'wayf_endpoint'.
	 * If not set the endpoint the WAYF page implementation of this app is returned.
	 * Note that the invitation link still needs the token and provider parameters, eg. "https://<wayf-page-endpoint>?token=$token&provider=$provider"
	 * @return string|null the WAYF login page endpoint or null if it could not be created
	 */
	public function getWayfEndpoint(): ?string {
		// default wayf endpoint
		$defaultWayfEndpoint = $this->urlGenerator->linkToRouteAbsolute(Application::APP_ID . '.federated_invites.wayf');
		return $this->appConfig->getValueString(Application::APP_ID, 'wayf_endpoint', $defaultWayfEndpoint);
	}

	/**
	 * Returns the path of the invite accept dialog route.
	 *
	 * @return string
	 */
	public function getInviteAcceptDialogPath(): string {
		return $this->urlGenerator->linkToRoute(Application::APP_ID . '.federated_invites.invite_accept_dialog');
	}
}
