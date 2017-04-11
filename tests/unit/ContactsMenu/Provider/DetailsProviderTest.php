<?php

/**
 * @copyright 2017 Christoph Wurst <christoph@winzerhof-wurst.at>
 *
 * @author 2017 Christoph Wurst <christoph@winzerhof-wurst.at>
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
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

namespace Tests\Contacts\ContactsMenu\Providers;

use OCA\Contacts\ContactsMenu\Providers\DetailsProvider;
use OCP\Contacts\ContactsMenu\IActionFactory;
use OCP\Contacts\ContactsMenu\IEntry;
use OCP\Contacts\ContactsMenu\ILinkAction;
use OCP\IURLGenerator;
use PHPUnit_Framework_MockObject_MockObject;
use PHPUnit_Framework_TestCase;

class DetailsProviderTest extends PHPUnit_Framework_TestCase {

	/** @var IURLGenerator|PHPUnit_Framework_MockObject_MockObject */
	private $urlGenerator;

	/** @var IActionFactory|PHPUnit_Framework_MockObject_MockObject */
	private $actionFactory;

	/** @var DetailsProvider */
	private $provider;

	protected function setUp() {
		parent::setUp();

		$this->urlGenerator = $this->createMock(IURLGenerator::class);
		$this->actionFactory = $this->createMock(IActionFactory::class);
		$this->provider = new DetailsProvider($this->urlGenerator, $this->actionFactory);
	}

	public function testProcess() {
		$entry = $this->createMock(IEntry::class);
		$action = $this->createMock(ILinkAction::class);

		$entry->expects($this->exactly(2))
			->method('getProperty')
			->will($this->returnValueMap([
					['UID', 'e3a71614-c602-4eb5-9994-47eec551542b'],
					['isLocalSystemBook', null]
		]));
		$this->urlGenerator->expects($this->once())
			->method('imagePath')
			->with('core', 'actions/info.svg')
			->willReturn('core/img/actions/info.svg');
		$iconUrl = 'https://example.com/core/img/actions/info.svg';
		$this->urlGenerator->expects($this->exactly(2))
			->method('getAbsoluteURL')
			->will($this->returnValueMap([
					['/index.php/apps/contacts', 'cloud.example.com/index.php/apps/contacts'],
					['core/img/actions/info.svg', $iconUrl],
		]));
		$this->actionFactory->expects($this->once())
			->method('newLinkAction')
			->with($this->equalTo($iconUrl), $this->equalTo('Details'), $this->equalTo('cloud.example.com/index.php/apps/contacts'))
			->willReturn($action);
		$action->expects($this->once())
			->method('setPriority')
			->with($this->equalTo(0));
		$entry->expects($this->once())
			->method('addAction')
			->with($action);

		$this->provider->process($entry);
	}

	public function testProcessNoUID() {
		$entry = $this->createMock(IEntry::class);
		$entry->expects($this->once())
			->method('getProperty')
			->with($this->equalTo('UID'))
			->willReturn(null);
		$entry->expects($this->never())
			->method('addAction');

		$this->provider->process($entry);
	}

	public function testProcessSystemContact() {
		$entry = $this->createMock(IEntry::class);
		$entry->expects($this->exactly(2))
			->method('getProperty')
			->will($this->returnValueMap([
					['UID', 1234],
					['isLocalSystemBook', true]
		]));
		$entry->expects($this->never())
			->method('addAction');

		$this->provider->process($entry);
	}

}
