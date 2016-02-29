/**
 * ownCloud - contacts
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Hendrik Leppelsack <hendrik@leppelsack.de>
 * @copyright Hendrik Leppelsack 2015
 */

var app = angular.module('contactsApp', ['uuid4', 'angular-cache', 'ngRoute', 'ui.bootstrap']);

app.config(['$routeProvider', function($routeProvider){

	$routeProvider.when("/:gid", {
		template: '<contactdetails></contactdetails>'
	});

	$routeProvider.when("/:gid/:uid", {
		template: '<contactdetails></contactdetails>'
	});

	$routeProvider.otherwise("/" + t('contacts', 'All contacts'));

}]);

app.controller('addressbookCtrl', ['$scope', 'AddressBookService', function($scope, AddressBookService) {
	var ctrl = this;
	console.log(this);

	ctrl.toggleSharesEditor = function(addressBook) {
		addressBook.editingShares = !addressBook.editingShares;
		addressBook.selectedSharee = null;
	};

	/* From Calendar-Rework - js/app/controllers/calendarlistcontroller.js */
	ctrl.findSharee = function (val, addressBook) {
		return $.get(
				OC.linkToOCS('apps/files_sharing/api/v1') + 'sharees',
				{
					format: 'json',
					search: val.trim(),
					perPage: 200,
					itemType: 'principals'
				}
		).then(function(result) {
			// Todo - filter out current user, existing sharees
			var users   = result.ocs.data.exact.users.concat(result.ocs.data.users);
			var groups  = result.ocs.data.exact.groups.concat(result.ocs.data.groups);

			var userShares = addressBook.sharedWith.users;
			var groupShares = addressBook.sharedWith.groups;
			var userSharesLength = userShares.length;
			var groupSharesLength = groupShares.length;
			var i, j;

			// Filter out current user
			var usersLength = users.length;
			for (i = 0 ; i < usersLength; i++) {
				if (users[i].value.shareWith === OC.currentUser) {
					users.splice(i, 1);
					break;
				}
			}

			// Now filter out all sharees that are already shared with
			for (i = 0; i < userSharesLength; i++) {
				var share = userShares[i];
				usersLength = users.length;
				for (j = 0; j < usersLength; j++) {
					if (users[j].value.shareWith === share.id) {
						users.splice(j, 1);
						break;
					}
				}
			}

			// Combine users and groups
			users = users.map(function(item){
				return {
					display: item.value.shareWith,
					type: OC.Share.SHARE_TYPE_USER,
					identifier: item.value.shareWith
				};
			});

			groups = groups.map(function(item){
				return {
					display: item.value.shareWith + ' (group)',
					type: OC.Share.SHARE_TYPE_GROUP,
					identifier: item.value.shareWith
				};
			});

			return groups.concat(users);
		});
	};

	ctrl.onSelectSharee = function (item, model, label, addressBook) {
		ctrl.addressBook.selectedSharee = null;
		AddressBookService.share(addressBook, item.type, item.identifier, false, false).then(function() {
			$scope.$apply();
		});

	};

	ctrl.updateExistingUserShare = function(addressBook, userId, writable) {
		AddressBookService.share(addressBook, OC.Share.SHARE_TYPE_USER, userId, writable, true).then(function() {
			$scope.$apply();
		});
	};

	ctrl.updateExistingGroupShare = function(calendar, groupId, writable) {
		AddressBookService.share(addressBook, OC.Share.SHARE_TYPE_GROUP, groupId, writable, true).then(function() {
			$scope.$apply();
		});
	};

	ctrl.unshareFromUser = function(addressBook, userId) {
		AddressBookService.unshare(addressBook, OC.Share.SHARE_TYPE_USER, userId).then(function() {
			$scope.$apply();
		});
	};

	ctrl.unshareFromGroup = function(addressBook, groupId) {
		AddressBookService.unshare(addressBook, OC.Share.SHARE_TYPE_GROUP, groupId).then(function() {
			$scope.$apply();
		});
	};

}]);

app.directive('addressbook', function() {
	return {
		restrict: 'A', // has to be an attribute to work with core css
		scope: {},
		controller: 'addressbookCtrl',
		controllerAs: 'ctrl',
		bindToController: {
			addressBook: "=data"
		},
		templateUrl: OC.linkTo('contacts', 'templates/addressBook.html')
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
		templateUrl: OC.linkTo('contacts', 'templates/addressBookList.html')
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
		templateUrl: OC.linkTo('contacts', 'templates/contact.html')
	};
});

app.controller('contactdetailsCtrl', ['ContactService', 'vCardPropertiesService', '$routeParams', '$scope', function(ContactService, vCardPropertiesService, $routeParams, $scope) {
	var ctrl = this;

	ctrl.uid = $routeParams.uid;
	ctrl.t = {
		noContacts : t('contacts', 'No contacts in here'),
		placeholderName : t('contacts', 'Name')
	};

	ctrl.fieldDefinitions = vCardPropertiesService.fieldDefinitions;

	$scope.$watch('ctrl.uid', function(newValue, oldValue) {
		ctrl.changeContact(newValue);
	});

	ctrl.changeContact = function(uid) {
		if (typeof uid === "undefined") {
			return;
		}
		ContactService.getById(uid).then(function(contact) {
			ctrl.contact = contact;
			ctrl.singleProperties = ctrl.contact.getSingleProperties();
			ctrl.photo = ctrl.contact.photo();
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

	ctrl.addField = function(field) {
		ctrl.contact.setProperty(field, {value: ''});
		ctrl.singleProperties = ctrl.contact.getSingleProperties();
	}
}]);

app.directive('contactdetails', function() {
	return {
		priority: 1,
		scope: {},
		controller: 'contactdetailsCtrl',
		controllerAs: 'ctrl',
		bindToController: {},
		templateUrl: OC.linkTo('contacts', 'templates/contactDetails.html')
	};
});

app.controller('contactlistCtrl', ['$scope', '$filter', '$route', '$routeParams', 'ContactService', function($scope, $filter, $route, $routeParams, ContactService) {
	var ctrl = this;

	ctrl.routeParams = $routeParams;
	ctrl.t = {
		addContact : t('contacts', 'Add contact')
	};

	ctrl.contactList = [];

	ContactService.registerObserverCallback(function(ev) {
		$scope.$apply(function() {
			if (ev.event === 'delete') {
				if (ctrl.contactList.length === 1) {
					$route.updateParams({
						gid: $routeParams.gid,
						uid: undefined
					});
				} else {
					for (var i = 0, length = ctrl.contactList.length; i < length; i++) {
						if (ctrl.contactList[i].uid() === ev.uid) {
							$route.updateParams({
								gid: $routeParams.gid,
								uid: (ctrl.contactList[i+1]) ? ctrl.contactList[i+1].uid() : ctrl.contactList[i-1].uid()
							});
							break;
						}
					}
				}
			}
			ctrl.contacts = ev.contacts;
		});
	});

	ContactService.getAll().then(function(contacts) {
		$scope.$apply(function(){
			ctrl.contacts = contacts;
		});
	});

	$scope.$watch('ctrl.routeParams.uid', function(newValue) {
		if(newValue === undefined) {
			// we might have to wait until ng-repeat filled the contactList
			if(ctrl.contactList && ctrl.contactList.length > 0) {
				$route.updateParams({
					gid: $routeParams.gid,
					uid: ctrl.contactList[0].uid()
				});
			} else {
				// watch for next contactList update
				var unbindWatch = $scope.$watch('ctrl.contactList', function() {
					if(ctrl.contactList && ctrl.contactList.length > 0) {
						$route.updateParams({
							gid: $routeParams.gid,
							uid: ctrl.contactList[0].uid()
						});
					}
					unbindWatch(); // unbind as we only want one update
				});
			}
		}
	});

	$scope.$watch('ctrl.routeParams.gid', function() {
		// we might have to wait until ng-repeat filled the contactList
		ctrl.contactList = [];
		// watch for next contactList update
		var unbindWatch = $scope.$watch('ctrl.contactList', function() {
			if(ctrl.contactList && ctrl.contactList.length > 0) {
				$route.updateParams({
					gid: $routeParams.gid,
					uid: ctrl.contactList[0].uid()
				});
			}
			unbindWatch(); // unbind as we only want one update
		});
	});

	ctrl.createContact = function() {
		ContactService.create();
	};

	ctrl.hasContacts = function () {
		if (!ctrl.contacts) {
			return false;
		}
		return ctrl.contacts.length > 0;
	};

	$scope.selectedContactId = $routeParams.uid;
	$scope.setSelected = function (selectedContactId) {
		$scope.selectedContactId = selectedContactId;
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
		templateUrl: OC.linkTo('contacts', 'templates/contactList.html')
	};
});

app.controller('detailsItemCtrl', ['$templateRequest', 'vCardPropertiesService', function($templateRequest, vCardPropertiesService) {
	var ctrl = this;

    ctrl.meta = vCardPropertiesService.getMeta(ctrl.name);
    ctrl.t = {
        country : t('contacts', 'Country'),
    };

    ctrl.availableOptions = ctrl.meta.options || [];
    if (!_.isUndefined(ctrl.data.meta)) {
        if (!ctrl.availableOptions.some(function(e){ return e.id === ctrl.data.meta.type[0];})) {
            ctrl.availableOptions = ctrl.availableOptions.concat([{id: ctrl.data.meta.type[0], name: ctrl.data.meta.type[0]}]);
        }
    }

    console.log(ctrl);

    ctrl.getTemplate = function() {
        var templateUrl = OC.linkTo('contacts', 'templates/detailItems/'+ ctrl.meta.template +'.html');
        return $templateRequest(templateUrl);
    };
}]);

app.directive('detailsitem', ['$compile', function($compile) {
	return {
		scope: {},
		controller: 'detailsItemCtrl',
		controllerAs: 'ctrl',
		bindToController: {
			name: '=',
			data: '=',
			model: '='
		},
		link: function(scope, element, attrs, ctrl) {
			ctrl.getTemplate().then(function(html) {
				var template = angular.element(html);
				element.append(template);
				$compile(template)(scope);
			});
		}
	};
}]);

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
			group: "=data"
		},
		templateUrl: OC.linkTo('contacts', 'templates/group.html')
	};
});

app.controller('grouplistCtrl', ['$scope', 'ContactService', '$routeParams', function($scope, ContactService, $routeParams) {

	$scope.groups = [t('contacts', 'All contacts')];

	ContactService.getGroups().then(function(groups) {
		$scope.groups = groups;
	});

	$scope.selectedGroup = $routeParams.gid;
	$scope.setSelected = function (selectedGroup) {
		$scope.selectedGroup = selectedGroup;
	};
}]);

app.directive('grouplist', function() {
	return {
		restrict: 'EA', // has to be an attribute to work with core css
		scope: {},
		controller: 'grouplistCtrl',
		controllerAs: 'ctrl',
		bindToController: {},
		templateUrl: OC.linkTo('contacts', 'templates/groupList.html')
	};
});

app.directive('telModel', function(){
    return{
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, element, attr, ngModel) {
            ngModel.$formatters.push(function(value) {
                return value;
            });
            ngModel.$parsers.push(function(value) {
                return value;
            });
        }
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
			},

			sharedWith: {
				users: [],
				groups: []
			}

		});
		angular.extend(this, data);
		angular.extend(this, {
			owner: data.url.split('/').slice(-3, -2)[0]
		});

		var shares = this.data.props.invite;
		if (typeof shares !== 'undefined') {
			for (var j=0; j < shares.length; j++) {
				var href = shares[j].href;
				if (href.length === 0) {
					continue;
				}
				var access = shares[j].access;
				if (access.length === 0) {
					continue;
				}

				var readWrite = (typeof access.readWrite !== 'undefined');

				if (href.startsWith('principal:principals/users/')) {
					this.sharedWith.users.push({
						id: href.substr(27),
						displayname: href.substr(27),
						writable: readWrite
					});
				} else if (href.startsWith('principal:principals/groups/')) {
					this.sharedWith.groups.push({
						id: href.substr(28),
						displayname: href.substr(28),
						writable: readWrite
					});
				}
			}
		}

		//var owner = this.data.props.owner;
		//if (typeof owner !== 'undefined' && owner.length !== 0) {
		//	owner = owner.trim();
		//	if (owner.startsWith('/remote.php/dav/principals/users/')) {
		//		this._properties.owner = owner.substr(33);
		//	}
		//}

	};
});

app.factory('Contact', [ '$filter', function($filter) {
	return function Contact(vCard) {
		angular.extend(this, {

			data: {},
			props: {},

			getSingleProperties: function() {
				var singleProperties = [];
				for(var prop in this.props) {
					if(this.props.hasOwnProperty(prop)) {
						this.props[prop].forEach(function(propData) {
							singleProperties.push({ name: prop, data: propData });
						});
					}
				}
				console.log('!!!', singleProperties);
				return singleProperties;
			},

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

			photo: function() {
				var property = this.getProperty('photo');
				if(property) {
					return property.value;
				} else {
					return undefined;
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
			},

			syncVCard: function() {
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
				return [t('contacts', 'All contacts')].concat(
					addressBooks.map(function (element) {
						return element.groups;
					}).reduce(function(a, b){
						return a.concat(b);
					}));
			});
		},

		getEnabled: function() {
			return DavService.then(function(account) {
				return account.addressBooks.map(function(addressBook) {
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
		},

		share: function(addressBook, shareType, shareWith, writable, existingShare) {
			var xmlDoc = document.implementation.createDocument('', '', null);
			var oShare = xmlDoc.createElement('o:share');
			oShare.setAttribute('xmlns:d', 'DAV:');
			oShare.setAttribute('xmlns:o', 'http://owncloud.org/ns');
			xmlDoc.appendChild(oShare);

			var oSet = xmlDoc.createElement('o:set');
			oShare.appendChild(oSet);

			var dHref = xmlDoc.createElement('d:href');
			if (shareType === OC.Share.SHARE_TYPE_USER) {
				dHref.textContent = 'principal:principals/users/';
			} else if (shareType === OC.Share.SHARE_TYPE_GROUP) {
				dHref.textContent = 'principal:principals/groups/';
			}
			dHref.textContent += shareWith;
			oSet.appendChild(dHref);

			var oSummary = xmlDoc.createElement('o:summary');
			oSummary.textContent = t('contacts', '{addressbook} shared by {owner}', {
				addressbook: addressBook.displayName,
				owner: addressBook.owner
			});
			oSet.appendChild(oSummary);

			if (writable) {
				var oRW = xmlDoc.createElement('o:read-write');
				oSet.appendChild(oRW);
			}

			var body = oShare.outerHTML;

			return DavClient.xhr.send(
				dav.request.basic({method: 'POST', data: body}),
				addressBook.url
			).then(function(response) {
				if (response.status === 200) {
					if (!existingShare) {
						if (shareType === OC.Share.SHARE_TYPE_USER) {
							addressBook.sharedWith.users.push({
								id: shareWith,
								displayname: shareWith,
								writable: writable
							});
						} else if (shareType === OC.Share.SHARE_TYPE_GROUP) {
							addressBook.sharedWith.groups.push({
								id: shareWith,
								displayname: shareWith,
								writable: writable
							});
						}
					}
				}
			});

		},

		unshare: function(addressBook, shareType, shareWith) {
			var xmlDoc = document.implementation.createDocument('', '', null);
			var oShare = xmlDoc.createElement('o:share');
			oShare.setAttribute('xmlns:d', 'DAV:');
			oShare.setAttribute('xmlns:o', 'http://owncloud.org/ns');
			xmlDoc.appendChild(oShare);

			var oRemove = xmlDoc.createElement('o:remove');
			oShare.appendChild(oRemove);

			var dHref = xmlDoc.createElement('d:href');
			if (shareType === OC.Share.SHARE_TYPE_USER) {
				dHref.textContent = 'principal:principals/users/';
			} else if (shareType === OC.Share.SHARE_TYPE_GROUP) {
				dHref.textContent = 'principal:principals/groups/';
			}
			dHref.textContent += shareWith;
			oRemove.appendChild(dHref);
			var body = oShare.outerHTML;


			return DavClient.xhr.send(
				dav.request.basic({method: 'POST', data: body}),
				addressBook.url
			).then(function(response) {
				if (response.status === 200) {
					if (shareType === OC.Share.SHARE_TYPE_USER) {
						addressBook.sharedWith.users = addressBook.sharedWith.users.filter(function(user) {
							return user.id !== shareWith;
						});
					} else if (shareType === OC.Share.SHARE_TYPE_GROUP) {
						addressBook.sharedWith.groups = addressBook.sharedWith.groups.filter(function(groups) {
							return groups.id !== shareWith;
						});
					}
					//todo - remove entry from addressbook object
					return true;
				} else {
					return false;
				}
			});

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

	var notifyObservers = function(eventName, uid) {
		var ev = {
			event: eventName,
			uid: uid,
			contacts: contacts.values()
		};
		angular.forEach(observerCallbacks, function(callback){
			callback(ev);
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
			return [t('contacts', 'All contacts')].concat(groups);
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
			notifyObservers('create', newUid);
			return newContact;
		}).catch(function(e) {
			console.log("Couldn't create", e);
		});
	};

	this.update = function(contact) {
		contact.syncVCard();

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
			notifyObservers('delete', contact.uid());
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
		accountType: 'carddav',
		useProvidedPath: true
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

app.service('vCardPropertiesService', [function() {
	/* map vCard attributes to internal attributes */
	this.vCardMeta = {
		nickname: {
			readableName: t('contacts', 'Nickname'),
			template: 'text'
		},
		org: {
			readableName: t('contacts', 'Organisation'),
			template: 'text'
		},
		note: {
			readableName: t('contacts', 'Note'),
			template: 'textarea'
		},
		url: {
			readableName: t('contacts', 'Url'),
			template: 'url'
		},
		title: {
			readableName: t('contacts', 'Title'),
			template: 'text'
		},
		role: {
			readableName: t('contacts', 'Role'),
			template: 'text'
		},
		adr: {
			readableName: t('contacts', 'Address'),
			template: 'adr',
			options: [
				{id: 'HOME', name: t('contacts', 'Home')},
				{id: 'WORK', name: t('contacts', 'Work')},
				{id: 'OTHER', name: t('contacts', 'Other')}
			]
		},
		categories: {
			readableName: t('contacts', 'Categories'),
			template: 'text'
		},
		bday: {
			readableName: t('contacts', 'Birthday'),
			template: 'date'
		},
		email: {
			readableName: t('contacts', 'E-Mail'),
			template: 'date'
		},
		impp: {
			readableName: t('contacts', 'Instant Messaging'),
			template: 'date'
		},
		tel: {
			readableName: t('contacts', 'Telephone'),
			template: 'tel',
			options: [
				{id: 'HOME,VOICE', name: t('contacts', 'Home, voice')},
				{id: 'WORK,VOICE', name: t('contacts', 'Work, voice')},
				{id: 'HOME,FAX', name: t('contacts', 'Home, fax')},
				{id: 'WORK,FAX', name: t('contacts', 'Work, fax')},
				{id: 'PAGER', name: t('contacts', 'Pager')},
				{id: 'VOICE', name: t('contacts', 'Voice')},
				{id: 'FAX', name: t('contacts', 'Fax')},
				{id: 'CELL', name: t('contacts', 'Mobile')}
			]
		}
	};

	this.fieldDefinitions = [];
	for (var prop in this.vCardMeta) {
		this.fieldDefinitions.push({id: prop, name: this.vCardMeta[prop].readableName});
	}

	this.fallbackMeta = function(property) {
		function capitalize(string) { return string.charAt(0).toUpperCase() + string.slice(1); }
		return {
			name: "unknown-" + property,
			readableName: capitalize(property),
			template: 'hidden',
			necessity: 'optional'
		};
	};

	this.getMeta = function(property) {
		return this.vCardMeta[property] || this.fallbackMeta(property);
	};

}]);

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
			if (typeof group === "undefined" || group.toLowerCase() === t('contacts', 'All contacts').toLowerCase()) {
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