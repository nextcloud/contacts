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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
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
use OCP\Contacts\IManager;
use OCP\IAddressBook;
use OCP\IConfig;
use OCP\IL10N;
use OCP\IURLGenerator;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase as Base;

class DetailsProviderTest extends Base {
	/** @var IURLGenerator|MockObject */
	private $urlGenerator;

	/** @var IActionFactory|MockObject */
	private $actionFactory;

	/** @var IL10n|MockObject */
	private $l10n;

	/** @var IManager|MockObject */
	private $manager;

	/** @var IConfig|MockObject */
	private $config;

	/** @var DetailsProvider */
	private $provider;

	protected function setUp(): void {
		parent::setUp();

		$this->urlGenerator = $this->createMock(IURLGenerator::class);
		$this->actionFactory = $this->createMock(IActionFactory::class);
		$this->l10n = $this->createMock(IL10N::class);
		$this->manager = $this->createMock(IManager::class);
		$this->provider = new DetailsProvider(
			$this->urlGenerator,
			$this->actionFactory,
			$this->l10n,
			$this->manager
		);
	}

	public function testProcessContact() {
		$entry = $this->createMock(IEntry::class);
		$action = $this->createMock(ILinkAction::class);
		$addressbook = $this->createMock(IAddressBook::class);

		// DATA
		$domain = 'https://cloud.example.com';
		$uid = 'e3a71614-c602-4eb5-9994-47eec551542b';
		$abUri = 'contacts-1';
		$iconUrl = 'core/img/actions/info.svg';
		$resultUri = "$domain/index.php/apps/contacts/direct/contact/$uid~$abUri";

		$entry->expects($this->exactly(3))
			  ->method('getProperty')
			  ->will($this->returnValueMap([
			  	['UID', $uid],
			  	['isLocalSystemBook', null],
			  	['addressbook-key', 1]
			  ]));

		$addressbook->expects($this->once())
					->method('getKey')
					->willReturn(1);

		$addressbook->expects($this->once())
					->method('getUri')
					->willReturn($abUri);

		$this->manager->expects($this->once())
			 ->method('getUserAddressbooks')
			 ->willReturn([1 => $addressbook]);

		// Action icon
		$this->urlGenerator->expects($this->once())
			 ->method('imagePath')
			 ->with('core', 'actions/info.svg')
			 ->willReturn($iconUrl);

		//
		$this->urlGenerator->expects($this->once())
			 ->method('linkToRoute')
			 ->with('contacts.contacts.direct', [
			 	'contact' => $uid . '~' . $abUri
			 ])
			 ->willReturn("/apps/contacts/direct/contact/$uid~$abUri");

		// Action icon and contact absolute urls
		$this->urlGenerator->expects($this->exactly(2))
			 ->method('getAbsoluteURL')
			 ->will($this->returnValueMap([
			 	[$iconUrl, "$domain/$iconUrl"],
			 	["/apps/contacts/direct/contact/$uid~$abUri", $resultUri]
			 ]));

		// Translations
		$this->l10n->expects($this->once())
			 ->method('t')
			 ->with('Details')
			 ->willReturnArgument(0);
			 
		$this->actionFactory->expects($this->once())
			 ->method('newLinkAction')
			 ->with($this->equalTo("$domain/$iconUrl"), $this->equalTo('Details'), $this->equalTo($resultUri))
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
