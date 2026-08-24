<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace unit\Service;

use ChristophWurst\Nextcloud\Testing\TestCase;
use OCA\Contacts\Service\CustomPropertiesService;
use OCP\IConfig;
use PHPUnit\Framework\MockObject\MockObject;
use Psr\Log\LoggerInterface;

class CustomPropertiesServiceTest extends TestCase {
	private CustomPropertiesService $service;
	private IConfig|MockObject $config;
	private LoggerInterface|MockObject $logger;

	protected function setUp(): void {
		parent::setUp();

		$this->config = $this->createMock(IConfig::class);
		$this->logger = $this->createMock(LoggerInterface::class);

		$this->service = new CustomPropertiesService(
			$this->config,
			$this->logger,
		);
	}

	private function mockConfigValue(string $json): void {
		$this->config->method('getAppValue')
			->with('contacts', 'customProperties', '[]')
			->willReturn($json);
	}

	public function testEmptyByDefault(): void {
		$this->mockConfigValue('[]');

		$this->assertSame([], $this->service->getCustomProperties());
	}

	public function testInvalidJsonIsIgnoredAndLogged(): void {
		$this->mockConfigValue('{not json');
		$this->logger->expects($this->once())->method('warning');

		$this->assertSame([], $this->service->getCustomProperties());
	}

	public function testValidEntryIsNormalized(): void {
		$this->mockConfigValue(json_encode([
			[
				'name' => 'X-Customernumber',
				'label' => 'Customer number',
				'icon' => 'icon-detailed-name',
				'unknownKey' => 'is stripped',
			],
		]));

		$this->assertSame([
			[
				'name' => 'x-customernumber',
				'label' => 'Customer number',
				'force' => 'text',
				'multiple' => false,
				'primary' => false,
				'icon' => 'icon-detailed-name',
			],
		], $this->service->getCustomProperties());
	}

	public function testOptionsAreSanitized(): void {
		$this->mockConfigValue(json_encode([
			[
				'name' => 'x-region',
				'label' => 'Region',
				'force' => 'select',
				'multiple' => true,
				'options' => [
					['id' => 'NORTH', 'name' => 'North'],
					['id' => '', 'name' => 'no id'],
					['name' => 'missing id'],
					'not an array',
				],
			],
		]));

		$properties = $this->service->getCustomProperties();
		$this->assertCount(1, $properties);
		$this->assertSame([['id' => 'NORTH', 'name' => 'North']], $properties[0]['options']);
		$this->assertTrue($properties[0]['multiple']);
	}

	/**
	 * @dataProvider provideInvalidEntries
	 */
	public function testInvalidEntriesAreDroppedAndLogged(mixed $entry): void {
		$this->mockConfigValue(json_encode([$entry]));
		$this->logger->expects($this->once())->method('warning');

		$this->assertSame([], $this->service->getCustomProperties());
	}

	public static function provideInvalidEntries(): array {
		return [
			'not an array' => ['just a string'],
			'missing name' => [['label' => 'No name']],
			'missing label' => [['name' => 'x-foo']],
			'empty label' => [['name' => 'x-foo', 'label' => '  ']],
			'name without x- prefix' => [['name' => 'customernumber', 'label' => 'Customer number']],
			'name with invalid characters' => [['name' => 'x-foo.bar', 'label' => 'Foo']],
			'unknown force' => [['name' => 'x-foo', 'label' => 'Foo', 'force' => 'date']],
			'select without options' => [['name' => 'x-foo', 'label' => 'Foo', 'force' => 'select']],
		];
	}

	public function testValidEntriesSurviveInvalidSiblings(): void {
		$this->mockConfigValue(json_encode([
			['name' => 'x-valid', 'label' => 'Valid'],
			['name' => 'invalid', 'label' => 'Invalid'],
		]));

		$properties = $this->service->getCustomProperties();
		$this->assertCount(1, $properties);
		$this->assertSame('x-valid', $properties[0]['name']);
	}
}
