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
	}

	public function testGetFacebookAvatarId() {
		$this->service->expects($this->once())
			->method(getSocialConnector)
			->with($this->equalTo(array('facebook','4')),
				$this->equalTo('avatar'))
			->will($this->returnValue($response));

		$result = $this->controller->getSocialConnector(array('facebook','4'),'avatar');

		// social connector is not null
		$this->assert(($result) > 4);
		
		// social connector starts with http
		$this->assert(substr_compare($result, 'http', 0, 4));
	}

	public function testGetFacebookAvatarFaultyId() {
		$this->service->expects($this->once())
			->method(getSocialConnector)
			->with($this->equalTo(array('facebook','alphan0meric')),
				$this->equalTo('avatar'))
			->will($this->returnValue($response));

		$result = $this->controller->getSocialConnector(array('facebook','alphan0meric'),'avatar');

		// invalid profile-id results in null response
		$this->assertEquals($result, null);
	}

	public function testGetFacebookAvatarUrl() {
		$this->service->expects($this->once())
			->method(getSocialConnector)
			->with($this->equalTo(array('facebook','https://facebook.com/4')),
				$this->equalTo('avatar'))
			->will($this->returnValue($response));

		$result = $this->controller->getSocialConnector(array('facebook','https://facebook.com/4'),'avatar');

		// social connector is not null
		$this->assert(($result) > 4);
		
		// social connector starts with http
		$this->assert(substr_compare($result, 'http', 0, 4));
	}

	public function testGetFacebookAvatarUrlSlash() {
		$this->service->expects($this->once())
			->method(getSocialConnector)
			->with($this->equalTo(array('facebook','https://facebook.com/4/')),
				$this->equalTo('avatar'))
			->will($this->returnValue($response));

		$result = $this->controller->getSocialConnector(array('facebook','https://facebook.com/4/'),'avatar');

		// social connector is not null
		$this->assert(($result) > 4);
		
		// social connector starts with http
		$this->assert(substr_compare($result, 'http', 0, 4));
	}

	public function testGetFromUnknownNetwork() {
		$this->service->expects($this->once())
			->method(getSocialConnector)
			->with($this->equalTo(array('invalid-network','00')),
				$this->equalTo('avatar'))
			->will($this->returnValue($response));

		$result = $this->controller->getSocialConnector(array('invalid-network','00'),'avatar');

		// invalid input results in null response
		$this->assertEquals($result, null);
	}

// TODO: write unit tests for fetch function

/*
    public function testUpdateNotFound() {
        // test the correct status code if no note is found
        $this->service->expects($this->once())
            ->method('update')
            ->will($this->throwException(new NotFoundException()));

        $result = $this->controller->update(3, 'title', 'content');

        $this->assertEquals(Http::STATUS_NOT_FOUND, $result->getStatus());
    }
*/



}
