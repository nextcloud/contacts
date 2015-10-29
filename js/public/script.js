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
			template: '<contactlist data-addressbook="addressBook"></contactlist>',
			resolve: {
				addressBook: function(AddressBookService, DavClient, $stateParams) {
					return AddressBookService.then(function (addressBooks) {
						var addressBook = addressBooks.filter(function (element) {
							return element.displayName === $stateParams.addressBookId;
						})[0];
						return DavClient.syncAddressBook(addressBook, {json: true});
					});
				}
			},
			controller: function($scope, addressBook) {
				$scope.addressBook = addressBook;
			}
		});
}]);


app.controller('addressbookCtrl', function() {
	var ctrl = this;
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
	};
});
app.controller('addressbooklistCtrl', ['$scope', 'AddressBookService', function(scope, AddressBookService) {
	var ctrl = this;

	AddressBookService.then(function(addressBooks) {
		scope.$apply(function() {
			ctrl.addressBooks = addressBooks;
		});
	});
}]);
app.directive('addressbooklist', function() {
	return {
		scope: {},
		controller: 'addressbooklistCtrl',
		controllerAs: 'ctrl',
		bindToController: {},
		templateUrl: OC.linkTo('contactsrework', 'templates/addressBookList.html')
	};
});
app.controller('contactCtrl', ['Contact', function(Contact) {
	var ctrl = this;

	ctrl.contact = new Contact(ctrl.data);

	console.log(ctrl.contact);

}]);
app.directive('contact', function() {
	return {
		scope: {},
		controller: 'contactCtrl',
		controllerAs: 'ctrl',
		bindToController: {
			data: '='
		},
		templateUrl: OC.linkTo('contactsrework', 'templates/contact.html')
	};
});
app.controller('contactlistCtrl', function() {
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
app.service('AddressBookService', ['DavService', function(DavService){

	return DavService.then(function(account) {
		return account.addressBooks;
	});
}]);
app.service('ContactService', [ 'DavClient', function(DavClient) {

	this.create = function(addressBook) {
		// push contact to server
		return DavClient.createCard(addressBook);
	};

	this.update = function(contact) {
		// update contact on server
		return DavClient.updateCard(contact, {json: true});
	};

	this.remove = function(contact) {
		// delete contact from server
		return DavClient.deleteCard(contact);
	};

	this.fromArray = function(array) {
		// from array to contact
	};
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

app.factory('Contact', function(ContactService)
{
	return function Contact(jCard) {
		angular.extend(this, {

			jCard: [],

			name: function(value) {
				var name = this.getProperty('n');
				if (angular.isDefined(value)) {
					// setter
					this.setPropertyValue(name, value);
				} else {
					// getter
					return this.getPropertyValue(name);
				}

			},

			getProperty: function(name) {
				var contact = this;
				if(!angular.isDefined(contact.jCard.addressData[1])) {
					return undefined;
				}
				var properties = contact.jCard.addressData[1];
				for(var i in properties) {
					if(properties[i][0] === name)
						return properties[i];
				}
				return undefined;
			},

			getPropertyValue: function(property) {
				if(property[3] instanceof Array) {
					return property[3].join(' ');
				} else {
					return property[3];
				}
			},

			setPropertyValue: function(property, propertyValue) {
				property[3] = propertyValue;
				this.update();
			},

			update: function() {
				ContactService.update(this.jCard);
			}

		});
		angular.extend(this.jCard, jCard);
	};
});