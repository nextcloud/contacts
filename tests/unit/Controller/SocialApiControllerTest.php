<?php
/**
 * @copyright Copyright (c) 2020 Matthias Heinisch <nextcloud@matthiasheinisch.de>
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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */

namespace OCA\Contacts\Controller;

use OCP\AppFramework\ApiController;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Http\JSONResponse;
use OCP\AppFramework\Http\TemplateResponse;
// use OCP\IInitialStateService;
use OCP\IConfig;
use OCP\Contacts\IManager;
use OCP\Contacts\ContactsMenu\IEntry;
use OCP\IAddressBook;
use OCP\L10N\IFactory;
use OCP\IRequest;

use PHPUnit\Framework\MockObject\MockObject;
use ChristophWurst\Nextcloud\Testing\TestCase;


class SocialApiControllerTest extends TestCase {

	private $controller;

	/** @var IRequest|MockObject */
	private $request;

	/** @var IInitialStateService|MockObject */
	private $initialStateService;

	/** @var IFactory|MockObject */
	private $languageFactory;

	/** @var IConfig|MockObject */
	private  $config;

	/** @var IManager|MockObject */
	private  $manager;

	public function setUp() {
		parent::setUp();

		$this->request = $this->createMock(IRequest::class);
		// $this->initialStateService = $this->createMock(IInitialStateService::class);
		$this->languageFactory = $this->createMock(IFactory::class);
		$this->config = $this->createMock(IConfig::class);
		$this->manager = $this->createMock(IManager::class);

		$this->controller = new SocialApiController(
			'socialContact',
			$this->request,
			$this->manager,
			$this->config,
			// $this->initialStateService,
			$this->languageFactory
		);

		$this->entry       = $this->createMock(IEntry::class);
		$this->addressbook = $this->createMock(IAddressBook::class); // FIXME: can I have a dummy address book or do I need integration tests for that?

	}


	public function testSetup() {

		$this->addressbook->expects($this->once())
		            ->method('getKey')
		            ->willReturn(1);
	}

	public function testNoData() {

		$expected = new JSONResponse(array());
		$expected->setStatus(500);

		$result = $this->controller->fetch($addressbookId='nonexisting', $contactId='nonexisting', $type='avatar');

		// $this->assertEquals($result, $expected, 'Addressbook not found shall return a 500 status response');
		// $this->assertEquals($result, $expected, 'Contact not found shall return a 500 status response');
		// $this->assertEquals($result, $expected, 'Contact without social profile shall return a 500 status response');
	}

}
