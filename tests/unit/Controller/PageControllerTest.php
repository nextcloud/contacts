<?php
/**
 * Nextcloud - contacts
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Hendrik Leppelsack <hendrik@leppelsack.de>
 * @copyright Hendrik Leppelsack 2015
 */

namespace OCA\Contacts\Controller;

use OCP\AppFramework\Http\TemplateResponse;
use PHPUnit\Framework\TestCase as Base;


class PageControllerTest extends Base {

	private $controller;

	public function setUp(): void {
		$config = $this->getMockBuilder('OCP\IConfig')->getMock();
		$request = $this->getMockBuilder('OCP\IRequest')->getMock();

		$this->controller = new PageController(
			'contacts',
			$request,
			$config
		);
	}


	public function testIndex() {
		$result = $this->controller->index();

		$this->assertEquals('main', $result->getTemplateName());
		$this->assertEquals('user', $result->getRenderAs());
		$this->assertTrue($result instanceof TemplateResponse);
	}
}
