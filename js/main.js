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
				addressBook: function(AddressBookService, DavClient, $stateParams) {
					return AddressBookService.then(function (addressBooks) {
						var addressBook = addressBooks.filter(function (element) {
							return element.displayName === $stateParams.addressBookId;
						})[0];
						return DavClient.syncAddressBook(addressBook, {accept: 'application/vCard+json'});
					}).then(function (addressBook) {
						return addressBook;
					});
				}
			},
			controller: function($scope, addressBook) {
				$scope.addressBook = addressBook;
			}
		});
}]);

app.service('DavClient', function() {
	var xhr = new dav.transport.Basic(
		new dav.Credentials()
	);
	return new dav.Client(xhr);
});

app.service('DavService', ['DavClient', function(client) {
	return client.createAccount({
		server: OC.linkToRemoteBase('carddav'),
		accountType: 'carddav'
	});
}]);

app.service('AddressBookService', ['DavService', function(DavService){
	return DavService.then(function(account) {
		return account.addressBooks;
	});
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
	};
});
