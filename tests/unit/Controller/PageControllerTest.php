<?php
/**
 * @copyright Copyright (c) 2019 John Molakvoæ <skjnldsv@protonmail.com>
 *
 * @author John Molakvoæ <skjnldsv@protonmail.com>
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

use OCP\AppFramework\Http\TemplateResponse;
use OCP\IConfig;
use PHPUnit\Framework\MockObject\MockObject;
use OCP\IInitialStateService;
use OCP\IRequest;
use OCP\L10N\IFactory;
use ChristophWurst\Nextcloud\Testing\TestCase;
use OCP\App\IAppManager;

class PageControllerTest extends TestCase {

	private $controller;

	/** @var IRequest|MockObject */
	private $request;

	/** @var IInitialStateService|MockObject */
	private $initialStateService;

	/** @var IFactory|MockObject */
	private $languageFactory;

	/** @var IConfig|MockObject*/
	private  $config;

	/** @var IAppManager|MockObject*/
	private  $appManager;


	public function setUp() {
		parent::setUp();

		$this->request = $this->createMock(IRequest::class);
		$this->initialStateService = $this->createMock(IInitialStateService::class);
		$this->languageFactory = $this->createMock(IFactory::class);
		$this->config = $this->createMock(IConfig::class);
		$this->appManager = $this->createMock(IAppManager::class);

		$this->controller = new PageController(
			'contacts',
			$this->request,
			$this->config,
			$this->initialStateService,
			$this->languageFactory,
			$this->appManager

		);
	}


	public function testIndex() {
		$result = $this->controller->index();

		$this->assertEquals('main', $result->getTemplateName());
		$this->assertEquals('user', $result->getRenderAs());
		$this->assertTrue($result instanceof TemplateResponse);
	}
}
