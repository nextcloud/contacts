/**
 * ownCloud - contactsrework
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Hendrik Leppelsack <hendrik@leppelsack.de>
 * @copyright Hendrik Leppelsack 2015
 */

var app = angular.module('contactsApp', ['uuid4', 'angular-cache', 'ngRoute']);

app.config(['$routeProvider', function($routeProvider){

	$routeProvider.when("/:uid", {
		template: '<contactdetails></contactdetails>'
	});

}]);
