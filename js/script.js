/**
 * ownCloud - contactsrework
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Hendrik Leppelsack <hendrik@leppelsack.de>
 * @copyright Hendrik Leppelsack 2015
 */

(function (OC, angular, $, vCard) {

	var app = angular.module('contactsApp', ['ui.router']);

	app.run(function($rootScope) {
		$rootScope.addressBooks = [];
	});

	app.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider){
		$urlRouterProvider.otherwise('/');

		$stateProvider
			.state('home', {
				url: '/',
				template: '<div>Home</div>'
			})
			.state('contactlist',{
				url: '/:addressBookId',
				template: '<contactlist data-addressbook="addressBook"></contactlist>',
				resolve: {
					addressBook: function(AddressBookService, xhr, $stateParams) {
						return AddressBookService.then(function (addressBooks) {
							var addressBook = addressBooks.filter(function (element) {
								return element.displayName === $stateParams.addressBookId;
							})[0];
							return dav.syncAddressBook(addressBook, {xhr: xhr});
						}).then(function (addressBook) {
							return addressBook;
						});
					}
				},
				controller: function($scope, addressBook) {
					$scope.addressBook = addressBook;
				}
			})
	}]);

	app.service('xhr', function() {
		return new dav.transport.Basic(
			new dav.Credentials()
		);
	});

	app.service('DavService', ['xhr', function(xhr) {

		return dav.createAccount({
			server: "/remote.php/carddav/",
			xhr: xhr,
			accountType: 'carddav'
		});
	}]);

	app.service('AddressBookService', ['DavService', function(DavService){
		return DavService.then(function(account) {
			return account.addressBooks;
		});
	}]);

	app.directive('addressbooklist', function() {
		return {
			scope: {},
			controller: 'addressbooklistCtrl',
			controllerAs: 'ctrl',
			bindToController: {},
			templateUrl: OC.linkTo('contactsrework', 'templates/addressBookList.html')
		}
	});

	app.directive('addressbook', function() {
		return {
			restrict: 'E',
			scope: {},
			controller: 'addressbookCtrl',
			controllerAs: 'ctrl',
			bindToController: {
				addressBook: "=data"
			},
			templateUrl: OC.linkTo('contactsrework', 'templates/addressBook.html')

		}
	});

	app.controller('addressbooklistCtrl', ['$scope', 'AddressBookService', function(scope, AddressBookService) {
		var ctrl = this;

		AddressBookService.then(function(addressBooks) {
			scope.$apply(function() {
				ctrl.addressBooks = addressBooks;
			});
		});
	}]);

	app.controller('addressbookCtrl', function() {
		var ctrl = this;
	});

	app.directive('contactlist', function() {
		return {
			priority: 1,
			scope: {},
			controller: 'contactlistCtrl',
			controllerAs: 'ctrl',
			bindToController: {
				addressbook: '='
			},
			templateUrl: OC.linkTo('contactsrework', 'templates/contactList.html')
		};
	});

	app.controller('contactlistCtrl', function() {
		var ctrl = this;
	});

	app.directive('contact', function() {
		return {
			scope: {},
			controller: 'contactCtrl',
			controllerAs: 'ctrl',
			bindToController: {
				data: '='
			},
			templateUrl: OC.linkTo('contactsrework', 'templates/contact.html')
		}
	});

	app.controller('contactCtrl', ['$filter', function($filter) {
		var ctrl = this;

		console.log($filter('vCard2JSON')(ctrl.data.addressData));

	}]);

	app.filter('JSON2vCard', function() {
		return vCard.generate;
	});

	app.filter('vCard2JSON', function() {
		return function(input, prop) {
			var result = vCard.parse(input);
			if(prop === undefined) {
				return result;
			}
			if(result[prop] === undefined) {
				return undefined;
			}
			result = result[prop][0];
			if(result.value instanceof Array) {
				return result.value.join(' ');
			} else {
				return result.value;
			}
		}
	});

})(OC, angular, jQuery, vCard);
