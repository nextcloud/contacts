/**
 * ownCloud - contactsrework
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Hendrik Leppelsack <hendrik@leppelsack.de>
 * @copyright Hendrik Leppelsack 2015
 */

var app = angular.module('contactsApp', ['ui.router']);

app.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider){
	$urlRouterProvider.otherwise('/');

	$stateProvider
		.state('home', {
			url: '/',
			template: '<div>Home</div>'
		})
		.state('contactlist',{
			url: '/:addressBookId',
			template: '<contactlist data-adrbook="addressBook"></contactlist>',
			resolve: {
				addressBook: function(AddressBookService, $stateParams) {
					return AddressBookService.get($stateParams.addressBookId).then(function(addressBook) {
						return AddressBookService.sync(addressBook);
					});
				}
			},
			controller: function($scope, addressBook) {
				$scope.addressBook = addressBook;
			}
		})
		.state('contactlist.contact', {
			url: '/:contact',
			template: '<div>Test</div>'
		});
}]);

