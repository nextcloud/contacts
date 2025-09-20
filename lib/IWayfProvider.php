<?php

namespace OCA\Contacts;

/**
 * Interface IWayfProvider.
 *
 */
interface IWayfProvider {

	// The default wayf page route.
	public const WAYF_ROUTE = '/wayf';
	public const DISCOVERY_ROUTE = '/discover';

	/**
	 * Returns all mesh providers.
	 *
	 * @return array an array containing all mesh providers
	 */
	public function getMeshProviders(): array;

	/**
	 * Returns the WAYF (Where Are You From) login page endpoint to be used in the invitation link.
	 * Can be read from the app config key 'wayf_endpoint'.
	 * If not set the endpoint the WAYF page implementation of this app is returned.
	 * Note that the invitation link still needs the token and provider parameters, eg. "https://<wayf-page-endpoint>?token=$token&provider=$provider"
	 * @return string the WAYF login page endpoint
	 */
	public function getWayfEndpoint(): string;

}
