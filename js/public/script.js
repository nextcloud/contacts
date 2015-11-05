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


app.controller('addressbooklistCtrl', ['$scope', 'AddressBookService', function(scope, AddressBookService) {
	var ctrl = this;

	console.log(AddressBookService);
	AddressBookService.getAll().then(function(addressBooks) {
		scope.$apply(function() {
			ctrl.addressBooks = addressBooks;
		});
	});
}]);
app.directive('addressbooklist', function() {
	return {
		restrict: 'A', // has to be an attribute to work with core css
		scope: {},
		controller: 'addressbooklistCtrl',
		controllerAs: 'ctrl',
		bindToController: {},
		templateUrl: OC.linkTo('contactsrework', 'templates/addressBookList.html')
	};
});
app.controller('addressbookCtrl', function() {
	var ctrl = this;
	console.log(this);
});
app.directive('addressbook', function() {
	return {
		restrict: 'A', // has to be an attribute to work with core css
		scope: {},
		controller: 'addressbookCtrl',
		controllerAs: 'ctrl',
		bindToController: {
			addressBook: "=data"
		},
		templateUrl: OC.linkTo('contactsrework', 'templates/addressBook.html')
	};
});
app.controller('contactCtrl', ['Contact', function(Contact) {
	var ctrl = this;

	ctrl.contact = new Contact(ctrl.data);

	console.log("Contact: ",ctrl.contact);

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
			addressbook: '=adrbook'
		},
		templateUrl: OC.linkTo('contactsrework', 'templates/contactList.html')
	};
});
app.factory('AddressBook', function()
{
	return function AddressBook(data) {
		angular.extend(this, {

			baseUrl: "",
			displayName: "",
			contacts: []

		});
		angular.extend(this, data);
	};
});
app.factory('Contact', [ 'ContactService', '$filter', function(ContactService, $filter) {
	return function Contact(vCard) {
		angular.extend(this, {

			data: {},
			props: {},

			uid: function(value) {
				if (angular.isDefined(value)) {
					// setter
					return this.setProperty('uid', { value: value });
				} else {
					// getter
					return this.getProperty('uid').value;
				}
			},

			fullName: function(value) {
				if (angular.isDefined(value)) {
					// setter
					return this.setProperty('fn', { value: value });
				} else {
					// getter
					return this.getProperty('fn').value;
				}
			},

			getProperty: function(name) {
				return this.props[name][0];
			},

			setProperty: function(name, data) {
				angular.extend(this.props[name][0], data);

				// keep vCard in sync
				this.data.addressData = $filter('JSON2vCard')(this.props);
			}

			/*getPropertyValue: function(property) {
				if(property.value instanceof Array) {
					return property.value.join(' ');
				} else {
					return property.value;
				}
			},

			setPropertyValue: function(property, propertyValue) {
				property[3] = propertyValue;
				this.update();
			},

			update: function() {
				ContactService.update(this.jCard);
			}*/

		});

		angular.extend(this.data, vCard);
		angular.extend(this.props, $filter('vCard2JSON')(this.data.addressData));
	};
}]);
app.service('AddressBookService', ['DavClient', 'DavService', 'Contact', function(DavClient, DavService, Contact){

	this.getAll = function() {
		return DavService.then(function(account) {
			return account.addressBooks;
		});
	};

	this.get = function(displayName) {
		return this.getAll().then(function(addressBooks){
			return addressBooks.filter(function (element) {
				return element.displayName === displayName;
			})[0];
		});
	};

	this.sync = function(addressBook) {
		return DavClient.syncAddressBook(addressBook).then(function(addressBook) {
			/*addressBook.contacts = [];
			console.log(addressBook.objects);
			for(i in addressBook.objects) {
				addressBook.contacts.push(
					new Contact(addressBook.objects[i].data)
				);
			}*/
			return addressBook;
		});
	};

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
app.filter('JSON2vCard', function() {
	return function(input) {
		return vCard.generate(input);
	};
});
app.filter('vCard2JSON', function() {
	return function(input) {
		return vCard.parse(input);
	};
});