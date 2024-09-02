<?php
/**
 * @copyright Copyright (c) 2019 John Molakvoæ <skjnldsv@protonmail.com>
 *
 * @author John Molakvoæ <skjnldsv@protonmail.com>
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

use ChristophWurst\Nextcloud\Testing\TestCase;
use OC\App\CompareVersion;
use OCA\Contacts\Service\GroupSharingService;
use OCA\Contacts\Service\SocialApiService;
use OCP\App\IAppManager;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\IConfig;
use OCP\IInitialStateService;
use OCP\IRequest;
use OCP\IUser;
use OCP\IUserSession;
use OCP\L10N\IFactory;
use PHPUnit\Framework\MockObject\MockObject;

class PageControllerTest extends TestCase {
	private $controller;

	/** @var IRequest|MockObject */
	private $request;

	/** @var IConfig|MockObject*/
	private $config;

	/** @var IInitialStateService|MockObject */
	private $initialStateService;

	/** @var IFactory|MockObject */
	private $languageFactory;

	/** @var IUserSession|MockObject */
	private $userSession;

	/** @var SocialApiService|MockObject*/
	private $socialApi;

	/** @var IAppManager|MockObject*/
	private $appManager;

	/** @var CompareVersion|MockObject*/
	private $compareVersion;

	private GroupSharingService|MockObject $groupSharingService;

	protected function setUp(): void {
		parent::setUp();

		$this->request = $this->createMock(IRequest::class);
		$this->config = $this->createMock(IConfig::class);
		$this->initialStateService = $this->createMock(IInitialStateService::class);
		$this->languageFactory = $this->createMock(IFactory::class);
		$this->userSession = $this->createMock(IUserSession::class);
		$this->socialApi = $this->createMock(SocialApiService::class);
		$this->appManager = $this->createMock(IAppManager::class);
		$this->compareVersion = $this->createMock(CompareVersion::class);
		$this->groupSharingService = $this->createMock(GroupSharingService::class);

		$this->controller = new PageController(
			$this->request,
			$this->config,
			$this->initialStateService,
			$this->languageFactory,
			$this->userSession,
			$this->socialApi,
			$this->appManager,
			$this->compareVersion,
			$this->groupSharingService,
		);
	}


	public function testIndex() {
		$user = $this->createMock(IUser::class);
		$user->method('getUid')->willReturn('mrstest');
		$this->userSession->method('getUser')->willReturn($user);

		$result = $this->controller->index();

		$this->assertEquals('main', $result->getTemplateName());
		$this->assertEquals('user', $result->getRenderAs());
		$this->assertTrue($result instanceof TemplateResponse);
	}
}
