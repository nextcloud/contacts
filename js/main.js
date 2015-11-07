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
			views: {
				'': {
					template: '<div>Home</div>'
				},

				'sidebar': {
					template: '<div>none</div>'
				}
			}
		})
		.state('contacts',{
			url: '/:addressBookId',
			views: {
				'': {
					template: '<contactlist data-adrbook="addressBook"></contactlist>',
					controller: function($scope, addressBook) {
						$scope.addressBook = addressBook;
					}
				},
				'sidebar': {
					template: '1'
				}
			},
			resolve: {
				addressBook: function(AddressBookService, $stateParams) {
					return AddressBookService.get($stateParams.addressBookId).then(function(addressBook) {
						return AddressBookService.sync(addressBook);
					});
				}
			}
		})
		.state('contacts.detail', {
			url: '/:uid',
			views: {
				'sidebar@': {
					template: '<contactdetails data="contact"></contactdetails>',
					controller: function($scope, contact) {
						$scope.contact = contact;
					}
				}
			},
			resolve: {
				contact: function(addressBook, $stateParams) {
					return addressBook.getContact($stateParams.uid);
				}
			}
		});
}]);
