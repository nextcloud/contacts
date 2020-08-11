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
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */

namespace OCA\Contacts\Migration;

use OCP\IConfig;
use OCP\IDBConnection;
use OCP\Migration\IOutput;
use OCP\Migration\IRepairStep;

use OCA\DAV\CardDAV\CardDavBackend;

class BuildSocialSearchIndex implements IRepairStep {

	/** @var IDBConnection */
	private $db;
	/** @var IConfig */
	private $config;
	/** @var CardDavBackend */
	private $davBackend;

	/**
	 * @param IDBConnection $db
	 * @param IConfig $config
	 * @param CardDavBackend $davBackend
	 */
	public function __construct(IDBConnection $db,
								IConfig $config,
								CardDavBackend $davBackend) {
		$this->db = $db;
		$this->config = $config;
		$this->davBackend = $davBackend;
	}

	/**
	 * @return string
	 */
	public function getName() {
		return 'Adding social profile data to search index';
	}

	/**
	 * @param IOutput $output
	 */
	public function run(IOutput $output) {
		// only run once
		if ($this->config->getAppValue('contacts', 'builtSocialSearchIndex') === 'yes') {
			$output->info('Repair step already executed');
			return;
		}

		// get contacts with social profiles
		$query = $this->db->getQueryBuilder();
		// TODO: return contacts with multiple social profiles only once
		// FIXME: distinct seems only to return the first parameter?
		// $query->selectDistinct('c.addressbookid', 'c.uri', 'c.carddata')
		$query->select('c.addressbookid', 'c.uri', 'c.carddata')
			->from('cards_properties', 'p')
			->leftJoin('p', 'cards', 'c', 'c.id = p.cardid')
			->where('p.name=\'X-SOCIALPROFILE\'');
		$social_cards = $query->execute();

		// refresh identified contacts in order to re-index
		while ($row = $social_cards->fetch(\PDO::FETCH_ASSOC)) {
			$this->davBackend->updateCard($row['addressbookid'], $row['uri'], $row['carddata']);
		}

		// no need to redo the repair during next upgrade
		$this->config->setAppValue('contacts', 'builtSocialSearchIndex', 'yes');
	}
}
