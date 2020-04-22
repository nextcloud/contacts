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

		// TODO: make socialprofile a data provider:
		// contact with one (valid) social profile - as id and as url
		// contact with one (invalid) social profile - as username
		// contact without social profile
		// contact without supported social profile
		// contact with multiple supported social profiles

		// Zuckerberg
		$this->testcontact = [
			'URI' => '3225c0d5-1bd2-43e5-a08c-4e65eaa406b0',
			'VERSION' => '4.0',
			'PHOTO' => '',
			'X-SOCIALPROFILE' => array('facebook' => '4')
		];

		// stub addressbook
		$this->addressbook = $this->createMock(IAddressBook::class);
		$this->addressbook
			->method('getUri')
			->willReturn('contacts');

		$this->addressbook
			->method('search')
		        ->with(
				$this->equalTo('3225c0d5-1bd2-43e5-a08c-4e65eaa406b0'), 
				$this->equalTo(['UID']),
				$this->equalTo([]) )
			->willReturn(array($this->testcontact));

		$this->manager
			->method('getUserAddressBooks')
			->willReturn(array($this->addressbook));
	}


	public function testFacebook() {

		$expected = new JSONResponse([], Http::STATUS_OK);

		$result = $this->controller->fetch($addressbookId='contacts', $contactId='3225c0d5-1bd2-43e5-a08c-4e65eaa406b0', $type='avatar');

		$this->assertEquals($result, $expected, 'Download of Marc Zuckerbergs profile picture shall return success');
	}

}
