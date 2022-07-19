<?php

declare(strict_types=1);

/**
 * @copyright Copyright (c) 2020 John Molakvoæ <skjnldsv@protonmail.com>
 *
 * @author John Molakvoæ (skjnldsv) <skjnldsv@protonmail.com>
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
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */

namespace OCA\Contacts\Dav;

use Sabre\CardDAV\Card;
use Sabre\DAV;
use Sabre\DAV\Server;
use Sabre\DAV\ServerPlugin;
use Sabre\HTTP\RequestInterface;
use Sabre\HTTP\ResponseInterface;
use Sabre\VObject\Reader;

class PatchPlugin extends ServerPlugin {
	public const METHOD_REPLACE = 0;
	public const METHOD_APPEND = 1;

	/** @var Server */
	protected $server;

	/**
	 * Initializes the plugin and registers event handlers
	 *
	 * @param Server $server
	 * @return void
	 */
	public function initialize(Server $server) {
		$this->server = $server;
		$server->on('method:PATCH', [$this, 'httpPatch']);
	}

	/**
	 * Use this method to tell the server this plugin defines additional
	 * HTTP methods.
	 *
	 * This method is passed a uri. It should only return HTTP methods that are
	 * available for the specified uri.
	 *
	 * We claim to support PATCH method (partirl update) if and only if
	 *     - the node exist
	 *     - the node implements our partial update interface
	 *
	 * @param string $uri
	 *
	 * @return array
	 */
	public function getHTTPMethods($uri) {
		$tree = $this->server->tree;

		if ($tree->nodeExists($uri)) {
			$node = $tree->getNodeForPath($uri);
			if ($node instanceof Card) {
				return ['PATCH'];
			}
		}

		return [];
	}

	/**
	 * Adds all CardDAV-specific properties
	 *
	 * @param RequestInterface $request
	 * @param ResponseInterface $response
	 * @return bool
	 * @throws DAV\Exception\BadRequest
	 * @throws DAV\Exception\NotAuthenticated
	 * @throws DAV\Exception\NotFound
	 * @throws \Sabre\DAVACL\Exception\NeedPrivileges
	 */
	public function httpPatch(RequestInterface $request, ResponseInterface $response): bool {
		$path = $request->getPath();
		$node = $this->server->tree->getNodeForPath($path);

		if (!($node instanceof Card)) {
			return true;
		}

		// Checking ACL, if available.
		if ($aclPlugin = $this->server->getPlugin('acl')) {
			/** @var \Sabre\DAVACL\Plugin $aclPlugin */
			$aclPlugin->checkPrivileges($path, '{DAV:}write');
		}

		// Init property name & value
		$propertyName = $request->getHeader('X-Property');
		if (is_null($propertyName)) {
			throw new DAV\Exception\BadRequest('No valid "X-Property" found in the headers');
		}

		$propertyData = $request->getHeader('X-Property-Replace');
		$method = self::METHOD_REPLACE;
		if (is_null($propertyData)) {
			$propertyData = $request->getHeader('X-Property-Append');
			$method = self::METHOD_APPEND;
			if (is_null($propertyData)) {
				throw new DAV\Exception\BadRequest('No valid "X-Property-Append" or "X-Property-Replace" found in the headers');
			}
		}

		$propertyData = rawurldecode($propertyData);

		// Init contact
		$vCard = Reader::read($node->get());
		$properties = $vCard->select($propertyName);

		// We cannot know which one to update in that case
		if (count($properties) > 1) {
			throw new DAV\Exception\BadRequest('The specified property appear more than once');
		}

		// Init if not in the vcard
		if (count($properties) === 0) {
			$vCard->add($propertyName, $propertyData);
			$properties = $vCard->select($propertyName);
		}

		// Replace existing value
		if ($method === self::METHOD_REPLACE) {
			$properties[0]->setRawMimeDirValue($propertyData);
		}

		// Append to existing value
		if ($method === self::METHOD_APPEND) {
			$oldData = $properties[0]->getValue();
			$properties[0]->setRawMimeDirValue($oldData.$propertyData);
		}

		// Validate & write
		$vCard->validate();
		$node->put($vCard->serialize());
		$response->setStatus(200);

		return false;
	}

	/**
	 * Returns a plugin name.
	 *
	 * Using this name other plugins will be able to access other plugins
	 * using \Sabre\DAV\Server::getPlugin
	 *
	 * @return string
	 */
	public function getPluginName() {
		return 'vcard-patch';
	}

	/**
	 * Returns a bunch of meta-data about the plugin.
	 *
	 * Providing this information is optional, and is mainly displayed by the
	 * Browser plugin.
	 *
	 * The description key in the returned array may contain html and will not
	 * be sanitized.
	 *
	 * @return array
	 */
	public function getPluginInfo() {
		return [
			'name' => $this->getPluginName(),
			'description' => 'Allow to patch unique properties.'
		];
	}
}
