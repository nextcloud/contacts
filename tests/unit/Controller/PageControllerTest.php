<?php

/**
 * SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Controller;

use ChristophWurst\Nextcloud\Testing\TestCase;
use OC\App\CompareVersion;
use OCA\Contacts\AppInfo\Application;
use OCA\Contacts\Service\GroupSharingService;
use OCA\Contacts\Service\SocialApiService;
use OCP\App\IAppManager;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Services\IInitialState;
use OCP\IConfig;
use OCP\IRequest;
use OCP\IUser;
use OCP\IUserSession;
use OCP\L10N\IFactory;
use OCP\ServerVersion;
use PHPUnit\Framework\MockObject\MockObject;

class PageControllerTest extends TestCase {
	private $controller;

	/** @var IRequest|MockObject */
	private $request;

	/** @var IConfig|MockObject */
	private $config;

	/** @var IInitialState|MockObject */
	private $initialStateService;

	/** @var IFactory|MockObject */
	private $languageFactory;

	/** @var IUserSession|MockObject */
	private $userSession;

	/** @var SocialApiService|MockObject */
	private $socialApi;

	/** @var IAppManager|MockObject */
	private $appManager;

	/** @var CompareVersion|MockObject */
	private $compareVersion;

	private GroupSharingService|MockObject $groupSharingService;

	protected function setUp(): void {
		parent::setUp();

		$this->request = $this->createMock(IRequest::class);
		$this->config = $this->createMock(IConfig::class);
		$this->initialStateService = $this->createMock(IInitialState::class);
		$this->languageFactory = $this->createMock(IFactory::class);
		$this->userSession = $this->createMock(IUserSession::class);
		$this->socialApi = $this->createMock(SocialApiService::class);
		$this->appManager = $this->createMock(IAppManager::class);
		$this->compareVersion = $this->createMock(CompareVersion::class);
		$this->groupSharingService = $this->createMock(GroupSharingService::class);

		$this->controller = $this->buildController(new StaticServerVersion(Application::MAX_SERVER_VERSION_WITH_TEAM_MANAGEMENT));
	}

	private function buildController(ServerVersion $serverVersion): PageController {
		return new PageController(
			$this->request,
			$this->config,
			$this->initialStateService,
			$this->languageFactory,
			$this->userSession,
			$this->socialApi,
			$this->appManager,
			$this->compareVersion,
			$this->groupSharingService,
			$serverVersion,
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

	public static function teamManagementDataProvider(): array {
		return [
			// [server major version, circles enabled, circles version compatible, expected]
			'supported server with compatible circles' => [34, true, true, true],
			'older supported server' => [33, true, true, true],
			'server manages teams itself' => [35, true, true, false],
			'future server' => [36, true, true, false],
			'circles app disabled' => [34, false, true, false],
			'incompatible circles version' => [34, true, false, false],
		];
	}

	/**
	 * @dataProvider teamManagementDataProvider
	 */
	public function testTeamManagementFeatureGate(
		int $serverMajorVersion,
		bool $circlesEnabled,
		bool $circleVersionCompatible,
		bool $expected,
	): void {
		$user = $this->createMock(IUser::class);
		$user->method('getUid')->willReturn('mrstest');
		$this->userSession->method('getUser')->willReturn($user);

		$this->appManager->method('getAppVersion')
			->willReturnCallback(static fn (string $appId): string => $appId === 'circles' ? '22.0.0' : '2.0.0');
		$this->appManager->method('isEnabledForUser')
			->willReturnCallback(static fn (string $appId): bool => $appId === 'circles' && $circlesEnabled);
		// Only the circles version check is relevant here, it is the only one
		// looking at the 22.0.0 we hand out above.
		$this->compareVersion->method('isCompatible')
			->willReturnCallback(static fn (string $actual): bool => $actual !== '22.0.0' || $circleVersionCompatible);

		$providedStates = [];
		$this->initialStateService->method('provideInitialState')
			->willReturnCallback(function (string $key, $value) use (&$providedStates): void {
				$providedStates[$key] = $value;
			});

		$this->buildController(new StaticServerVersion($serverMajorVersion))->index();

		$this->assertArrayHasKey('isTeamManagementEnabled', $providedStates);
		$this->assertSame($expected, $providedStates['isTeamManagementEnabled']);
	}
}

/**
 * ServerVersion is a readonly class, which PHPUnit 9 refuses to double, so we
 * override the single getter the feature gate looks at instead.
 */
readonly class StaticServerVersion extends ServerVersion {
	public function __construct(
		private int $majorVersion,
	) {
		parent::__construct();
	}

	#[\Override]
	public function getMajorVersion(): int {
		return $this->majorVersion;
	}
}
