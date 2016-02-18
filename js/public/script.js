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

	$routeProvider.when("/:gid", {
		template: '<contactdetails></contactdetails>'
	});

	$routeProvider.when("/:gid/:uid", {
		template: '<contactdetails></contactdetails>'
	});

}]);

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
app.controller('addressbooklistCtrl', ['$scope', 'AddressBookService', 'SettingsService', function(scope, AddressBookService, SettingsService) {
	var ctrl = this;

	console.log(AddressBookService);
	AddressBookService.getAll().then(function(addressBooks) {
		ctrl.addressBooks = addressBooks;
	});

	ctrl.createAddressBook = function() {
		if(ctrl.newAddressBookName) {
			AddressBookService.create(ctrl.newAddressBookName);
		}
	};

}]);

app.directive('addressbooklist', function() {
	return {
		restrict: 'EA', // has to be an attribute to work with core css
		scope: {},
		controller: 'addressbooklistCtrl',
		controllerAs: 'ctrl',
		bindToController: {},
		templateUrl: OC.linkTo('contactsrework', 'templates/addressBookList.html')
	};
});

app.controller('contactCtrl', ['$route', '$routeParams', function($route, $routeParams) {
	var ctrl = this;

	ctrl.openContact = function() {
		$route.updateParams({
			gid: $routeParams.gid,
			uid: ctrl.contact.uid()});
	};

	console.log("Contact: ",ctrl.contact);

}]);

app.directive('contact', function() {
	return {
		scope: {},
		controller: 'contactCtrl',
		controllerAs: 'ctrl',
		bindToController: {
			contact: '=data'
		},
		templateUrl: OC.linkTo('contactsrework', 'templates/contact.html')
	};
});
app.controller('contactdetailsCtrl', ['ContactService', '$routeParams', '$scope', function(ContactService, $routeParams, $scope) {
	var ctrl = this;

	ctrl.uid = $routeParams.uid;

	$scope.$watch('ctrl.uid', function(newValue, oldValue) {
		ctrl.changeContact(newValue);
	});

	ctrl.changeContact = function(uid) {
		if (typeof uid === "undefined") {
			return;
		}
		ContactService.getById(uid).then(function(contact) {
			ctrl.contact = contact;
		});
	};

	ctrl.updateContact = function() {
		ContactService.update(ctrl.contact);
		console.log('updating Contact');
	};

	ctrl.deleteContact = function() {
		ContactService.delete(ctrl.contact);
		console.log('Deleting Contact');
	};
}]);

app.directive('contactdetails', function() {
	return {
		priority: 1,
		scope: {},
		controller: 'contactdetailsCtrl',
		controllerAs: 'ctrl',
		bindToController: {},
		templateUrl: OC.linkTo('contactsrework', 'templates/contactDetails.html')
	};
});

app.controller('contactlistCtrl', ['$scope', 'ContactService', '$routeParams', function($scope, ContactService, $routeParams) {
	var ctrl = this;

	ctrl.routeParams = $routeParams;

	ContactService.registerObserverCallback(function(contacts) {
		$scope.$apply(function() {
			ctrl.contacts = contacts;
		});
	});

	ContactService.getAll().then(function(contacts) {
		$scope.$apply(function(){
			ctrl.contacts = contacts;
		});
	});

	ctrl.createContact = function() {
		ContactService.create();
	};
}]);

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
app.controller('groupCtrl', function() {
	var ctrl = this;
	console.log(this);
});

app.directive('group', function() {
	return {
		restrict: 'A', // has to be an attribute to work with core css
		scope: {},
		controller: 'groupCtrl',
		controllerAs: 'ctrl',
		bindToController: {
			addressBook: "=data"
		},
		templateUrl: OC.linkTo('contactsrework', 'templates/group.html')
	};
});

app.controller('grouplistCtrl', ['$scope', 'ContactService', function($scope, ContactService) {

	$scope.groups = [];

	ContactService.getGroups().then(function(groups) {
		$scope.groups = groups;
	});

}]);

app.directive('grouplist', function() {
	return {
		restrict: 'EA', // has to be an attribute to work with core css
		scope: {},
		controller: 'grouplistCtrl',
		controllerAs: 'ctrl',
		bindToController: {},
		templateUrl: OC.linkTo('contactsrework', 'templates/groupList.html')
	};
});

app.factory('AddressBook', function()
{
	return function AddressBook(data) {
		angular.extend(this, {

			displayName: "",
			contacts: [],
			groups: data.data.props.groups,

			getContact: function(uid) {
				for(var i in this.contacts) {
					if(this.contacts[i].uid() === uid) {
						return this.contacts[i];
					}
				}
				return undefined;
			}

		});
		angular.extend(this, data);
	};
});
app.factory('Contact', [ '$filter', function($filter) {
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
					var property = this.getProperty('fn');
					if(property) {
						return property.value;
					} else {
						return undefined;
					}
				}
			},

			email: function(value) {
				if (angular.isDefined(value)) {
					// setter
					return this.setProperty('email', { value: value });
				} else {
					// getter
					var property = this.getProperty('email');
					if(property) {
						return property.value;
					} else {
						return undefined;
					}
				}
			},

			categories: function(value) {
				if (angular.isDefined(value)) {
					// setter
					return this.setProperty('categories', { value: value });
				} else {
					// getter
					var property = this.getProperty('categories');
					if(property) {
						return property.value.split(',');
					} else {
						return [];
					}
				}
			},

			getProperty: function(name) {
				if (this.props[name]) {
					return this.props[name][0];
				} else {
					return undefined;
				}
			},

			setProperty: function(name, data) {
				if(!this.props[name]) {
					this.props[name] = [];
				}
				this.props[name][0] = data;

				// keep vCard in sync
				this.data.addressData = $filter('JSON2vCard')(this.props);
			},

			delete: function() {
				console.log('deleting...');
			},

			setETag: function(etag) {
				this.data.etag = etag;
			},

			setUrl: function(addressBook, uid) {
				this.data.url = addressBook.url + uid + ".vcf";
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

		console.log('create');

		if(angular.isDefined(vCard)) {
			angular.extend(this.data, vCard);
			angular.extend(this.props, $filter('vCard2JSON')(this.data.addressData));
		} else {
			angular.extend(this.props, {
				version: [{value: "4.0"}],
				fn: [{value: "Max Mustermann"}]
			});
			this.data.addressData = $filter('JSON2vCard')(this.props);
		}
	};
}]);

app.factory('AddressBookService', ['DavClient', 'DavService', 'SettingsService', 'AddressBook', 'Contact', function(DavClient, DavService, SettingsService, AddressBook, Contact){

	var addressBooks = [];

	var loadAll = function() {
		return DavService.then(function(account) {
			addressBooks = account.addressBooks.map(function(addressBook) {
				return new AddressBook(addressBook);
			});
		});
	};

	return {
		getAll: function() {
			return loadAll().then(function() {
				console.log(addressBooks);
				return addressBooks;
			});
		},

		getGroups: function () {
			return this.getAll().then(function(addressBooks){
				return ['All'].concat(
					addressBooks.map(function (element) {
						return element.groups;
					}).reduce(function(a, b){
						return a.concat(b);
					}));
			});
		},

		getEnabled: function() {
			return DavService.then(function(account) {
				return account.addressBooks.filter(function(addressBook) {
					return SettingsService.get('addressBooks').indexOf(addressBook.displayName) > -1;
				}).map(function(addressBook) {
					return new AddressBook(addressBook);
				});
			});
		},

		getDefaultAddressBook: function() {
			return addressBooks[0];
		},

		create: function(displayName) {
			return DavService.then(function(account) {
				return DavClient.createAddressBook({displayName:displayName, url:account.homeUrl});
			});
		},

		delete: function(addressBook) {
			return DavService.then(function(account) {
				return DavClient.deleteAddressBook(addressBook);
			});
		},

		rename: function(addressBook, displayName) {
			return DavService.then(function(account) {
				return DavClient.renameAddressBook(addressBook, {displayName:displayName, url:account.homeUrl});
			});
		},

		get: function(displayName) {
			return this.getAll().then(function(addressBooks){
				return addressBooks.filter(function (element) {
					return element.displayName === displayName;
				})[0];
			});
		},

		sync: function(addressBook) {
			return DavClient.syncAddressBook(addressBook);/*.then(function(addressBook) {

				// parse contacts
				addressBook.contacts = [];
				for(var i in addressBook.objects) {
					if(typeof addressBook.objects[i] === 'object') {
						addressBook.contacts.push(
							new Contact(addressBook.objects[i])
						);
					}
				}
				return addressBook;
			});*/
		}
	};

}]);

var contacts;
app.service('ContactService', [ 'DavClient', 'AddressBookService', 'Contact', '$q', 'CacheFactory', 'uuid4', function(DavClient, AddressBookService, Contact, $q, CacheFactory, uuid4) {

	var cacheFilled = false;

	contacts = CacheFactory('contacts');

	var observerCallbacks = [];

	this.registerObserverCallback = function(callback) {
		observerCallbacks.push(callback);
	};

	var notifyObservers = function() {
		angular.forEach(observerCallbacks, function(callback){
			callback(contacts.values());
		});
	};

	this.fillCache = function() {
		return AddressBookService.getEnabled().then(function(enabledAddressBooks) {
			var promises = [];
			enabledAddressBooks.forEach(function(addressBook) {
				promises.push(
					AddressBookService.sync(addressBook).then(function(addressBook) {
						for(var i in addressBook.objects) {
							contact = new Contact(addressBook.objects[i]);
							contacts.put(contact.uid(), contact);
						}
					})
				);
			});
			return $q.all(promises).then(function() {
				cacheFilled = true;
			});
		});
	};

	this.getAll = function() {
		if(cacheFilled === false) {
			return this.fillCache().then(function() {
				return contacts.values();
			});
		} else {
			return $q.when(contacts.values());
		}

	};

	this.getGroups = function () {
		return this.getAll().then(function(contacts){
			var groups = _.uniq(contacts.map(function (element) {
				return element.categories();
			}).reduce(function(a, b){
				return a.concat(b);
			}).sort(), true);
			return ['All'].concat(groups);
		});
	};

	this.getById = function(uid) {
		if(cacheFilled === false) {
			return this.fillCache().then(function() {
				return contacts.get(uid);
			});
		} else {
			return $q.when(contacts.get(uid));
		}
	};

	this.create = function(newContact, addressBook) {
		newContact = newContact || new Contact();
		addressBook = addressBook || AddressBookService.getDefaultAddressBook();
		var newUid = uuid4.generate();
		newContact.uid(newUid);
		newContact.setUrl(addressBook, newUid);

		return DavClient.createCard(
			addressBook,
			{
				data: newContact.data.addressData,
				filename: newUid + '.vcf'
			}
		).then(function(xhr) {
			newContact.setETag(xhr.getResponseHeader('ETag'));
			contacts.put(newUid, newContact);
			notifyObservers();
			return newContact;
		}).catch(function(e) {
			console.log("Couldn't create", e);
		});
	};

	this.update = function(contact) {
		// update contact on server
		return DavClient.updateCard(contact.data, {json: true}).then(function(xhr){
			var newEtag = xhr.getResponseHeader('ETag');
			contact.setETag(newEtag);
		});
	};

	this.delete = function(contact) {
		// delete contact from server
		return DavClient.deleteCard(contact.data).then(function(xhr) {
			contacts.remove(contact.uid());
			notifyObservers();
		});
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
		server: OC.linkToRemoteBase('dav/addressbooks'),
		accountType: 'carddav'
	});
}]);

app.service('SettingsService', function() {
	var settings = {
		addressBooks: [
			"testAddr"
		]
	};

	this.set = function(key, value) {
		settings[key] = value;
	};

	this.get = function(key) {
		return settings[key];
	};

	this.getAll = function() {
		return settings;
	};
});

app.filter('JSON2vCard', function() {
	return function(input) {
		return vCard.generate(input);
	};
});
app.filter('contactColor', function() {
	return function(input) {
		var colors = [
			'#001f3f',
			'#0074D9',
			'#39CCCC',
			'#3D9970',
			'#2ECC40',
			'#FF851B',
			'#FF4136',
			'#85144b',
			'#F012BE',
			'#B10DC9'
		], asciiSum = 0;
		for(var i in input) {
			asciiSum += input.charCodeAt(i);
		}
		return colors[asciiSum % colors.length];
	};
});

app.filter('contactGroupFilter', [
	function() {
		'use strict';
		return function (contacts, group) {
			if (typeof contacts === "undefined") {
				return contacts;
			}
			if (typeof group === "undefined" || group.toLowerCase() === 'all') {
				return contacts;
			}
			var filter = [];
			if (contacts.length > 0) {
				for (var i = 0; i < contacts.length; i++) {
					if (contacts[i].categories().indexOf(group) >= 0) {
						filter.push(contacts[i]);
					}
				}
			}
			return filter;
		};
	}
]);

app.filter('firstCharacter', function() {
	return function(input) {
		return input.charAt(0);
	};
});

app.filter('vCard2JSON', function() {
	return function(input) {
		return vCard.parse(input);
	};
});