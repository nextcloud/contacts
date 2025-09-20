<?php

namespace OCA\Contacts;

use Exception;
use OCA\Contacts\AppInfo\Application;
use OCA\Contacts\Service\FederatedInvitesService;
use OCP\Http\Client\IClientService;
use OCP\IAppConfig;
use OCP\OCM\IOCMDiscoveryService;
use Psr\Log\LoggerInterface;

/**
 * Class WayfProvider.
 * Provides a basic WAYF (Where Are You From) login implementation build from the list of available mesh providers.
 *
 */
class WayfProvider implements IWayfProvider {

	public function __construct(
		private IAppConfig $appConfig,
		private IClientService $httpClient,
		private FederatedInvitesService $federatedInvitesService,
		private LoggerInterface $logger,
		private IOCMDiscoveryService $discovery,
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
				$data = json_decode($this->httpClient->newClient()->get($url)->getBody(), true);
				$fed = $data['federation'] ?? 'Unknown';
				$federations[$fed] = $federations[$fed] ?? [];

				foreach ($data['servers'] as $prov) {
					$fqdn = parse_url($prov['url'], PHP_URL_HOST);
					if (in_array($fqdn, $found)) {
						continue;
					}
					$disc = $this->discovery->discover($prov['url'], true);
					$inviteAcceptDialog = $disc->getInviteAcceptDialog();
					if ($inviteAcceptDialog === '') {
						$inviteAcceptDialog = $prov['url'] . '/apps/contacts/ocm/invite-accept-dialog';
						$res = $this->httpClient->newClient()->head($inviteAcceptDialog, [
							'timeout' => 1,
							'connect_timeout' => 1,
							'allow_redirects' => true,
							'headers' => ['Accept' => 'text/html,application/json'],
						]);
						$code = $res->getStatusCode();
						if (!($code >= 200 && $code < 400)) {
							continue;
						}
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
				$this->logger->error('Fetch/discovery failed for ' . $url . ': ' . $e->getMessage(), ['app' => Application::APP_ID]);
			}
		}
		return $federations;
	}

	/**
	 * Returns the WAYF (Where Are You From) login page endpoint to be used in the invitation link.
	 * Can be read from the app config key 'wayf_endpoint'.
	 * If not set the endpoint the WAYF page implementation of this app is returned.
	 * Note that the invitation link still needs the token and provider parameters, eg. "https://<wayf-page-endpoint>?token=$token&provider=$provider"
	 * @return string the WAYF login page endpoint
	 */
	public function getWayfEndpoint(): string {
		$wayfEndpoint = 'https://' . $this->federatedInvitesService->getProviderFQDN() . '/apps/' . Application::APP_ID . self::WAYF_ROUTE;
		return $this->appConfig->getValueString(Application::APP_ID, 'wayf_endpoint', $wayfEndpoint);
	}
}
