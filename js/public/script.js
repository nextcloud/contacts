/**
 * ownCloud - contacts
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Hendrik Leppelsack <hendrik@leppelsack.de>
 * @copyright Hendrik Leppelsack 2015
 */

var app = angular.module('contactsApp', ['uuid4', 'angular-cache', 'ngRoute', 'ui.bootstrap', 'ui.select', 'ngSanitize']);

app.config(['$routeProvider', function($routeProvider) {

	$routeProvider.when('/:gid', {
		template: '<contactdetails></contactdetails>'
	});

	$routeProvider.when('/:gid/:uid', {
		template: '<contactdetails></contactdetails>'
	});

	$routeProvider.otherwise('/' + t('contacts', 'All contacts'));

}]);

app.directive('datepicker', function() {
	return {
		restrict: 'A',
		require : 'ngModel',
		link : function (scope, element, attrs, ngModelCtrl) {
			$(function() {
				element.datepicker({
					dateFormat:'yy-mm-dd',
					minDate: null,
					maxDate: null,
					onSelect:function (date) {
						ngModelCtrl.$setViewValue(date);
						scope.$apply();
					}
				});
			});
		}
	};
});

app.directive('focusExpression', ['$timeout', function ($timeout) {
	return {
		restrict: 'A',
		link: {
			post: function postLink(scope, element, attrs) {
				scope.$watch(attrs.focusExpression, function (value) {

					if (attrs.focusExpression) {
						if (scope.$eval(attrs.focusExpression)) {
							$timeout(function () {
								if (element.is('input')) {
									element.focus();
								} else {
									element.find('input').focus();
								}
							}, 100); //need some delay to work with ng-disabled
						}
					}
				});
			}
		}
	};
}]);

app.controller('addressbookCtrl', ['$scope', 'AddressBookService', function($scope, AddressBookService) {
	var ctrl = this;

	ctrl.urlBase = window.location.protocol + '//' + window.location.host;
	ctrl.showUrl = false;

	ctrl.toggleShowUrl = function() {
		ctrl.showUrl = !ctrl.showUrl;
	};

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
			users = users.map(function(item) {
				return {
					display: item.value.shareWith,
					type: OC.Share.SHARE_TYPE_USER,
					identifier: item.value.shareWith
				};
			});

			groups = groups.map(function(item) {
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

	ctrl.updateExistingGroupShare = function(addressBook, groupId, writable) {
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

	ctrl.deleteAddressBook = function(addressBook) {
		AddressBookService.delete(addressBook).then(function() {
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
			addressBook: '=data'
		},
		templateUrl: OC.linkTo('contacts', 'templates/addressBook.html')
	};
});

app.controller('addressbooklistCtrl', ['$scope', 'AddressBookService', 'SettingsService', function($scope, AddressBookService, SettingsService) {
	var ctrl = this;

	AddressBookService.getAll().then(function(addressBooks) {
		ctrl.addressBooks = addressBooks;
	});

	ctrl.createAddressBook = function() {
		if(ctrl.newAddressBookName) {
			AddressBookService.create(ctrl.newAddressBookName).then(function() {
				AddressBookService.getAddressBook(ctrl.newAddressBookName).then(function(addressBook) {
					ctrl.addressBooks.push(addressBook);
					$scope.$apply();
				});
			});
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

app.controller('contactdetailsCtrl', ['ContactService', 'AddressBookService', 'vCardPropertiesService', '$routeParams', '$scope', function(ContactService, AddressBookService, vCardPropertiesService, $routeParams, $scope) {
	var ctrl = this;

	ctrl.uid = $routeParams.uid;
	ctrl.t = {
		noContacts : t('contacts', 'No contacts in here'),
		placeholderName : t('contacts', 'Name'),
		placeholderOrg : t('contacts', 'Organization'),
		placeholderTitle : t('contacts', 'Title'),
		selectField : t('contacts', 'Add field ...')
	};

	ctrl.fieldDefinitions = vCardPropertiesService.fieldDefinitions;
	ctrl.focus = undefined;
	ctrl.field = undefined;
	$scope.addressBooks = [];
	ctrl.addressBooks = [];

	AddressBookService.getAll().then(function(addressBooks) {
		ctrl.addressBooks = addressBooks;
		$scope.addressBooks = addressBooks.map(function (element) {
			return {
				id: element.displayName,
				name: element.displayName
			};
		});
		if (!_.isUndefined(ctrl.contact)) {
			$scope.addressBook = _.find($scope.addressBooks, function(book) {
				return book.id === ctrl.contact.addressBookId;
			});
		}
	});

	$scope.$watch('ctrl.uid', function(newValue, oldValue) {
		ctrl.changeContact(newValue);
	});

	ctrl.changeContact = function(uid) {
		if (typeof uid === 'undefined') {
			return;
		}
		ContactService.getById(uid).then(function(contact) {
			ctrl.contact = contact;
			ctrl.photo = ctrl.contact.photo();
			$scope.addressBook = _.find($scope.addressBooks, function(book) {
				return book.id === ctrl.contact.addressBookId;
			});
		});
	};

	ctrl.updateContact = function() {
		ContactService.update(ctrl.contact);
	};

	ctrl.deleteContact = function() {
		ContactService.delete(ctrl.contact);
	};

	ctrl.addField = function(field) {
		var defaultValue = vCardPropertiesService.getMeta(field).defaultValue || {value: ''};
		ctrl.contact.addProperty(field, defaultValue);
		ctrl.focus = field;
		ctrl.field = '';
	};

	ctrl.deleteField = function (field, prop) {
		ctrl.contact.removeProperty(field, prop);
		ctrl.focus = undefined;
	};

	ctrl.changeAddressBook = function (addressBook) {
		addressBook = _.find(ctrl.addressBooks, function(book) {
			return book.displayName === addressBook.id;
		});
		ContactService.moveContact(ctrl.contact, addressBook);
	};
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

app.controller('contactlistCtrl', ['$scope', '$filter', '$route', '$routeParams', 'ContactService', 'vCardPropertiesService', function($scope, $filter, $route, $routeParams, ContactService, vCardPropertiesService) {
	var ctrl = this;

	ctrl.routeParams = $routeParams;
	ctrl.t = {
		addContact : t('contacts', 'Add contact')
	};

	ctrl.contactList = [];
	ctrl.query = '';

	$scope.query = function(contact) {
		return contact.matches(ctrl.query);
	};

	SearchProxy.setFilter(function(query) {
		ctrl.query = query.toLowerCase();
		$scope.$apply();
	});

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
			else if (ev.event === 'create') {
				$route.updateParams({
					gid: $routeParams.gid,
					uid: ev.uid
				});
			}
			ctrl.contacts = ev.contacts;
		});
	});

	ContactService.getAll().then(function(contacts) {
		$scope.$apply(function() {
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
		ContactService.create().then(function(contact) {
			['tel', 'adr', 'email'].forEach(function(field) {
				var defaultValue = vCardPropertiesService.getMeta(field).defaultValue || {value: ''};
				contact.addProperty(field, defaultValue);
			} );
			if ($routeParams.gid !== t('contacts', 'All contacts')) {
				contact.categories($routeParams.gid);
			} else {
				contact.categories('');
			}
			$('#details-fullName').focus();
		});
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

app.controller('detailsItemCtrl', ['$templateRequest', 'vCardPropertiesService', 'ContactService', function($templateRequest, vCardPropertiesService, ContactService) {
	var ctrl = this;

	ctrl.meta = vCardPropertiesService.getMeta(ctrl.name);
	ctrl.type = undefined;
	ctrl.t = {
		poBox : t('contacts', 'Post Office Box'),
		postalCode : t('contacts', 'Postal Code'),
		city : t('contacts', 'City'),
		state : t('contacts', 'State or province'),
		country : t('contacts', 'Country'),
		address: t('contacts', 'Address'),
		newGroup: t('contacts', '(new group)')
	};

	ctrl.availableOptions = ctrl.meta.options || [];
	if (!_.isUndefined(ctrl.data) && !_.isUndefined(ctrl.data.meta) && !_.isUndefined(ctrl.data.meta.type)) {
		ctrl.type = ctrl.data.meta.type[0];
		if (!ctrl.availableOptions.some(function(e) { return e.id === ctrl.data.meta.type[0]; } )) {
			ctrl.availableOptions = ctrl.availableOptions.concat([{id: ctrl.data.meta.type[0], name: ctrl.data.meta.type[0]}]);
		}
	}
	ctrl.availableGroups = [];

	ContactService.getGroups().then(function(groups) {
		ctrl.availableGroups = _.unique(groups);
	});

	ctrl.changeType = function (val) {
		ctrl.data.meta = ctrl.data.meta || {};
		ctrl.data.meta.type = ctrl.data.meta.type || [];
		ctrl.data.meta.type[0] = val;
		ctrl.model.updateContact();
	};

	ctrl.getTemplate = function() {
		var templateUrl = OC.linkTo('contacts', 'templates/detailItems/' + ctrl.meta.template + '.html');
		return $templateRequest(templateUrl);
	};

	ctrl.deleteField = function () {
		ctrl.model.deleteField(ctrl.name, ctrl.data);
		ctrl.model.updateContact();
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

app.controller('detailsPhotoCtrl', function() {
	var ctrl = this;
});

app.directive('detailsphoto', function() {
	return {
		scope: {},
		controller: 'detailsPhotoCtrl',
		controllerAs: 'ctrl',
		bindToController: {
			contact: '=data'
		},
		templateUrl: OC.linkTo('contacts', 'templates/detailsPhoto.html')
	};
});

app.controller('groupCtrl', function() {
	var ctrl = this;
});

app.directive('group', function() {
	return {
		restrict: 'A', // has to be an attribute to work with core css
		scope: {},
		controller: 'groupCtrl',
		controllerAs: 'ctrl',
		bindToController: {
			group: '=data'
		},
		templateUrl: OC.linkTo('contacts', 'templates/group.html')
	};
});

app.controller('grouplistCtrl', ['$scope', 'ContactService', '$routeParams', function($scope, ContactService, $routeParams) {

	$scope.groups = [t('contacts', 'All contacts')];

	ContactService.getGroups().then(function(groups) {
		$scope.groups = _.unique([t('contacts', 'All contacts')].concat(groups));
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

app.controller('imagePreviewCtrl', ['$scope', function($scope) {
	var ctrl = this;

	ctrl.loadImage = function(file) {
		var reader = new FileReader();

		reader.addEventListener('load', function () {
			$scope.$apply(function() {
				$scope.imagepreview = reader.result;
			});
		}, false);

		if (file) {
			reader.readAsDataURL(file);
		}
	};
}]);

app.directive('imagepreview', function() {
	return {
		scope: {
			photoCallback: '&imagepreview'
		},
		link: function(scope, element, attrs, ctrl) {
			element.bind('change', function() {
				var file = element.get(0).files[0];
				var reader = new FileReader();

				reader.addEventListener('load', function () {
					console.log('hi', scope.photoCallback() + '');
					scope.$apply(function() {
						scope.photoCallback()(reader.result);
					});
				}, false);

				if (file) {
					reader.readAsDataURL(file);
				}
			});
		}
	};
});

app.directive('groupModel', ['$filter', function($filter) {
	return{
		restrict: 'A',
		require: 'ngModel',
		link: function(scope, element, attr, ngModel) {
			ngModel.$formatters.push(function(value) {
				if (value.trim().length === 0) {
					return [];
				}
				return value.split(',');
			});
			ngModel.$parsers.push(function(value) {
				return value.join(',');
			});
		}
	};
}]);

app.directive('telModel', function() {
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

			displayName: '',
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
			for (var j = 0; j < shares.length; j++) {
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

app.factory('Contact', ['$filter', function($filter) {
	return function Contact(addressBook, vCard) {
		angular.extend(this, {

			data: {},
			props: {},

			addressBookId: addressBook.displayName,

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

			title: function(value) {
				if (angular.isDefined(value)) {
					// setter
					return this.setProperty('title', { value: value });
				} else {
					// getter
					var property = this.getProperty('title');
					if(property) {
						return property.value;
					} else {
						return undefined;
					}
				}
			},

			org: function(value) {
				var property = this.getProperty('org');
				if (angular.isDefined(value)) {
					var val = value;
					// setter
					if(property && Array.isArray(property.value)) {
						val = property.value;
						val[0] = value;
					}
					return this.setProperty('org', { value: val });
				} else {
					// getter
					if(property) {
						if (Array.isArray(property.value)) {
							return property.value[0];
						}
						return property.value;
					} else {
						return undefined;
					}
				}
			},

			email: function() {
				// getter
				var property = this.getProperty('email');
				if(property) {
					return property.value;
				} else {
					return undefined;
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
			addProperty: function(name, data) {
				data = angular.copy(data);
				if(!this.props[name]) {
					this.props[name] = [];
				}
				var idx = this.props[name].length;
				this.props[name][idx] = data;

				// keep vCard in sync
				this.data.addressData = $filter('JSON2vCard')(this.props);
				return idx;
			},
			setProperty: function(name, data) {
				if(!this.props[name]) {
					this.props[name] = [];
				}
				this.props[name][0] = data;

				// keep vCard in sync
				this.data.addressData = $filter('JSON2vCard')(this.props);
			},
			removeProperty: function (name, prop) {
				angular.copy(_.without(this.props[name], prop), this.props[name]);
				this.data.addressData = $filter('JSON2vCard')(this.props);
			},
			setETag: function(etag) {
				this.data.etag = etag;
			},
			setUrl: function(addressBook, uid) {
				this.data.url = addressBook.url + uid + '.vcf';
			},

			syncVCard: function() {
				// keep vCard in sync
				this.data.addressData = $filter('JSON2vCard')(this.props);
			},

			matches: function(pattern) {
				if (_.isUndefined(pattern) || pattern.length === 0) {
					return true;
				}
				return this.data.addressData.toLowerCase().indexOf(pattern.toLowerCase()) !== -1;
			}

		});

		if(angular.isDefined(vCard)) {
			angular.extend(this.data, vCard);
			angular.extend(this.props, $filter('vCard2JSON')(this.data.addressData));
		} else {
			angular.extend(this.props, {
				version: [{value: '3.0'}],
				fn: [{value: ''}]
			});
			this.data.addressData = $filter('JSON2vCard')(this.props);
		}

		var property = this.getProperty('categories');
		if(!property) {
			this.categories('');
		}
	};
}]);

app.factory('AddressBookService', ['DavClient', 'DavService', 'SettingsService', 'AddressBook', 'Contact', function(DavClient, DavService, SettingsService, AddressBook, Contact) {

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
				return addressBooks;
			});
		},

		getGroups: function () {
			return this.getAll().then(function(addressBooks) {
				return addressBooks.map(function (element) {
					return element.groups;
				}).reduce(function(a, b) {
					return a.concat(b);
				});
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

		getAddressBook: function(displayName) {
			return DavService.then(function(account) {
				return DavClient.getAddressBook({displayName:displayName, url:account.homeUrl}).then(function(addressBook) {
					addressBook = new AddressBook({
						url: addressBook[0].href,
						data: addressBook[0]
					});
					addressBook.displayName = displayName;
					return addressBook;
				});
			});
		},

		create: function(displayName) {
			return DavService.then(function(account) {
				return DavClient.createAddressBook({displayName:displayName, url:account.homeUrl});
			});
		},

		delete: function(addressBook) {
			return DavService.then(function(account) {
				return DavClient.deleteAddressBook(addressBook).then(function() {
					angular.copy(_.without(addressBooks, addressBook), addressBooks);
				});
			});
		},

		rename: function(addressBook, displayName) {
			return DavService.then(function(account) {
				return DavClient.renameAddressBook(addressBook, {displayName:displayName, url:account.homeUrl});
			});
		},

		get: function(displayName) {
			return this.getAll().then(function(addressBooks) {
				return addressBooks.filter(function (element) {
					return element.displayName === displayName;
				})[0];
			});
		},

		sync: function(addressBook) {
			return DavClient.syncAddressBook(addressBook);
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
app.service('ContactService', ['DavClient', 'AddressBookService', 'Contact', '$q', 'CacheFactory', 'uuid4', function(DavClient, AddressBookService, Contact, $q, CacheFactory, uuid4) {

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
		angular.forEach(observerCallbacks, function(callback) {
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
							contact = new Contact(addressBook, addressBook.objects[i]);
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
		return this.getAll().then(function(contacts) {
			return _.uniq(contacts.map(function (element) {
				return element.categories();
			}).reduce(function(a, b) {
				return a.concat(b);
			}, []).sort(), true);
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
		addressBook = addressBook || AddressBookService.getDefaultAddressBook();
		newContact = newContact || new Contact(addressBook);
		var newUid = uuid4.generate();
		newContact.uid(newUid);
		newContact.setUrl(addressBook, newUid);
		newContact.addressBookId = addressBook.displayName;

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

	this.moveContact = function (contact, addressbook) {
		if (contact.addressBookId === addressbook.displayName) {
			return;
		}
		contact.syncVCard();
		var clone = angular.copy(contact);

		// create the contact in the new target addressbook
		this.create(clone, addressbook);

		// delete the old one
		this.delete(contact);
	};

	this.update = function(contact) {
		contact.syncVCard();

		// update contact on server
		return DavClient.updateCard(contact.data, {json: true}).then(function(xhr) {
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
app.service('DavService', ['DavClient', function(DavClient) {
	return DavClient.createAccount({
		server: OC.linkToRemoteBase('dav/addressbooks'),
		accountType: 'carddav',
		useProvidedPath: true
	});
}]);

app.service('SettingsService', function() {
	var settings = {
		addressBooks: [
			'testAddr'
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

app.service('vCardPropertiesService', function() {
	/**
	 * map vCard attributes to internal attributes
	 *
	 * propName: {
	 * 		multiple: [Boolean], // is this prop allowed more than once? (default = false)
	 * 		readableName: [String], // internationalized readable name of prop
	 * 		template: [String], // template name found in /templates/detailItems
	 * 		[...] // optional additional information which might get used by the template
	 * }
	 */
	this.vCardMeta = {
		nickname: {
			readableName: t('contacts', 'Nickname'),
			template: 'text'
		},
		note: {
			readableName: t('contacts', 'Notes'),
			template: 'textarea'
		},
		url: {
			multiple: true,
			readableName: t('contacts', 'Website'),
			template: 'url'
		},
		cloud: {
			multiple: true,
			readableName: t('contacts', 'Federated Cloud ID'),
			template: 'text',
			defaultValue: {
				value:[''],
				meta:{type:['HOME']}
			},
			options: [
				{id: 'HOME', name: t('contacts', 'Home')},
				{id: 'WORK', name: t('contacts', 'Work')},
				{id: 'OTHER', name: t('contacts', 'Other')}
			]		},
		adr: {
			multiple: true,
			readableName: t('contacts', 'Address'),
			template: 'adr',
			defaultValue: {
				value:['', '', '', '', '', '', ''],
				meta:{type:['HOME']}
			},
			options: [
				{id: 'HOME', name: t('contacts', 'Home')},
				{id: 'WORK', name: t('contacts', 'Work')},
				{id: 'OTHER', name: t('contacts', 'Other')}
			]
		},
		categories: {
			readableName: t('contacts', 'Groups'),
			template: 'groups'
		},
		bday: {
			readableName: t('contacts', 'Birthday'),
			template: 'date'
		},
		email: {
			multiple: true,
			readableName: t('contacts', 'Email'),
			template: 'text',
			defaultValue: {
				value:'',
				meta:{type:['HOME']}
			},
			options: [
				{id: 'HOME', name: t('contacts', 'Home')},
				{id: 'WORK', name: t('contacts', 'Work')},
				{id: 'OTHER', name: t('contacts', 'Other')}
			]
		},
		impp: {
			multiple: true,
			readableName: t('contacts', 'Instant messaging'),
			template: 'text',
			defaultValue: {
				value:[''],
				meta:{type:['HOME']}
			},
			options: [
				{id: 'HOME', name: t('contacts', 'Home')},
				{id: 'WORK', name: t('contacts', 'Work')},
				{id: 'OTHER', name: t('contacts', 'Other')}
			]
		},
		tel: {
			multiple: true,
			readableName: t('contacts', 'Phone'),
			template: 'tel',
			defaultValue: {
				value:[''],
				meta:{type:['HOME,VOICE']}
			},
			options: [
				{id: 'HOME,VOICE', name: t('contacts', 'Home')},
				{id: 'WORK,VOICE', name: t('contacts', 'Work')},
				{id: 'CELL', name: t('contacts', 'Mobile')},
				{id: 'FAX', name: t('contacts', 'Fax')},
				{id: 'HOME,FAX', name: t('contacts', 'Fax home')},
				{id: 'WORK,FAX', name: t('contacts', 'Fax work')},
				{id: 'PAGER', name: t('contacts', 'Pager')},
				{id: 'VOICE', name: t('contacts', 'Voice')}
			]
		}
	};

	this.fieldOrder = [
		'org',
		'title',
		'tel',
		'email',
		'adr',
		'impp',
		'nick',
		'bday',
		'url',
		'note',
		'categories',
		'role'
	];

	this.fieldDefinitions = [];
	for (var prop in this.vCardMeta) {
		this.fieldDefinitions.push({id: prop, name: this.vCardMeta[prop].readableName, multiple: !!this.vCardMeta[prop].multiple});
	}

	this.fallbackMeta = function(property) {
		function capitalize(string) { return string.charAt(0).toUpperCase() + string.slice(1); }
		return {
			name: 'unknown-' + property,
			readableName: capitalize(property),
			template: 'hidden',
			necessity: 'optional'
		};
	};

	this.getMeta = function(property) {
		return this.vCardMeta[property] || this.fallbackMeta(property);
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

app.filter('contactGroupFilter', function() {
	'use strict';
	return function (contacts, group) {
		if (typeof contacts === 'undefined') {
			return contacts;
		}
		if (typeof group === 'undefined' || group.toLowerCase() === t('contacts', 'All contacts').toLowerCase()) {
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
});

app.filter('fieldFilter', function() {
	'use strict';
	return function (fields, contact) {
		if (typeof fields === 'undefined') {
			return fields;
		}
		if (typeof contact === 'undefined') {
			return fields;
		}
		var filter = [];
		if (fields.length > 0) {
			for (var i = 0; i < fields.length; i++) {
				if (fields[i].multiple ) {
					filter.push(fields[i]);
					continue;
				}
				if (_.isUndefined(contact.getProperty(fields[i].id))) {
					filter.push(fields[i]);
				}
			}
		}
		return filter;
	};
});

app.filter('firstCharacter', function() {
	return function(input) {
		return input.charAt(0);
	};
});

app.filter('orderDetailItems', ['vCardPropertiesService', function(vCardPropertiesService) {
	'use strict';
	return function(items, field, reverse) {

		var filtered = [];
		angular.forEach(items, function(item) {
			filtered.push(item);
		});

		var fieldOrder = angular.copy(vCardPropertiesService.fieldOrder);
		// reverse to move custom items to the end (indexOf == -1)
		fieldOrder.reverse();

		filtered.sort(function (a, b) {
			if(fieldOrder.indexOf(a[field]) < fieldOrder.indexOf(b[field])) {
				return 1;
			}
			if(fieldOrder.indexOf(a[field]) > fieldOrder.indexOf(b[field])) {
				return -1;
			}
			return 0;
		});

		if(reverse) filtered.reverse();
		return filtered;
	};
}]);

app.filter('toArray', function() {
	return function(obj) {
		if (!(obj instanceof Object)) return obj;
		return _.map(obj, function(val, key) {
			return Object.defineProperty(val, '$key', {value: key});
		});
	};
});

app.filter('vCard2JSON', function() {
	return function(input) {
		return vCard.parse(input);
	};
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJkYXRlcGlja2VyX2RpcmVjdGl2ZS5qcyIsImZvY3VzX2RpcmVjdGl2ZS5qcyIsImFkZHJlc3NCb29rL2FkZHJlc3NCb29rX2NvbnRyb2xsZXIuanMiLCJhZGRyZXNzQm9vay9hZGRyZXNzQm9va19kaXJlY3RpdmUuanMiLCJhZGRyZXNzQm9va0xpc3QvYWRkcmVzc0Jvb2tMaXN0X2NvbnRyb2xsZXIuanMiLCJhZGRyZXNzQm9va0xpc3QvYWRkcmVzc0Jvb2tMaXN0X2RpcmVjdGl2ZS5qcyIsImNvbnRhY3QvY29udGFjdF9jb250cm9sbGVyLmpzIiwiY29udGFjdC9jb250YWN0X2RpcmVjdGl2ZS5qcyIsImNvbnRhY3REZXRhaWxzL2NvbnRhY3REZXRhaWxzX2NvbnRyb2xsZXIuanMiLCJjb250YWN0RGV0YWlscy9jb250YWN0RGV0YWlsc19kaXJlY3RpdmUuanMiLCJjb250YWN0TGlzdC9jb250YWN0TGlzdF9jb250cm9sbGVyLmpzIiwiY29udGFjdExpc3QvY29udGFjdExpc3RfZGlyZWN0aXZlLmpzIiwiZGV0YWlsc0l0ZW0vZGV0YWlsc0l0ZW1fY29udHJvbGxlci5qcyIsImRldGFpbHNJdGVtL2RldGFpbHNJdGVtX2RpcmVjdGl2ZS5qcyIsImRldGFpbHNQaG90by9kZXRhaWxzUGhvdG9fY29udHJvbGxlci5qcyIsImRldGFpbHNQaG90by9kZXRhaWxzUGhvdG9fZGlyZWN0aXZlLmpzIiwiZ3JvdXAvZ3JvdXBfY29udHJvbGxlci5qcyIsImdyb3VwL2dyb3VwX2RpcmVjdGl2ZS5qcyIsImdyb3VwTGlzdC9ncm91cExpc3RfY29udHJvbGxlci5qcyIsImdyb3VwTGlzdC9ncm91cExpc3RfZGlyZWN0aXZlLmpzIiwiaW1hZ2VQcmV2aWV3L2ltYWdlUHJldmlld19jb250cm9sbGVyLmpzIiwiaW1hZ2VQcmV2aWV3L2ltYWdlUHJldmlld19kaXJlY3RpdmUuanMiLCJwYXJzZXJzL2dyb3VwTW9kZWxfZGlyZWN0aXZlLmpzIiwicGFyc2Vycy90ZWxNb2RlbF9kaXJlY3RpdmUuanMiLCJhZGRyZXNzQm9va19tb2RlbC5qcyIsImNvbnRhY3RfbW9kZWwuanMiLCJhZGRyZXNzQm9va19zZXJ2aWNlLmpzIiwiY29udGFjdF9zZXJ2aWNlLmpzIiwiZGF2Q2xpZW50X3NlcnZpY2UuanMiLCJkYXZfc2VydmljZS5qcyIsInNldHRpbmdzX3NlcnZpY2UuanMiLCJ2Q2FyZFByb3BlcnRpZXMuanMiLCJKU09OMnZDYXJkX2ZpbHRlci5qcyIsImNvbnRhY3RDb2xvcl9maWx0ZXIuanMiLCJjb250YWN0R3JvdXBfZmlsdGVyLmpzIiwiZmllbGRfZmlsdGVyLmpzIiwiZmlyc3RDaGFyYWN0ZXJfZmlsdGVyLmpzIiwib3JkZXJEZXRhaWxJdGVtc19maWx0ZXIuanMiLCJ0b0FycmF5X2ZpbHRlci5qcyIsInZDYXJkMkpTT05fZmlsdGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7O0FBVUEsSUFBSSxNQUFNLFFBQVEsT0FBTyxlQUFlLENBQUMsU0FBUyxpQkFBaUIsV0FBVyxnQkFBZ0IsYUFBYTs7QUFFM0csSUFBSSwwQkFBTyxTQUFTLGdCQUFnQjs7Q0FFbkMsZUFBZSxLQUFLLFNBQVM7RUFDNUIsVUFBVTs7O0NBR1gsZUFBZSxLQUFLLGNBQWM7RUFDakMsVUFBVTs7O0NBR1gsZUFBZSxVQUFVLE1BQU0sRUFBRSxZQUFZOzs7QUFHOUM7QUN6QkEsSUFBSSxVQUFVLGNBQWMsV0FBVztDQUN0QyxPQUFPO0VBQ04sVUFBVTtFQUNWLFVBQVU7RUFDVixPQUFPLFVBQVUsT0FBTyxTQUFTLE9BQU8sYUFBYTtHQUNwRCxFQUFFLFdBQVc7SUFDWixRQUFRLFdBQVc7S0FDbEIsV0FBVztLQUNYLFNBQVM7S0FDVCxTQUFTO0tBQ1QsU0FBUyxVQUFVLE1BQU07TUFDeEIsWUFBWSxjQUFjO01BQzFCLE1BQU07Ozs7Ozs7QUFPWjtBQ25CQSxJQUFJLFVBQVUsZ0NBQW1CLFVBQVUsVUFBVTtDQUNwRCxPQUFPO0VBQ04sVUFBVTtFQUNWLE1BQU07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LFdBQVc7RUFDZixRQUFRLFFBQVEsT0FBTyxTQUFTLE1BQU07R0FDckMsU0FBUyxLQUFLOzs7RUFHZixJQUFJLGFBQWEsUUFBUSxLQUFLLHVCQUF1Qjs7RUFFckQsV0FBVzs7RUFFWCxTQUFTLEtBQUssVUFBVSxHQUFHLEdBQUc7R0FDN0IsR0FBRyxXQUFXLFFBQVEsRUFBRSxVQUFVLFdBQVcsUUFBUSxFQUFFLFNBQVM7SUFDL0QsT0FBTzs7R0FFUixHQUFHLFdBQVcsUUFBUSxFQUFFLFVBQVUsV0FBVyxRQUFRLEVBQUUsU0FBUztJQUMvRCxPQUFPLENBQUM7O0dBRVQsT0FBTzs7O0VBR1IsR0FBRyxTQUFTLFNBQVM7RUFDckIsT0FBTzs7O0FBR1Q7QUMzQkEsSUFBSSxPQUFPLFdBQVcsV0FBVztDQUNoQyxPQUFPLFNBQVMsS0FBSztFQUNwQixJQUFJLEVBQUUsZUFBZSxTQUFTLE9BQU87RUFDckMsT0FBTyxFQUFFLElBQUksS0FBSyxTQUFTLEtBQUssS0FBSztHQUNwQyxPQUFPLE9BQU8sZUFBZSxLQUFLLFFBQVEsQ0FBQyxPQUFPOzs7O0FBSXJEO0FDUkEsSUFBSSxPQUFPLGNBQWMsV0FBVztDQUNuQyxPQUFPLFNBQVMsT0FBTztFQUN0QixPQUFPLE1BQU0sTUFBTTs7R0FFbEIiLCJmaWxlIjoic2NyaXB0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBvd25DbG91ZCAtIGNvbnRhY3RzXG4gKlxuICogVGhpcyBmaWxlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBBZmZlcm8gR2VuZXJhbCBQdWJsaWMgTGljZW5zZSB2ZXJzaW9uIDMgb3JcbiAqIGxhdGVyLiBTZWUgdGhlIENPUFlJTkcgZmlsZS5cbiAqXG4gKiBAYXV0aG9yIEhlbmRyaWsgTGVwcGVsc2FjayA8aGVuZHJpa0BsZXBwZWxzYWNrLmRlPlxuICogQGNvcHlyaWdodCBIZW5kcmlrIExlcHBlbHNhY2sgMjAxNVxuICovXG5cbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnY29udGFjdHNBcHAnLCBbJ3V1aWQ0JywgJ2FuZ3VsYXItY2FjaGUnLCAnbmdSb3V0ZScsICd1aS5ib290c3RyYXAnLCAndWkuc2VsZWN0JywgJ25nU2FuaXRpemUnXSk7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24oJHJvdXRlUHJvdmlkZXIpIHtcblxuXHQkcm91dGVQcm92aWRlci53aGVuKCcvOmdpZCcsIHtcblx0XHR0ZW1wbGF0ZTogJzxjb250YWN0ZGV0YWlscz48L2NvbnRhY3RkZXRhaWxzPidcblx0fSk7XG5cblx0JHJvdXRlUHJvdmlkZXIud2hlbignLzpnaWQvOnVpZCcsIHtcblx0XHR0ZW1wbGF0ZTogJzxjb250YWN0ZGV0YWlscz48L2NvbnRhY3RkZXRhaWxzPidcblx0fSk7XG5cblx0JHJvdXRlUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyArIHQoJ2NvbnRhY3RzJywgJ0FsbCBjb250YWN0cycpKTtcblxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdkYXRlcGlja2VyJywgZnVuY3Rpb24oKSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdBJyxcblx0XHRyZXF1aXJlIDogJ25nTW9kZWwnLFxuXHRcdGxpbmsgOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBuZ01vZGVsQ3RybCkge1xuXHRcdFx0JChmdW5jdGlvbigpIHtcblx0XHRcdFx0ZWxlbWVudC5kYXRlcGlja2VyKHtcblx0XHRcdFx0XHRkYXRlRm9ybWF0Oid5eS1tbS1kZCcsXG5cdFx0XHRcdFx0bWluRGF0ZTogbnVsbCxcblx0XHRcdFx0XHRtYXhEYXRlOiBudWxsLFxuXHRcdFx0XHRcdG9uU2VsZWN0OmZ1bmN0aW9uIChkYXRlKSB7XG5cdFx0XHRcdFx0XHRuZ01vZGVsQ3RybC4kc2V0Vmlld1ZhbHVlKGRhdGUpO1xuXHRcdFx0XHRcdFx0c2NvcGUuJGFwcGx5KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fTtcbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnZm9jdXNFeHByZXNzaW9uJywgZnVuY3Rpb24gKCR0aW1lb3V0KSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdBJyxcblx0XHRsaW5rOiB7XG5cdFx0XHRwb3N0OiBmdW5jdGlvbiBwb3N0TGluayhzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcblx0XHRcdFx0c2NvcGUuJHdhdGNoKGF0dHJzLmZvY3VzRXhwcmVzc2lvbiwgZnVuY3Rpb24gKHZhbHVlKSB7XG5cblx0XHRcdFx0XHRpZiAoYXR0cnMuZm9jdXNFeHByZXNzaW9uKSB7XG5cdFx0XHRcdFx0XHRpZiAoc2NvcGUuJGV2YWwoYXR0cnMuZm9jdXNFeHByZXNzaW9uKSkge1xuXHRcdFx0XHRcdFx0XHQkdGltZW91dChmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKGVsZW1lbnQuaXMoJ2lucHV0JykpIHtcblx0XHRcdFx0XHRcdFx0XHRcdGVsZW1lbnQuZm9jdXMoKTtcblx0XHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdFx0ZWxlbWVudC5maW5kKCdpbnB1dCcpLmZvY3VzKCk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9LCAxMDApOyAvL25lZWQgc29tZSBkZWxheSB0byB3b3JrIHdpdGggbmctZGlzYWJsZWRcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcbn0pO1xuIiwiYXBwLmNvbnRyb2xsZXIoJ2FkZHJlc3Nib29rQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgQWRkcmVzc0Jvb2tTZXJ2aWNlKSB7XG5cdHZhciBjdHJsID0gdGhpcztcblxuXHRjdHJsLnVybEJhc2UgPSB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgKyAnLy8nICsgd2luZG93LmxvY2F0aW9uLmhvc3Q7XG5cdGN0cmwuc2hvd1VybCA9IGZhbHNlO1xuXG5cdGN0cmwudG9nZ2xlU2hvd1VybCA9IGZ1bmN0aW9uKCkge1xuXHRcdGN0cmwuc2hvd1VybCA9ICFjdHJsLnNob3dVcmw7XG5cdH07XG5cblx0Y3RybC50b2dnbGVTaGFyZXNFZGl0b3IgPSBmdW5jdGlvbihhZGRyZXNzQm9vaykge1xuXHRcdGFkZHJlc3NCb29rLmVkaXRpbmdTaGFyZXMgPSAhYWRkcmVzc0Jvb2suZWRpdGluZ1NoYXJlcztcblx0XHRhZGRyZXNzQm9vay5zZWxlY3RlZFNoYXJlZSA9IG51bGw7XG5cdH07XG5cblx0LyogRnJvbSBDYWxlbmRhci1SZXdvcmsgLSBqcy9hcHAvY29udHJvbGxlcnMvY2FsZW5kYXJsaXN0Y29udHJvbGxlci5qcyAqL1xuXHRjdHJsLmZpbmRTaGFyZWUgPSBmdW5jdGlvbiAodmFsLCBhZGRyZXNzQm9vaykge1xuXHRcdHJldHVybiAkLmdldChcblx0XHRcdE9DLmxpbmtUb09DUygnYXBwcy9maWxlc19zaGFyaW5nL2FwaS92MScpICsgJ3NoYXJlZXMnLFxuXHRcdFx0e1xuXHRcdFx0XHRmb3JtYXQ6ICdqc29uJyxcblx0XHRcdFx0c2VhcmNoOiB2YWwudHJpbSgpLFxuXHRcdFx0XHRwZXJQYWdlOiAyMDAsXG5cdFx0XHRcdGl0ZW1UeXBlOiAncHJpbmNpcGFscydcblx0XHRcdH1cblx0XHQpLnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XG5cdFx0XHQvLyBUb2RvIC0gZmlsdGVyIG91dCBjdXJyZW50IHVzZXIsIGV4aXN0aW5nIHNoYXJlZXNcblx0XHRcdHZhciB1c2VycyAgID0gcmVzdWx0Lm9jcy5kYXRhLmV4YWN0LnVzZXJzLmNvbmNhdChyZXN1bHQub2NzLmRhdGEudXNlcnMpO1xuXHRcdFx0dmFyIGdyb3VwcyAgPSByZXN1bHQub2NzLmRhdGEuZXhhY3QuZ3JvdXBzLmNvbmNhdChyZXN1bHQub2NzLmRhdGEuZ3JvdXBzKTtcblxuXHRcdFx0dmFyIHVzZXJTaGFyZXMgPSBhZGRyZXNzQm9vay5zaGFyZWRXaXRoLnVzZXJzO1xuXHRcdFx0dmFyIGdyb3VwU2hhcmVzID0gYWRkcmVzc0Jvb2suc2hhcmVkV2l0aC5ncm91cHM7XG5cdFx0XHR2YXIgdXNlclNoYXJlc0xlbmd0aCA9IHVzZXJTaGFyZXMubGVuZ3RoO1xuXHRcdFx0dmFyIGdyb3VwU2hhcmVzTGVuZ3RoID0gZ3JvdXBTaGFyZXMubGVuZ3RoO1xuXHRcdFx0dmFyIGksIGo7XG5cblx0XHRcdC8vIEZpbHRlciBvdXQgY3VycmVudCB1c2VyXG5cdFx0XHR2YXIgdXNlcnNMZW5ndGggPSB1c2Vycy5sZW5ndGg7XG5cdFx0XHRmb3IgKGkgPSAwIDsgaSA8IHVzZXJzTGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aWYgKHVzZXJzW2ldLnZhbHVlLnNoYXJlV2l0aCA9PT0gT0MuY3VycmVudFVzZXIpIHtcblx0XHRcdFx0XHR1c2Vycy5zcGxpY2UoaSwgMSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gTm93IGZpbHRlciBvdXQgYWxsIHNoYXJlZXMgdGhhdCBhcmUgYWxyZWFkeSBzaGFyZWQgd2l0aFxuXHRcdFx0Zm9yIChpID0gMDsgaSA8IHVzZXJTaGFyZXNMZW5ndGg7IGkrKykge1xuXHRcdFx0XHR2YXIgc2hhcmUgPSB1c2VyU2hhcmVzW2ldO1xuXHRcdFx0XHR1c2Vyc0xlbmd0aCA9IHVzZXJzLmxlbmd0aDtcblx0XHRcdFx0Zm9yIChqID0gMDsgaiA8IHVzZXJzTGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0XHRpZiAodXNlcnNbal0udmFsdWUuc2hhcmVXaXRoID09PSBzaGFyZS5pZCkge1xuXHRcdFx0XHRcdFx0dXNlcnMuc3BsaWNlKGosIDEpO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vIENvbWJpbmUgdXNlcnMgYW5kIGdyb3Vwc1xuXHRcdFx0dXNlcnMgPSB1c2Vycy5tYXAoZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdGRpc3BsYXk6IGl0ZW0udmFsdWUuc2hhcmVXaXRoLFxuXHRcdFx0XHRcdHR5cGU6IE9DLlNoYXJlLlNIQVJFX1RZUEVfVVNFUixcblx0XHRcdFx0XHRpZGVudGlmaWVyOiBpdGVtLnZhbHVlLnNoYXJlV2l0aFxuXHRcdFx0XHR9O1xuXHRcdFx0fSk7XG5cblx0XHRcdGdyb3VwcyA9IGdyb3Vwcy5tYXAoZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdGRpc3BsYXk6IGl0ZW0udmFsdWUuc2hhcmVXaXRoICsgJyAoZ3JvdXApJyxcblx0XHRcdFx0XHR0eXBlOiBPQy5TaGFyZS5TSEFSRV9UWVBFX0dST1VQLFxuXHRcdFx0XHRcdGlkZW50aWZpZXI6IGl0ZW0udmFsdWUuc2hhcmVXaXRoXG5cdFx0XHRcdH07XG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIGdyb3Vwcy5jb25jYXQodXNlcnMpO1xuXHRcdH0pO1xuXHR9O1xuXG5cdGN0cmwub25TZWxlY3RTaGFyZWUgPSBmdW5jdGlvbiAoaXRlbSwgbW9kZWwsIGxhYmVsLCBhZGRyZXNzQm9vaykge1xuXHRcdGN0cmwuYWRkcmVzc0Jvb2suc2VsZWN0ZWRTaGFyZWUgPSBudWxsO1xuXHRcdEFkZHJlc3NCb29rU2VydmljZS5zaGFyZShhZGRyZXNzQm9vaywgaXRlbS50eXBlLCBpdGVtLmlkZW50aWZpZXIsIGZhbHNlLCBmYWxzZSkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdCRzY29wZS4kYXBwbHkoKTtcblx0XHR9KTtcblxuXHR9O1xuXG5cdGN0cmwudXBkYXRlRXhpc3RpbmdVc2VyU2hhcmUgPSBmdW5jdGlvbihhZGRyZXNzQm9vaywgdXNlcklkLCB3cml0YWJsZSkge1xuXHRcdEFkZHJlc3NCb29rU2VydmljZS5zaGFyZShhZGRyZXNzQm9vaywgT0MuU2hhcmUuU0hBUkVfVFlQRV9VU0VSLCB1c2VySWQsIHdyaXRhYmxlLCB0cnVlKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0JHNjb3BlLiRhcHBseSgpO1xuXHRcdH0pO1xuXHR9O1xuXG5cdGN0cmwudXBkYXRlRXhpc3RpbmdHcm91cFNoYXJlID0gZnVuY3Rpb24oYWRkcmVzc0Jvb2ssIGdyb3VwSWQsIHdyaXRhYmxlKSB7XG5cdFx0QWRkcmVzc0Jvb2tTZXJ2aWNlLnNoYXJlKGFkZHJlc3NCb29rLCBPQy5TaGFyZS5TSEFSRV9UWVBFX0dST1VQLCBncm91cElkLCB3cml0YWJsZSwgdHJ1ZSkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdCRzY29wZS4kYXBwbHkoKTtcblx0XHR9KTtcblx0fTtcblxuXHRjdHJsLnVuc2hhcmVGcm9tVXNlciA9IGZ1bmN0aW9uKGFkZHJlc3NCb29rLCB1c2VySWQpIHtcblx0XHRBZGRyZXNzQm9va1NlcnZpY2UudW5zaGFyZShhZGRyZXNzQm9vaywgT0MuU2hhcmUuU0hBUkVfVFlQRV9VU0VSLCB1c2VySWQpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHQkc2NvcGUuJGFwcGx5KCk7XG5cdFx0fSk7XG5cdH07XG5cblx0Y3RybC51bnNoYXJlRnJvbUdyb3VwID0gZnVuY3Rpb24oYWRkcmVzc0Jvb2ssIGdyb3VwSWQpIHtcblx0XHRBZGRyZXNzQm9va1NlcnZpY2UudW5zaGFyZShhZGRyZXNzQm9vaywgT0MuU2hhcmUuU0hBUkVfVFlQRV9HUk9VUCwgZ3JvdXBJZCkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdCRzY29wZS4kYXBwbHkoKTtcblx0XHR9KTtcblx0fTtcblxuXHRjdHJsLmRlbGV0ZUFkZHJlc3NCb29rID0gZnVuY3Rpb24oYWRkcmVzc0Jvb2spIHtcblx0XHRBZGRyZXNzQm9va1NlcnZpY2UuZGVsZXRlKGFkZHJlc3NCb29rKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0JHNjb3BlLiRhcHBseSgpO1xuXHRcdH0pO1xuXHR9O1xuXG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2FkZHJlc3Nib29rJywgZnVuY3Rpb24oKSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdBJywgLy8gaGFzIHRvIGJlIGFuIGF0dHJpYnV0ZSB0byB3b3JrIHdpdGggY29yZSBjc3Ncblx0XHRzY29wZToge30sXG5cdFx0Y29udHJvbGxlcjogJ2FkZHJlc3Nib29rQ3RybCcsXG5cdFx0Y29udHJvbGxlckFzOiAnY3RybCcsXG5cdFx0YmluZFRvQ29udHJvbGxlcjoge1xuXHRcdFx0YWRkcmVzc0Jvb2s6ICc9ZGF0YSdcblx0XHR9LFxuXHRcdHRlbXBsYXRlVXJsOiBPQy5saW5rVG8oJ2NvbnRhY3RzJywgJ3RlbXBsYXRlcy9hZGRyZXNzQm9vay5odG1sJylcblx0fTtcbn0pO1xuIiwiYXBwLmNvbnRyb2xsZXIoJ2FkZHJlc3Nib29rbGlzdEN0cmwnLCBmdW5jdGlvbigkc2NvcGUsIEFkZHJlc3NCb29rU2VydmljZSwgU2V0dGluZ3NTZXJ2aWNlKSB7XG5cdHZhciBjdHJsID0gdGhpcztcblxuXHRBZGRyZXNzQm9va1NlcnZpY2UuZ2V0QWxsKCkudGhlbihmdW5jdGlvbihhZGRyZXNzQm9va3MpIHtcblx0XHRjdHJsLmFkZHJlc3NCb29rcyA9IGFkZHJlc3NCb29rcztcblx0fSk7XG5cblx0Y3RybC5jcmVhdGVBZGRyZXNzQm9vayA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmKGN0cmwubmV3QWRkcmVzc0Jvb2tOYW1lKSB7XG5cdFx0XHRBZGRyZXNzQm9va1NlcnZpY2UuY3JlYXRlKGN0cmwubmV3QWRkcmVzc0Jvb2tOYW1lKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRBZGRyZXNzQm9va1NlcnZpY2UuZ2V0QWRkcmVzc0Jvb2soY3RybC5uZXdBZGRyZXNzQm9va05hbWUpLnRoZW4oZnVuY3Rpb24oYWRkcmVzc0Jvb2spIHtcblx0XHRcdFx0XHRjdHJsLmFkZHJlc3NCb29rcy5wdXNoKGFkZHJlc3NCb29rKTtcblx0XHRcdFx0XHQkc2NvcGUuJGFwcGx5KCk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9O1xufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdhZGRyZXNzYm9va2xpc3QnLCBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0VBJywgLy8gaGFzIHRvIGJlIGFuIGF0dHJpYnV0ZSB0byB3b3JrIHdpdGggY29yZSBjc3Ncblx0XHRzY29wZToge30sXG5cdFx0Y29udHJvbGxlcjogJ2FkZHJlc3Nib29rbGlzdEN0cmwnLFxuXHRcdGNvbnRyb2xsZXJBczogJ2N0cmwnLFxuXHRcdGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuXHRcdHRlbXBsYXRlVXJsOiBPQy5saW5rVG8oJ2NvbnRhY3RzJywgJ3RlbXBsYXRlcy9hZGRyZXNzQm9va0xpc3QuaHRtbCcpXG5cdH07XG59KTtcbiIsImFwcC5jb250cm9sbGVyKCdjb250YWN0Q3RybCcsIGZ1bmN0aW9uKCRyb3V0ZSwgJHJvdXRlUGFyYW1zKSB7XG5cdHZhciBjdHJsID0gdGhpcztcblxuXHRjdHJsLm9wZW5Db250YWN0ID0gZnVuY3Rpb24oKSB7XG5cdFx0JHJvdXRlLnVwZGF0ZVBhcmFtcyh7XG5cdFx0XHRnaWQ6ICRyb3V0ZVBhcmFtcy5naWQsXG5cdFx0XHR1aWQ6IGN0cmwuY29udGFjdC51aWQoKX0pO1xuXHR9O1xufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdjb250YWN0JywgZnVuY3Rpb24oKSB7XG5cdHJldHVybiB7XG5cdFx0c2NvcGU6IHt9LFxuXHRcdGNvbnRyb2xsZXI6ICdjb250YWN0Q3RybCcsXG5cdFx0Y29udHJvbGxlckFzOiAnY3RybCcsXG5cdFx0YmluZFRvQ29udHJvbGxlcjoge1xuXHRcdFx0Y29udGFjdDogJz1kYXRhJ1xuXHRcdH0sXG5cdFx0dGVtcGxhdGVVcmw6IE9DLmxpbmtUbygnY29udGFjdHMnLCAndGVtcGxhdGVzL2NvbnRhY3QuaHRtbCcpXG5cdH07XG59KTtcbiIsImFwcC5jb250cm9sbGVyKCdjb250YWN0ZGV0YWlsc0N0cmwnLCBmdW5jdGlvbihDb250YWN0U2VydmljZSwgQWRkcmVzc0Jvb2tTZXJ2aWNlLCB2Q2FyZFByb3BlcnRpZXNTZXJ2aWNlLCAkcm91dGVQYXJhbXMsICRzY29wZSkge1xuXHR2YXIgY3RybCA9IHRoaXM7XG5cblx0Y3RybC51aWQgPSAkcm91dGVQYXJhbXMudWlkO1xuXHRjdHJsLnQgPSB7XG5cdFx0bm9Db250YWN0cyA6IHQoJ2NvbnRhY3RzJywgJ05vIGNvbnRhY3RzIGluIGhlcmUnKSxcblx0XHRwbGFjZWhvbGRlck5hbWUgOiB0KCdjb250YWN0cycsICdOYW1lJyksXG5cdFx0cGxhY2Vob2xkZXJPcmcgOiB0KCdjb250YWN0cycsICdPcmdhbml6YXRpb24nKSxcblx0XHRwbGFjZWhvbGRlclRpdGxlIDogdCgnY29udGFjdHMnLCAnVGl0bGUnKSxcblx0XHRzZWxlY3RGaWVsZCA6IHQoJ2NvbnRhY3RzJywgJ0FkZCBmaWVsZCAuLi4nKVxuXHR9O1xuXG5cdGN0cmwuZmllbGREZWZpbml0aW9ucyA9IHZDYXJkUHJvcGVydGllc1NlcnZpY2UuZmllbGREZWZpbml0aW9ucztcblx0Y3RybC5mb2N1cyA9IHVuZGVmaW5lZDtcblx0Y3RybC5maWVsZCA9IHVuZGVmaW5lZDtcblx0JHNjb3BlLmFkZHJlc3NCb29rcyA9IFtdO1xuXHRjdHJsLmFkZHJlc3NCb29rcyA9IFtdO1xuXG5cdEFkZHJlc3NCb29rU2VydmljZS5nZXRBbGwoKS50aGVuKGZ1bmN0aW9uKGFkZHJlc3NCb29rcykge1xuXHRcdGN0cmwuYWRkcmVzc0Jvb2tzID0gYWRkcmVzc0Jvb2tzO1xuXHRcdCRzY29wZS5hZGRyZXNzQm9va3MgPSBhZGRyZXNzQm9va3MubWFwKGZ1bmN0aW9uIChlbGVtZW50KSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRpZDogZWxlbWVudC5kaXNwbGF5TmFtZSxcblx0XHRcdFx0bmFtZTogZWxlbWVudC5kaXNwbGF5TmFtZVxuXHRcdFx0fTtcblx0XHR9KTtcblx0XHRpZiAoIV8uaXNVbmRlZmluZWQoY3RybC5jb250YWN0KSkge1xuXHRcdFx0JHNjb3BlLmFkZHJlc3NCb29rID0gXy5maW5kKCRzY29wZS5hZGRyZXNzQm9va3MsIGZ1bmN0aW9uKGJvb2spIHtcblx0XHRcdFx0cmV0dXJuIGJvb2suaWQgPT09IGN0cmwuY29udGFjdC5hZGRyZXNzQm9va0lkO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9KTtcblxuXHQkc2NvcGUuJHdhdGNoKCdjdHJsLnVpZCcsIGZ1bmN0aW9uKG5ld1ZhbHVlLCBvbGRWYWx1ZSkge1xuXHRcdGN0cmwuY2hhbmdlQ29udGFjdChuZXdWYWx1ZSk7XG5cdH0pO1xuXG5cdGN0cmwuY2hhbmdlQ29udGFjdCA9IGZ1bmN0aW9uKHVpZCkge1xuXHRcdGlmICh0eXBlb2YgdWlkID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRDb250YWN0U2VydmljZS5nZXRCeUlkKHVpZCkudGhlbihmdW5jdGlvbihjb250YWN0KSB7XG5cdFx0XHRjdHJsLmNvbnRhY3QgPSBjb250YWN0O1xuXHRcdFx0Y3RybC5waG90byA9IGN0cmwuY29udGFjdC5waG90bygpO1xuXHRcdFx0JHNjb3BlLmFkZHJlc3NCb29rID0gXy5maW5kKCRzY29wZS5hZGRyZXNzQm9va3MsIGZ1bmN0aW9uKGJvb2spIHtcblx0XHRcdFx0cmV0dXJuIGJvb2suaWQgPT09IGN0cmwuY29udGFjdC5hZGRyZXNzQm9va0lkO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH07XG5cblx0Y3RybC51cGRhdGVDb250YWN0ID0gZnVuY3Rpb24oKSB7XG5cdFx0Q29udGFjdFNlcnZpY2UudXBkYXRlKGN0cmwuY29udGFjdCk7XG5cdH07XG5cblx0Y3RybC5kZWxldGVDb250YWN0ID0gZnVuY3Rpb24oKSB7XG5cdFx0Q29udGFjdFNlcnZpY2UuZGVsZXRlKGN0cmwuY29udGFjdCk7XG5cdH07XG5cblx0Y3RybC5hZGRGaWVsZCA9IGZ1bmN0aW9uKGZpZWxkKSB7XG5cdFx0dmFyIGRlZmF1bHRWYWx1ZSA9IHZDYXJkUHJvcGVydGllc1NlcnZpY2UuZ2V0TWV0YShmaWVsZCkuZGVmYXVsdFZhbHVlIHx8IHt2YWx1ZTogJyd9O1xuXHRcdGN0cmwuY29udGFjdC5hZGRQcm9wZXJ0eShmaWVsZCwgZGVmYXVsdFZhbHVlKTtcblx0XHRjdHJsLmZvY3VzID0gZmllbGQ7XG5cdFx0Y3RybC5maWVsZCA9ICcnO1xuXHR9O1xuXG5cdGN0cmwuZGVsZXRlRmllbGQgPSBmdW5jdGlvbiAoZmllbGQsIHByb3ApIHtcblx0XHRjdHJsLmNvbnRhY3QucmVtb3ZlUHJvcGVydHkoZmllbGQsIHByb3ApO1xuXHRcdGN0cmwuZm9jdXMgPSB1bmRlZmluZWQ7XG5cdH07XG5cblx0Y3RybC5jaGFuZ2VBZGRyZXNzQm9vayA9IGZ1bmN0aW9uIChhZGRyZXNzQm9vaykge1xuXHRcdGFkZHJlc3NCb29rID0gXy5maW5kKGN0cmwuYWRkcmVzc0Jvb2tzLCBmdW5jdGlvbihib29rKSB7XG5cdFx0XHRyZXR1cm4gYm9vay5kaXNwbGF5TmFtZSA9PT0gYWRkcmVzc0Jvb2suaWQ7XG5cdFx0fSk7XG5cdFx0Q29udGFjdFNlcnZpY2UubW92ZUNvbnRhY3QoY3RybC5jb250YWN0LCBhZGRyZXNzQm9vayk7XG5cdH07XG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2NvbnRhY3RkZXRhaWxzJywgZnVuY3Rpb24oKSB7XG5cdHJldHVybiB7XG5cdFx0cHJpb3JpdHk6IDEsXG5cdFx0c2NvcGU6IHt9LFxuXHRcdGNvbnRyb2xsZXI6ICdjb250YWN0ZGV0YWlsc0N0cmwnLFxuXHRcdGNvbnRyb2xsZXJBczogJ2N0cmwnLFxuXHRcdGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuXHRcdHRlbXBsYXRlVXJsOiBPQy5saW5rVG8oJ2NvbnRhY3RzJywgJ3RlbXBsYXRlcy9jb250YWN0RGV0YWlscy5odG1sJylcblx0fTtcbn0pO1xuIiwiYXBwLmNvbnRyb2xsZXIoJ2NvbnRhY3RsaXN0Q3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJGZpbHRlciwgJHJvdXRlLCAkcm91dGVQYXJhbXMsIENvbnRhY3RTZXJ2aWNlLCB2Q2FyZFByb3BlcnRpZXNTZXJ2aWNlKSB7XG5cdHZhciBjdHJsID0gdGhpcztcblxuXHRjdHJsLnJvdXRlUGFyYW1zID0gJHJvdXRlUGFyYW1zO1xuXHRjdHJsLnQgPSB7XG5cdFx0YWRkQ29udGFjdCA6IHQoJ2NvbnRhY3RzJywgJ0FkZCBjb250YWN0Jylcblx0fTtcblxuXHRjdHJsLmNvbnRhY3RMaXN0ID0gW107XG5cdGN0cmwucXVlcnkgPSAnJztcblxuXHQkc2NvcGUucXVlcnkgPSBmdW5jdGlvbihjb250YWN0KSB7XG5cdFx0cmV0dXJuIGNvbnRhY3QubWF0Y2hlcyhjdHJsLnF1ZXJ5KTtcblx0fTtcblxuXHRTZWFyY2hQcm94eS5zZXRGaWx0ZXIoZnVuY3Rpb24ocXVlcnkpIHtcblx0XHRjdHJsLnF1ZXJ5ID0gcXVlcnkudG9Mb3dlckNhc2UoKTtcblx0XHQkc2NvcGUuJGFwcGx5KCk7XG5cdH0pO1xuXG5cdENvbnRhY3RTZXJ2aWNlLnJlZ2lzdGVyT2JzZXJ2ZXJDYWxsYmFjayhmdW5jdGlvbihldikge1xuXHRcdCRzY29wZS4kYXBwbHkoZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoZXYuZXZlbnQgPT09ICdkZWxldGUnKSB7XG5cdFx0XHRcdGlmIChjdHJsLmNvbnRhY3RMaXN0Lmxlbmd0aCA9PT0gMSkge1xuXHRcdFx0XHRcdCRyb3V0ZS51cGRhdGVQYXJhbXMoe1xuXHRcdFx0XHRcdFx0Z2lkOiAkcm91dGVQYXJhbXMuZ2lkLFxuXHRcdFx0XHRcdFx0dWlkOiB1bmRlZmluZWRcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gY3RybC5jb250YWN0TGlzdC5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdFx0aWYgKGN0cmwuY29udGFjdExpc3RbaV0udWlkKCkgPT09IGV2LnVpZCkge1xuXHRcdFx0XHRcdFx0XHQkcm91dGUudXBkYXRlUGFyYW1zKHtcblx0XHRcdFx0XHRcdFx0XHRnaWQ6ICRyb3V0ZVBhcmFtcy5naWQsXG5cdFx0XHRcdFx0XHRcdFx0dWlkOiAoY3RybC5jb250YWN0TGlzdFtpKzFdKSA/IGN0cmwuY29udGFjdExpc3RbaSsxXS51aWQoKSA6IGN0cmwuY29udGFjdExpc3RbaS0xXS51aWQoKVxuXHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmIChldi5ldmVudCA9PT0gJ2NyZWF0ZScpIHtcblx0XHRcdFx0JHJvdXRlLnVwZGF0ZVBhcmFtcyh7XG5cdFx0XHRcdFx0Z2lkOiAkcm91dGVQYXJhbXMuZ2lkLFxuXHRcdFx0XHRcdHVpZDogZXYudWlkXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdFx0Y3RybC5jb250YWN0cyA9IGV2LmNvbnRhY3RzO1xuXHRcdH0pO1xuXHR9KTtcblxuXHRDb250YWN0U2VydmljZS5nZXRBbGwoKS50aGVuKGZ1bmN0aW9uKGNvbnRhY3RzKSB7XG5cdFx0JHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcblx0XHRcdGN0cmwuY29udGFjdHMgPSBjb250YWN0cztcblx0XHR9KTtcblx0fSk7XG5cblx0JHNjb3BlLiR3YXRjaCgnY3RybC5yb3V0ZVBhcmFtcy51aWQnLCBmdW5jdGlvbihuZXdWYWx1ZSkge1xuXHRcdGlmKG5ld1ZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0XHRcdC8vIHdlIG1pZ2h0IGhhdmUgdG8gd2FpdCB1bnRpbCBuZy1yZXBlYXQgZmlsbGVkIHRoZSBjb250YWN0TGlzdFxuXHRcdFx0aWYoY3RybC5jb250YWN0TGlzdCAmJiBjdHJsLmNvbnRhY3RMaXN0Lmxlbmd0aCA+IDApIHtcblx0XHRcdFx0JHJvdXRlLnVwZGF0ZVBhcmFtcyh7XG5cdFx0XHRcdFx0Z2lkOiAkcm91dGVQYXJhbXMuZ2lkLFxuXHRcdFx0XHRcdHVpZDogY3RybC5jb250YWN0TGlzdFswXS51aWQoKVxuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIHdhdGNoIGZvciBuZXh0IGNvbnRhY3RMaXN0IHVwZGF0ZVxuXHRcdFx0XHR2YXIgdW5iaW5kV2F0Y2ggPSAkc2NvcGUuJHdhdGNoKCdjdHJsLmNvbnRhY3RMaXN0JywgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0aWYoY3RybC5jb250YWN0TGlzdCAmJiBjdHJsLmNvbnRhY3RMaXN0Lmxlbmd0aCA+IDApIHtcblx0XHRcdFx0XHRcdCRyb3V0ZS51cGRhdGVQYXJhbXMoe1xuXHRcdFx0XHRcdFx0XHRnaWQ6ICRyb3V0ZVBhcmFtcy5naWQsXG5cdFx0XHRcdFx0XHRcdHVpZDogY3RybC5jb250YWN0TGlzdFswXS51aWQoKVxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHVuYmluZFdhdGNoKCk7IC8vIHVuYmluZCBhcyB3ZSBvbmx5IHdhbnQgb25lIHVwZGF0ZVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xuXG5cdCRzY29wZS4kd2F0Y2goJ2N0cmwucm91dGVQYXJhbXMuZ2lkJywgZnVuY3Rpb24oKSB7XG5cdFx0Ly8gd2UgbWlnaHQgaGF2ZSB0byB3YWl0IHVudGlsIG5nLXJlcGVhdCBmaWxsZWQgdGhlIGNvbnRhY3RMaXN0XG5cdFx0Y3RybC5jb250YWN0TGlzdCA9IFtdO1xuXHRcdC8vIHdhdGNoIGZvciBuZXh0IGNvbnRhY3RMaXN0IHVwZGF0ZVxuXHRcdHZhciB1bmJpbmRXYXRjaCA9ICRzY29wZS4kd2F0Y2goJ2N0cmwuY29udGFjdExpc3QnLCBmdW5jdGlvbigpIHtcblx0XHRcdGlmKGN0cmwuY29udGFjdExpc3QgJiYgY3RybC5jb250YWN0TGlzdC5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdCRyb3V0ZS51cGRhdGVQYXJhbXMoe1xuXHRcdFx0XHRcdGdpZDogJHJvdXRlUGFyYW1zLmdpZCxcblx0XHRcdFx0XHR1aWQ6IGN0cmwuY29udGFjdExpc3RbMF0udWlkKClcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHR1bmJpbmRXYXRjaCgpOyAvLyB1bmJpbmQgYXMgd2Ugb25seSB3YW50IG9uZSB1cGRhdGVcblx0XHR9KTtcblx0fSk7XG5cblx0Y3RybC5jcmVhdGVDb250YWN0ID0gZnVuY3Rpb24oKSB7XG5cdFx0Q29udGFjdFNlcnZpY2UuY3JlYXRlKCkudGhlbihmdW5jdGlvbihjb250YWN0KSB7XG5cdFx0XHRbJ3RlbCcsICdhZHInLCAnZW1haWwnXS5mb3JFYWNoKGZ1bmN0aW9uKGZpZWxkKSB7XG5cdFx0XHRcdHZhciBkZWZhdWx0VmFsdWUgPSB2Q2FyZFByb3BlcnRpZXNTZXJ2aWNlLmdldE1ldGEoZmllbGQpLmRlZmF1bHRWYWx1ZSB8fCB7dmFsdWU6ICcnfTtcblx0XHRcdFx0Y29udGFjdC5hZGRQcm9wZXJ0eShmaWVsZCwgZGVmYXVsdFZhbHVlKTtcblx0XHRcdH0gKTtcblx0XHRcdGlmICgkcm91dGVQYXJhbXMuZ2lkICE9PSB0KCdjb250YWN0cycsICdBbGwgY29udGFjdHMnKSkge1xuXHRcdFx0XHRjb250YWN0LmNhdGVnb3JpZXMoJHJvdXRlUGFyYW1zLmdpZCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjb250YWN0LmNhdGVnb3JpZXMoJycpO1xuXHRcdFx0fVxuXHRcdFx0JCgnI2RldGFpbHMtZnVsbE5hbWUnKS5mb2N1cygpO1xuXHRcdH0pO1xuXHR9O1xuXG5cdGN0cmwuaGFzQ29udGFjdHMgPSBmdW5jdGlvbiAoKSB7XG5cdFx0aWYgKCFjdHJsLmNvbnRhY3RzKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHRcdHJldHVybiBjdHJsLmNvbnRhY3RzLmxlbmd0aCA+IDA7XG5cdH07XG5cblx0JHNjb3BlLnNlbGVjdGVkQ29udGFjdElkID0gJHJvdXRlUGFyYW1zLnVpZDtcblx0JHNjb3BlLnNldFNlbGVjdGVkID0gZnVuY3Rpb24gKHNlbGVjdGVkQ29udGFjdElkKSB7XG5cdFx0JHNjb3BlLnNlbGVjdGVkQ29udGFjdElkID0gc2VsZWN0ZWRDb250YWN0SWQ7XG5cdH07XG5cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnY29udGFjdGxpc3QnLCBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHtcblx0XHRwcmlvcml0eTogMSxcblx0XHRzY29wZToge30sXG5cdFx0Y29udHJvbGxlcjogJ2NvbnRhY3RsaXN0Q3RybCcsXG5cdFx0Y29udHJvbGxlckFzOiAnY3RybCcsXG5cdFx0YmluZFRvQ29udHJvbGxlcjoge1xuXHRcdFx0YWRkcmVzc2Jvb2s6ICc9YWRyYm9vaydcblx0XHR9LFxuXHRcdHRlbXBsYXRlVXJsOiBPQy5saW5rVG8oJ2NvbnRhY3RzJywgJ3RlbXBsYXRlcy9jb250YWN0TGlzdC5odG1sJylcblx0fTtcbn0pO1xuIiwiYXBwLmNvbnRyb2xsZXIoJ2RldGFpbHNJdGVtQ3RybCcsIGZ1bmN0aW9uKCR0ZW1wbGF0ZVJlcXVlc3QsIHZDYXJkUHJvcGVydGllc1NlcnZpY2UsIENvbnRhY3RTZXJ2aWNlKSB7XG5cdHZhciBjdHJsID0gdGhpcztcblxuXHRjdHJsLm1ldGEgPSB2Q2FyZFByb3BlcnRpZXNTZXJ2aWNlLmdldE1ldGEoY3RybC5uYW1lKTtcblx0Y3RybC50eXBlID0gdW5kZWZpbmVkO1xuXHRjdHJsLnQgPSB7XG5cdFx0cG9Cb3ggOiB0KCdjb250YWN0cycsICdQb3N0IE9mZmljZSBCb3gnKSxcblx0XHRwb3N0YWxDb2RlIDogdCgnY29udGFjdHMnLCAnUG9zdGFsIENvZGUnKSxcblx0XHRjaXR5IDogdCgnY29udGFjdHMnLCAnQ2l0eScpLFxuXHRcdHN0YXRlIDogdCgnY29udGFjdHMnLCAnU3RhdGUgb3IgcHJvdmluY2UnKSxcblx0XHRjb3VudHJ5IDogdCgnY29udGFjdHMnLCAnQ291bnRyeScpLFxuXHRcdGFkZHJlc3M6IHQoJ2NvbnRhY3RzJywgJ0FkZHJlc3MnKSxcblx0XHRuZXdHcm91cDogdCgnY29udGFjdHMnLCAnKG5ldyBncm91cCknKVxuXHR9O1xuXG5cdGN0cmwuYXZhaWxhYmxlT3B0aW9ucyA9IGN0cmwubWV0YS5vcHRpb25zIHx8IFtdO1xuXHRpZiAoIV8uaXNVbmRlZmluZWQoY3RybC5kYXRhKSAmJiAhXy5pc1VuZGVmaW5lZChjdHJsLmRhdGEubWV0YSkgJiYgIV8uaXNVbmRlZmluZWQoY3RybC5kYXRhLm1ldGEudHlwZSkpIHtcblx0XHRjdHJsLnR5cGUgPSBjdHJsLmRhdGEubWV0YS50eXBlWzBdO1xuXHRcdGlmICghY3RybC5hdmFpbGFibGVPcHRpb25zLnNvbWUoZnVuY3Rpb24oZSkgeyByZXR1cm4gZS5pZCA9PT0gY3RybC5kYXRhLm1ldGEudHlwZVswXTsgfSApKSB7XG5cdFx0XHRjdHJsLmF2YWlsYWJsZU9wdGlvbnMgPSBjdHJsLmF2YWlsYWJsZU9wdGlvbnMuY29uY2F0KFt7aWQ6IGN0cmwuZGF0YS5tZXRhLnR5cGVbMF0sIG5hbWU6IGN0cmwuZGF0YS5tZXRhLnR5cGVbMF19XSk7XG5cdFx0fVxuXHR9XG5cdGN0cmwuYXZhaWxhYmxlR3JvdXBzID0gW107XG5cblx0Q29udGFjdFNlcnZpY2UuZ2V0R3JvdXBzKCkudGhlbihmdW5jdGlvbihncm91cHMpIHtcblx0XHRjdHJsLmF2YWlsYWJsZUdyb3VwcyA9IF8udW5pcXVlKGdyb3Vwcyk7XG5cdH0pO1xuXG5cdGN0cmwuY2hhbmdlVHlwZSA9IGZ1bmN0aW9uICh2YWwpIHtcblx0XHRjdHJsLmRhdGEubWV0YSA9IGN0cmwuZGF0YS5tZXRhIHx8IHt9O1xuXHRcdGN0cmwuZGF0YS5tZXRhLnR5cGUgPSBjdHJsLmRhdGEubWV0YS50eXBlIHx8IFtdO1xuXHRcdGN0cmwuZGF0YS5tZXRhLnR5cGVbMF0gPSB2YWw7XG5cdFx0Y3RybC5tb2RlbC51cGRhdGVDb250YWN0KCk7XG5cdH07XG5cblx0Y3RybC5nZXRUZW1wbGF0ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB0ZW1wbGF0ZVVybCA9IE9DLmxpbmtUbygnY29udGFjdHMnLCAndGVtcGxhdGVzL2RldGFpbEl0ZW1zLycgKyBjdHJsLm1ldGEudGVtcGxhdGUgKyAnLmh0bWwnKTtcblx0XHRyZXR1cm4gJHRlbXBsYXRlUmVxdWVzdCh0ZW1wbGF0ZVVybCk7XG5cdH07XG5cblx0Y3RybC5kZWxldGVGaWVsZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRjdHJsLm1vZGVsLmRlbGV0ZUZpZWxkKGN0cmwubmFtZSwgY3RybC5kYXRhKTtcblx0XHRjdHJsLm1vZGVsLnVwZGF0ZUNvbnRhY3QoKTtcblx0fTtcbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnZGV0YWlsc2l0ZW0nLCBbJyRjb21waWxlJywgZnVuY3Rpb24oJGNvbXBpbGUpIHtcblx0cmV0dXJuIHtcblx0XHRzY29wZToge30sXG5cdFx0Y29udHJvbGxlcjogJ2RldGFpbHNJdGVtQ3RybCcsXG5cdFx0Y29udHJvbGxlckFzOiAnY3RybCcsXG5cdFx0YmluZFRvQ29udHJvbGxlcjoge1xuXHRcdFx0bmFtZTogJz0nLFxuXHRcdFx0ZGF0YTogJz0nLFxuXHRcdFx0bW9kZWw6ICc9J1xuXHRcdH0sXG5cdFx0bGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBjdHJsKSB7XG5cdFx0XHRjdHJsLmdldFRlbXBsYXRlKCkudGhlbihmdW5jdGlvbihodG1sKSB7XG5cdFx0XHRcdHZhciB0ZW1wbGF0ZSA9IGFuZ3VsYXIuZWxlbWVudChodG1sKTtcblx0XHRcdFx0ZWxlbWVudC5hcHBlbmQodGVtcGxhdGUpO1xuXHRcdFx0XHQkY29tcGlsZSh0ZW1wbGF0ZSkoc2NvcGUpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9O1xufV0pO1xuIiwiYXBwLmNvbnRyb2xsZXIoJ2RldGFpbHNQaG90b0N0cmwnLCBmdW5jdGlvbigpIHtcblx0dmFyIGN0cmwgPSB0aGlzO1xufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdkZXRhaWxzcGhvdG8nLCBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHtcblx0XHRzY29wZToge30sXG5cdFx0Y29udHJvbGxlcjogJ2RldGFpbHNQaG90b0N0cmwnLFxuXHRcdGNvbnRyb2xsZXJBczogJ2N0cmwnLFxuXHRcdGJpbmRUb0NvbnRyb2xsZXI6IHtcblx0XHRcdGNvbnRhY3Q6ICc9ZGF0YSdcblx0XHR9LFxuXHRcdHRlbXBsYXRlVXJsOiBPQy5saW5rVG8oJ2NvbnRhY3RzJywgJ3RlbXBsYXRlcy9kZXRhaWxzUGhvdG8uaHRtbCcpXG5cdH07XG59KTtcbiIsImFwcC5jb250cm9sbGVyKCdncm91cEN0cmwnLCBmdW5jdGlvbigpIHtcblx0dmFyIGN0cmwgPSB0aGlzO1xufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdncm91cCcsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnQScsIC8vIGhhcyB0byBiZSBhbiBhdHRyaWJ1dGUgdG8gd29yayB3aXRoIGNvcmUgY3NzXG5cdFx0c2NvcGU6IHt9LFxuXHRcdGNvbnRyb2xsZXI6ICdncm91cEN0cmwnLFxuXHRcdGNvbnRyb2xsZXJBczogJ2N0cmwnLFxuXHRcdGJpbmRUb0NvbnRyb2xsZXI6IHtcblx0XHRcdGdyb3VwOiAnPWRhdGEnXG5cdFx0fSxcblx0XHR0ZW1wbGF0ZVVybDogT0MubGlua1RvKCdjb250YWN0cycsICd0ZW1wbGF0ZXMvZ3JvdXAuaHRtbCcpXG5cdH07XG59KTtcbiIsImFwcC5jb250cm9sbGVyKCdncm91cGxpc3RDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCBDb250YWN0U2VydmljZSwgJHJvdXRlUGFyYW1zKSB7XG5cblx0JHNjb3BlLmdyb3VwcyA9IFt0KCdjb250YWN0cycsICdBbGwgY29udGFjdHMnKV07XG5cblx0Q29udGFjdFNlcnZpY2UuZ2V0R3JvdXBzKCkudGhlbihmdW5jdGlvbihncm91cHMpIHtcblx0XHQkc2NvcGUuZ3JvdXBzID0gXy51bmlxdWUoW3QoJ2NvbnRhY3RzJywgJ0FsbCBjb250YWN0cycpXS5jb25jYXQoZ3JvdXBzKSk7XG5cdH0pO1xuXG5cdCRzY29wZS5zZWxlY3RlZEdyb3VwID0gJHJvdXRlUGFyYW1zLmdpZDtcblx0JHNjb3BlLnNldFNlbGVjdGVkID0gZnVuY3Rpb24gKHNlbGVjdGVkR3JvdXApIHtcblx0XHQkc2NvcGUuc2VsZWN0ZWRHcm91cCA9IHNlbGVjdGVkR3JvdXA7XG5cdH07XG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2dyb3VwbGlzdCcsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnRUEnLCAvLyBoYXMgdG8gYmUgYW4gYXR0cmlidXRlIHRvIHdvcmsgd2l0aCBjb3JlIGNzc1xuXHRcdHNjb3BlOiB7fSxcblx0XHRjb250cm9sbGVyOiAnZ3JvdXBsaXN0Q3RybCcsXG5cdFx0Y29udHJvbGxlckFzOiAnY3RybCcsXG5cdFx0YmluZFRvQ29udHJvbGxlcjoge30sXG5cdFx0dGVtcGxhdGVVcmw6IE9DLmxpbmtUbygnY29udGFjdHMnLCAndGVtcGxhdGVzL2dyb3VwTGlzdC5odG1sJylcblx0fTtcbn0pO1xuIiwiYXBwLmNvbnRyb2xsZXIoJ2ltYWdlUHJldmlld0N0cmwnLCBmdW5jdGlvbigkc2NvcGUpIHtcblx0dmFyIGN0cmwgPSB0aGlzO1xuXG5cdGN0cmwubG9hZEltYWdlID0gZnVuY3Rpb24oZmlsZSkge1xuXHRcdHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuXG5cdFx0cmVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHQkc2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQkc2NvcGUuaW1hZ2VwcmV2aWV3ID0gcmVhZGVyLnJlc3VsdDtcblx0XHRcdH0pO1xuXHRcdH0sIGZhbHNlKTtcblxuXHRcdGlmIChmaWxlKSB7XG5cdFx0XHRyZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKTtcblx0XHR9XG5cdH07XG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2ltYWdlcHJldmlldycsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4ge1xuXHRcdHNjb3BlOiB7XG5cdFx0XHRwaG90b0NhbGxiYWNrOiAnJmltYWdlcHJldmlldydcblx0XHR9LFxuXHRcdGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycywgY3RybCkge1xuXHRcdFx0ZWxlbWVudC5iaW5kKCdjaGFuZ2UnLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIGZpbGUgPSBlbGVtZW50LmdldCgwKS5maWxlc1swXTtcblx0XHRcdFx0dmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG5cblx0XHRcdFx0cmVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ2hpJywgc2NvcGUucGhvdG9DYWxsYmFjaygpICsgJycpO1xuXHRcdFx0XHRcdHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdHNjb3BlLnBob3RvQ2FsbGJhY2soKShyZWFkZXIucmVzdWx0KTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSwgZmFsc2UpO1xuXG5cdFx0XHRcdGlmIChmaWxlKSB7XG5cdFx0XHRcdFx0cmVhZGVyLnJlYWRBc0RhdGFVUkwoZmlsZSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblx0fTtcbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnZ3JvdXBNb2RlbCcsIGZ1bmN0aW9uKCRmaWx0ZXIpIHtcblx0cmV0dXJue1xuXHRcdHJlc3RyaWN0OiAnQScsXG5cdFx0cmVxdWlyZTogJ25nTW9kZWwnLFxuXHRcdGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRyLCBuZ01vZGVsKSB7XG5cdFx0XHRuZ01vZGVsLiRmb3JtYXR0ZXJzLnB1c2goZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdFx0aWYgKHZhbHVlLnRyaW0oKS5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0XHRyZXR1cm4gW107XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHZhbHVlLnNwbGl0KCcsJyk7XG5cdFx0XHR9KTtcblx0XHRcdG5nTW9kZWwuJHBhcnNlcnMucHVzaChmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHRyZXR1cm4gdmFsdWUuam9pbignLCcpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9O1xufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCd0ZWxNb2RlbCcsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm57XG5cdFx0cmVzdHJpY3Q6ICdBJyxcblx0XHRyZXF1aXJlOiAnbmdNb2RlbCcsXG5cdFx0bGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHIsIG5nTW9kZWwpIHtcblx0XHRcdG5nTW9kZWwuJGZvcm1hdHRlcnMucHVzaChmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHRyZXR1cm4gdmFsdWU7XG5cdFx0XHR9KTtcblx0XHRcdG5nTW9kZWwuJHBhcnNlcnMucHVzaChmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHRyZXR1cm4gdmFsdWU7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH07XG59KTtcbiIsImFwcC5mYWN0b3J5KCdBZGRyZXNzQm9vaycsIGZ1bmN0aW9uKClcbntcblx0cmV0dXJuIGZ1bmN0aW9uIEFkZHJlc3NCb29rKGRhdGEpIHtcblx0XHRhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XG5cblx0XHRcdGRpc3BsYXlOYW1lOiAnJyxcblx0XHRcdGNvbnRhY3RzOiBbXSxcblx0XHRcdGdyb3VwczogZGF0YS5kYXRhLnByb3BzLmdyb3VwcyxcblxuXHRcdFx0Z2V0Q29udGFjdDogZnVuY3Rpb24odWlkKSB7XG5cdFx0XHRcdGZvcih2YXIgaSBpbiB0aGlzLmNvbnRhY3RzKSB7XG5cdFx0XHRcdFx0aWYodGhpcy5jb250YWN0c1tpXS51aWQoKSA9PT0gdWlkKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdGhpcy5jb250YWN0c1tpXTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHRcdH0sXG5cblx0XHRcdHNoYXJlZFdpdGg6IHtcblx0XHRcdFx0dXNlcnM6IFtdLFxuXHRcdFx0XHRncm91cHM6IFtdXG5cdFx0XHR9XG5cblx0XHR9KTtcblx0XHRhbmd1bGFyLmV4dGVuZCh0aGlzLCBkYXRhKTtcblx0XHRhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XG5cdFx0XHRvd25lcjogZGF0YS51cmwuc3BsaXQoJy8nKS5zbGljZSgtMywgLTIpWzBdXG5cdFx0fSk7XG5cblx0XHR2YXIgc2hhcmVzID0gdGhpcy5kYXRhLnByb3BzLmludml0ZTtcblx0XHRpZiAodHlwZW9mIHNoYXJlcyAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdGZvciAodmFyIGogPSAwOyBqIDwgc2hhcmVzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdHZhciBocmVmID0gc2hhcmVzW2pdLmhyZWY7XG5cdFx0XHRcdGlmIChocmVmLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHZhciBhY2Nlc3MgPSBzaGFyZXNbal0uYWNjZXNzO1xuXHRcdFx0XHRpZiAoYWNjZXNzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIHJlYWRXcml0ZSA9ICh0eXBlb2YgYWNjZXNzLnJlYWRXcml0ZSAhPT0gJ3VuZGVmaW5lZCcpO1xuXG5cdFx0XHRcdGlmIChocmVmLnN0YXJ0c1dpdGgoJ3ByaW5jaXBhbDpwcmluY2lwYWxzL3VzZXJzLycpKSB7XG5cdFx0XHRcdFx0dGhpcy5zaGFyZWRXaXRoLnVzZXJzLnB1c2goe1xuXHRcdFx0XHRcdFx0aWQ6IGhyZWYuc3Vic3RyKDI3KSxcblx0XHRcdFx0XHRcdGRpc3BsYXluYW1lOiBocmVmLnN1YnN0cigyNyksXG5cdFx0XHRcdFx0XHR3cml0YWJsZTogcmVhZFdyaXRlXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0gZWxzZSBpZiAoaHJlZi5zdGFydHNXaXRoKCdwcmluY2lwYWw6cHJpbmNpcGFscy9ncm91cHMvJykpIHtcblx0XHRcdFx0XHR0aGlzLnNoYXJlZFdpdGguZ3JvdXBzLnB1c2goe1xuXHRcdFx0XHRcdFx0aWQ6IGhyZWYuc3Vic3RyKDI4KSxcblx0XHRcdFx0XHRcdGRpc3BsYXluYW1lOiBocmVmLnN1YnN0cigyOCksXG5cdFx0XHRcdFx0XHR3cml0YWJsZTogcmVhZFdyaXRlXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHQvL3ZhciBvd25lciA9IHRoaXMuZGF0YS5wcm9wcy5vd25lcjtcblx0XHQvL2lmICh0eXBlb2Ygb3duZXIgIT09ICd1bmRlZmluZWQnICYmIG93bmVyLmxlbmd0aCAhPT0gMCkge1xuXHRcdC8vXHRvd25lciA9IG93bmVyLnRyaW0oKTtcblx0XHQvL1x0aWYgKG93bmVyLnN0YXJ0c1dpdGgoJy9yZW1vdGUucGhwL2Rhdi9wcmluY2lwYWxzL3VzZXJzLycpKSB7XG5cdFx0Ly9cdFx0dGhpcy5fcHJvcGVydGllcy5vd25lciA9IG93bmVyLnN1YnN0cigzMyk7XG5cdFx0Ly9cdH1cblx0XHQvL31cblxuXHR9O1xufSk7XG4iLCJhcHAuZmFjdG9yeSgnQ29udGFjdCcsIGZ1bmN0aW9uKCRmaWx0ZXIpIHtcblx0cmV0dXJuIGZ1bmN0aW9uIENvbnRhY3QoYWRkcmVzc0Jvb2ssIHZDYXJkKSB7XG5cdFx0YW5ndWxhci5leHRlbmQodGhpcywge1xuXG5cdFx0XHRkYXRhOiB7fSxcblx0XHRcdHByb3BzOiB7fSxcblxuXHRcdFx0YWRkcmVzc0Jvb2tJZDogYWRkcmVzc0Jvb2suZGlzcGxheU5hbWUsXG5cblx0XHRcdHVpZDogZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdFx0aWYgKGFuZ3VsYXIuaXNEZWZpbmVkKHZhbHVlKSkge1xuXHRcdFx0XHRcdC8vIHNldHRlclxuXHRcdFx0XHRcdHJldHVybiB0aGlzLnNldFByb3BlcnR5KCd1aWQnLCB7IHZhbHVlOiB2YWx1ZSB9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBnZXR0ZXJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5nZXRQcm9wZXJ0eSgndWlkJykudmFsdWU7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cblx0XHRcdGZ1bGxOYW1lOiBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHRpZiAoYW5ndWxhci5pc0RlZmluZWQodmFsdWUpKSB7XG5cdFx0XHRcdFx0Ly8gc2V0dGVyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuc2V0UHJvcGVydHkoJ2ZuJywgeyB2YWx1ZTogdmFsdWUgfSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gZ2V0dGVyXG5cdFx0XHRcdFx0dmFyIHByb3BlcnR5ID0gdGhpcy5nZXRQcm9wZXJ0eSgnZm4nKTtcblx0XHRcdFx0XHRpZihwcm9wZXJ0eSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHByb3BlcnR5LnZhbHVlO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSxcblxuXHRcdFx0dGl0bGU6IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRcdGlmIChhbmd1bGFyLmlzRGVmaW5lZCh2YWx1ZSkpIHtcblx0XHRcdFx0XHQvLyBzZXR0ZXJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5zZXRQcm9wZXJ0eSgndGl0bGUnLCB7IHZhbHVlOiB2YWx1ZSB9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBnZXR0ZXJcblx0XHRcdFx0XHR2YXIgcHJvcGVydHkgPSB0aGlzLmdldFByb3BlcnR5KCd0aXRsZScpO1xuXHRcdFx0XHRcdGlmKHByb3BlcnR5KSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gcHJvcGVydHkudmFsdWU7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXG5cdFx0XHRvcmc6IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRcdHZhciBwcm9wZXJ0eSA9IHRoaXMuZ2V0UHJvcGVydHkoJ29yZycpO1xuXHRcdFx0XHRpZiAoYW5ndWxhci5pc0RlZmluZWQodmFsdWUpKSB7XG5cdFx0XHRcdFx0dmFyIHZhbCA9IHZhbHVlO1xuXHRcdFx0XHRcdC8vIHNldHRlclxuXHRcdFx0XHRcdGlmKHByb3BlcnR5ICYmIEFycmF5LmlzQXJyYXkocHJvcGVydHkudmFsdWUpKSB7XG5cdFx0XHRcdFx0XHR2YWwgPSBwcm9wZXJ0eS52YWx1ZTtcblx0XHRcdFx0XHRcdHZhbFswXSA9IHZhbHVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5zZXRQcm9wZXJ0eSgnb3JnJywgeyB2YWx1ZTogdmFsIH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIGdldHRlclxuXHRcdFx0XHRcdGlmKHByb3BlcnR5KSB7XG5cdFx0XHRcdFx0XHRpZiAoQXJyYXkuaXNBcnJheShwcm9wZXJ0eS52YWx1ZSkpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHByb3BlcnR5LnZhbHVlWzBdO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0cmV0dXJuIHByb3BlcnR5LnZhbHVlO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSxcblxuXHRcdFx0ZW1haWw6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQvLyBnZXR0ZXJcblx0XHRcdFx0dmFyIHByb3BlcnR5ID0gdGhpcy5nZXRQcm9wZXJ0eSgnZW1haWwnKTtcblx0XHRcdFx0aWYocHJvcGVydHkpIHtcblx0XHRcdFx0XHRyZXR1cm4gcHJvcGVydHkudmFsdWU7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblxuXHRcdFx0cGhvdG86IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgcHJvcGVydHkgPSB0aGlzLmdldFByb3BlcnR5KCdwaG90bycpO1xuXHRcdFx0XHRpZihwcm9wZXJ0eSkge1xuXHRcdFx0XHRcdHJldHVybiBwcm9wZXJ0eS52YWx1ZTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXG5cdFx0XHRjYXRlZ29yaWVzOiBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHRpZiAoYW5ndWxhci5pc0RlZmluZWQodmFsdWUpKSB7XG5cdFx0XHRcdFx0Ly8gc2V0dGVyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuc2V0UHJvcGVydHkoJ2NhdGVnb3JpZXMnLCB7IHZhbHVlOiB2YWx1ZSB9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBnZXR0ZXJcblx0XHRcdFx0XHR2YXIgcHJvcGVydHkgPSB0aGlzLmdldFByb3BlcnR5KCdjYXRlZ29yaWVzJyk7XG5cdFx0XHRcdFx0aWYocHJvcGVydHkpIHtcblx0XHRcdFx0XHRcdHJldHVybiBwcm9wZXJ0eS52YWx1ZS5zcGxpdCgnLCcpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gW107XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXG5cdFx0XHRnZXRQcm9wZXJ0eTogZnVuY3Rpb24obmFtZSkge1xuXHRcdFx0XHRpZiAodGhpcy5wcm9wc1tuYW1lXSkge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLnByb3BzW25hbWVdWzBdO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRhZGRQcm9wZXJ0eTogZnVuY3Rpb24obmFtZSwgZGF0YSkge1xuXHRcdFx0XHRkYXRhID0gYW5ndWxhci5jb3B5KGRhdGEpO1xuXHRcdFx0XHRpZighdGhpcy5wcm9wc1tuYW1lXSkge1xuXHRcdFx0XHRcdHRoaXMucHJvcHNbbmFtZV0gPSBbXTtcblx0XHRcdFx0fVxuXHRcdFx0XHR2YXIgaWR4ID0gdGhpcy5wcm9wc1tuYW1lXS5sZW5ndGg7XG5cdFx0XHRcdHRoaXMucHJvcHNbbmFtZV1baWR4XSA9IGRhdGE7XG5cblx0XHRcdFx0Ly8ga2VlcCB2Q2FyZCBpbiBzeW5jXG5cdFx0XHRcdHRoaXMuZGF0YS5hZGRyZXNzRGF0YSA9ICRmaWx0ZXIoJ0pTT04ydkNhcmQnKSh0aGlzLnByb3BzKTtcblx0XHRcdFx0cmV0dXJuIGlkeDtcblx0XHRcdH0sXG5cdFx0XHRzZXRQcm9wZXJ0eTogZnVuY3Rpb24obmFtZSwgZGF0YSkge1xuXHRcdFx0XHRpZighdGhpcy5wcm9wc1tuYW1lXSkge1xuXHRcdFx0XHRcdHRoaXMucHJvcHNbbmFtZV0gPSBbXTtcblx0XHRcdFx0fVxuXHRcdFx0XHR0aGlzLnByb3BzW25hbWVdWzBdID0gZGF0YTtcblxuXHRcdFx0XHQvLyBrZWVwIHZDYXJkIGluIHN5bmNcblx0XHRcdFx0dGhpcy5kYXRhLmFkZHJlc3NEYXRhID0gJGZpbHRlcignSlNPTjJ2Q2FyZCcpKHRoaXMucHJvcHMpO1xuXHRcdFx0fSxcblx0XHRcdHJlbW92ZVByb3BlcnR5OiBmdW5jdGlvbiAobmFtZSwgcHJvcCkge1xuXHRcdFx0XHRhbmd1bGFyLmNvcHkoXy53aXRob3V0KHRoaXMucHJvcHNbbmFtZV0sIHByb3ApLCB0aGlzLnByb3BzW25hbWVdKTtcblx0XHRcdFx0dGhpcy5kYXRhLmFkZHJlc3NEYXRhID0gJGZpbHRlcignSlNPTjJ2Q2FyZCcpKHRoaXMucHJvcHMpO1xuXHRcdFx0fSxcblx0XHRcdHNldEVUYWc6IGZ1bmN0aW9uKGV0YWcpIHtcblx0XHRcdFx0dGhpcy5kYXRhLmV0YWcgPSBldGFnO1xuXHRcdFx0fSxcblx0XHRcdHNldFVybDogZnVuY3Rpb24oYWRkcmVzc0Jvb2ssIHVpZCkge1xuXHRcdFx0XHR0aGlzLmRhdGEudXJsID0gYWRkcmVzc0Jvb2sudXJsICsgdWlkICsgJy52Y2YnO1xuXHRcdFx0fSxcblxuXHRcdFx0c3luY1ZDYXJkOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0Ly8ga2VlcCB2Q2FyZCBpbiBzeW5jXG5cdFx0XHRcdHRoaXMuZGF0YS5hZGRyZXNzRGF0YSA9ICRmaWx0ZXIoJ0pTT04ydkNhcmQnKSh0aGlzLnByb3BzKTtcblx0XHRcdH0sXG5cblx0XHRcdG1hdGNoZXM6IGZ1bmN0aW9uKHBhdHRlcm4pIHtcblx0XHRcdFx0aWYgKF8uaXNVbmRlZmluZWQocGF0dGVybikgfHwgcGF0dGVybi5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdGhpcy5kYXRhLmFkZHJlc3NEYXRhLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihwYXR0ZXJuLnRvTG93ZXJDYXNlKCkpICE9PSAtMTtcblx0XHRcdH1cblxuXHRcdH0pO1xuXG5cdFx0aWYoYW5ndWxhci5pc0RlZmluZWQodkNhcmQpKSB7XG5cdFx0XHRhbmd1bGFyLmV4dGVuZCh0aGlzLmRhdGEsIHZDYXJkKTtcblx0XHRcdGFuZ3VsYXIuZXh0ZW5kKHRoaXMucHJvcHMsICRmaWx0ZXIoJ3ZDYXJkMkpTT04nKSh0aGlzLmRhdGEuYWRkcmVzc0RhdGEpKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0YW5ndWxhci5leHRlbmQodGhpcy5wcm9wcywge1xuXHRcdFx0XHR2ZXJzaW9uOiBbe3ZhbHVlOiAnMy4wJ31dLFxuXHRcdFx0XHRmbjogW3t2YWx1ZTogJyd9XVxuXHRcdFx0fSk7XG5cdFx0XHR0aGlzLmRhdGEuYWRkcmVzc0RhdGEgPSAkZmlsdGVyKCdKU09OMnZDYXJkJykodGhpcy5wcm9wcyk7XG5cdFx0fVxuXG5cdFx0dmFyIHByb3BlcnR5ID0gdGhpcy5nZXRQcm9wZXJ0eSgnY2F0ZWdvcmllcycpO1xuXHRcdGlmKCFwcm9wZXJ0eSkge1xuXHRcdFx0dGhpcy5jYXRlZ29yaWVzKCcnKTtcblx0XHR9XG5cdH07XG59KTtcbiIsImFwcC5mYWN0b3J5KCdBZGRyZXNzQm9va1NlcnZpY2UnLCBmdW5jdGlvbihEYXZDbGllbnQsIERhdlNlcnZpY2UsIFNldHRpbmdzU2VydmljZSwgQWRkcmVzc0Jvb2ssIENvbnRhY3QpIHtcblxuXHR2YXIgYWRkcmVzc0Jvb2tzID0gW107XG5cblx0dmFyIGxvYWRBbGwgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gRGF2U2VydmljZS50aGVuKGZ1bmN0aW9uKGFjY291bnQpIHtcblx0XHRcdGFkZHJlc3NCb29rcyA9IGFjY291bnQuYWRkcmVzc0Jvb2tzLm1hcChmdW5jdGlvbihhZGRyZXNzQm9vaykge1xuXHRcdFx0XHRyZXR1cm4gbmV3IEFkZHJlc3NCb29rKGFkZHJlc3NCb29rKTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9O1xuXG5cdHJldHVybiB7XG5cdFx0Z2V0QWxsOiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBsb2FkQWxsKCkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuIGFkZHJlc3NCb29rcztcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRnZXRHcm91cHM6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiB0aGlzLmdldEFsbCgpLnRoZW4oZnVuY3Rpb24oYWRkcmVzc0Jvb2tzKSB7XG5cdFx0XHRcdHJldHVybiBhZGRyZXNzQm9va3MubWFwKGZ1bmN0aW9uIChlbGVtZW50KSB7XG5cdFx0XHRcdFx0cmV0dXJuIGVsZW1lbnQuZ3JvdXBzO1xuXHRcdFx0XHR9KS5yZWR1Y2UoZnVuY3Rpb24oYSwgYikge1xuXHRcdFx0XHRcdHJldHVybiBhLmNvbmNhdChiKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0Z2V0RW5hYmxlZDogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gRGF2U2VydmljZS50aGVuKGZ1bmN0aW9uKGFjY291bnQpIHtcblx0XHRcdFx0cmV0dXJuIGFjY291bnQuYWRkcmVzc0Jvb2tzLm1hcChmdW5jdGlvbihhZGRyZXNzQm9vaykge1xuXHRcdFx0XHRcdHJldHVybiBuZXcgQWRkcmVzc0Jvb2soYWRkcmVzc0Jvb2spO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRnZXREZWZhdWx0QWRkcmVzc0Jvb2s6IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIGFkZHJlc3NCb29rc1swXTtcblx0XHR9LFxuXG5cdFx0Z2V0QWRkcmVzc0Jvb2s6IGZ1bmN0aW9uKGRpc3BsYXlOYW1lKSB7XG5cdFx0XHRyZXR1cm4gRGF2U2VydmljZS50aGVuKGZ1bmN0aW9uKGFjY291bnQpIHtcblx0XHRcdFx0cmV0dXJuIERhdkNsaWVudC5nZXRBZGRyZXNzQm9vayh7ZGlzcGxheU5hbWU6ZGlzcGxheU5hbWUsIHVybDphY2NvdW50LmhvbWVVcmx9KS50aGVuKGZ1bmN0aW9uKGFkZHJlc3NCb29rKSB7XG5cdFx0XHRcdFx0YWRkcmVzc0Jvb2sgPSBuZXcgQWRkcmVzc0Jvb2soe1xuXHRcdFx0XHRcdFx0dXJsOiBhZGRyZXNzQm9va1swXS5ocmVmLFxuXHRcdFx0XHRcdFx0ZGF0YTogYWRkcmVzc0Jvb2tbMF1cblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRhZGRyZXNzQm9vay5kaXNwbGF5TmFtZSA9IGRpc3BsYXlOYW1lO1xuXHRcdFx0XHRcdHJldHVybiBhZGRyZXNzQm9vaztcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0Y3JlYXRlOiBmdW5jdGlvbihkaXNwbGF5TmFtZSkge1xuXHRcdFx0cmV0dXJuIERhdlNlcnZpY2UudGhlbihmdW5jdGlvbihhY2NvdW50KSB7XG5cdFx0XHRcdHJldHVybiBEYXZDbGllbnQuY3JlYXRlQWRkcmVzc0Jvb2soe2Rpc3BsYXlOYW1lOmRpc3BsYXlOYW1lLCB1cmw6YWNjb3VudC5ob21lVXJsfSk7XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0ZGVsZXRlOiBmdW5jdGlvbihhZGRyZXNzQm9vaykge1xuXHRcdFx0cmV0dXJuIERhdlNlcnZpY2UudGhlbihmdW5jdGlvbihhY2NvdW50KSB7XG5cdFx0XHRcdHJldHVybiBEYXZDbGllbnQuZGVsZXRlQWRkcmVzc0Jvb2soYWRkcmVzc0Jvb2spLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0YW5ndWxhci5jb3B5KF8ud2l0aG91dChhZGRyZXNzQm9va3MsIGFkZHJlc3NCb29rKSwgYWRkcmVzc0Jvb2tzKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0cmVuYW1lOiBmdW5jdGlvbihhZGRyZXNzQm9vaywgZGlzcGxheU5hbWUpIHtcblx0XHRcdHJldHVybiBEYXZTZXJ2aWNlLnRoZW4oZnVuY3Rpb24oYWNjb3VudCkge1xuXHRcdFx0XHRyZXR1cm4gRGF2Q2xpZW50LnJlbmFtZUFkZHJlc3NCb29rKGFkZHJlc3NCb29rLCB7ZGlzcGxheU5hbWU6ZGlzcGxheU5hbWUsIHVybDphY2NvdW50LmhvbWVVcmx9KTtcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRnZXQ6IGZ1bmN0aW9uKGRpc3BsYXlOYW1lKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5nZXRBbGwoKS50aGVuKGZ1bmN0aW9uKGFkZHJlc3NCb29rcykge1xuXHRcdFx0XHRyZXR1cm4gYWRkcmVzc0Jvb2tzLmZpbHRlcihmdW5jdGlvbiAoZWxlbWVudCkge1xuXHRcdFx0XHRcdHJldHVybiBlbGVtZW50LmRpc3BsYXlOYW1lID09PSBkaXNwbGF5TmFtZTtcblx0XHRcdFx0fSlbMF07XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0c3luYzogZnVuY3Rpb24oYWRkcmVzc0Jvb2spIHtcblx0XHRcdHJldHVybiBEYXZDbGllbnQuc3luY0FkZHJlc3NCb29rKGFkZHJlc3NCb29rKTtcblx0XHR9LFxuXG5cdFx0c2hhcmU6IGZ1bmN0aW9uKGFkZHJlc3NCb29rLCBzaGFyZVR5cGUsIHNoYXJlV2l0aCwgd3JpdGFibGUsIGV4aXN0aW5nU2hhcmUpIHtcblx0XHRcdHZhciB4bWxEb2MgPSBkb2N1bWVudC5pbXBsZW1lbnRhdGlvbi5jcmVhdGVEb2N1bWVudCgnJywgJycsIG51bGwpO1xuXHRcdFx0dmFyIG9TaGFyZSA9IHhtbERvYy5jcmVhdGVFbGVtZW50KCdvOnNoYXJlJyk7XG5cdFx0XHRvU2hhcmUuc2V0QXR0cmlidXRlKCd4bWxuczpkJywgJ0RBVjonKTtcblx0XHRcdG9TaGFyZS5zZXRBdHRyaWJ1dGUoJ3htbG5zOm8nLCAnaHR0cDovL293bmNsb3VkLm9yZy9ucycpO1xuXHRcdFx0eG1sRG9jLmFwcGVuZENoaWxkKG9TaGFyZSk7XG5cblx0XHRcdHZhciBvU2V0ID0geG1sRG9jLmNyZWF0ZUVsZW1lbnQoJ286c2V0Jyk7XG5cdFx0XHRvU2hhcmUuYXBwZW5kQ2hpbGQob1NldCk7XG5cblx0XHRcdHZhciBkSHJlZiA9IHhtbERvYy5jcmVhdGVFbGVtZW50KCdkOmhyZWYnKTtcblx0XHRcdGlmIChzaGFyZVR5cGUgPT09IE9DLlNoYXJlLlNIQVJFX1RZUEVfVVNFUikge1xuXHRcdFx0XHRkSHJlZi50ZXh0Q29udGVudCA9ICdwcmluY2lwYWw6cHJpbmNpcGFscy91c2Vycy8nO1xuXHRcdFx0fSBlbHNlIGlmIChzaGFyZVR5cGUgPT09IE9DLlNoYXJlLlNIQVJFX1RZUEVfR1JPVVApIHtcblx0XHRcdFx0ZEhyZWYudGV4dENvbnRlbnQgPSAncHJpbmNpcGFsOnByaW5jaXBhbHMvZ3JvdXBzLyc7XG5cdFx0XHR9XG5cdFx0XHRkSHJlZi50ZXh0Q29udGVudCArPSBzaGFyZVdpdGg7XG5cdFx0XHRvU2V0LmFwcGVuZENoaWxkKGRIcmVmKTtcblxuXHRcdFx0dmFyIG9TdW1tYXJ5ID0geG1sRG9jLmNyZWF0ZUVsZW1lbnQoJ286c3VtbWFyeScpO1xuXHRcdFx0b1N1bW1hcnkudGV4dENvbnRlbnQgPSB0KCdjb250YWN0cycsICd7YWRkcmVzc2Jvb2t9IHNoYXJlZCBieSB7b3duZXJ9Jywge1xuXHRcdFx0XHRhZGRyZXNzYm9vazogYWRkcmVzc0Jvb2suZGlzcGxheU5hbWUsXG5cdFx0XHRcdG93bmVyOiBhZGRyZXNzQm9vay5vd25lclxuXHRcdFx0fSk7XG5cdFx0XHRvU2V0LmFwcGVuZENoaWxkKG9TdW1tYXJ5KTtcblxuXHRcdFx0aWYgKHdyaXRhYmxlKSB7XG5cdFx0XHRcdHZhciBvUlcgPSB4bWxEb2MuY3JlYXRlRWxlbWVudCgnbzpyZWFkLXdyaXRlJyk7XG5cdFx0XHRcdG9TZXQuYXBwZW5kQ2hpbGQob1JXKTtcblx0XHRcdH1cblxuXHRcdFx0dmFyIGJvZHkgPSBvU2hhcmUub3V0ZXJIVE1MO1xuXG5cdFx0XHRyZXR1cm4gRGF2Q2xpZW50Lnhoci5zZW5kKFxuXHRcdFx0XHRkYXYucmVxdWVzdC5iYXNpYyh7bWV0aG9kOiAnUE9TVCcsIGRhdGE6IGJvZHl9KSxcblx0XHRcdFx0YWRkcmVzc0Jvb2sudXJsXG5cdFx0XHQpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0aWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gMjAwKSB7XG5cdFx0XHRcdFx0aWYgKCFleGlzdGluZ1NoYXJlKSB7XG5cdFx0XHRcdFx0XHRpZiAoc2hhcmVUeXBlID09PSBPQy5TaGFyZS5TSEFSRV9UWVBFX1VTRVIpIHtcblx0XHRcdFx0XHRcdFx0YWRkcmVzc0Jvb2suc2hhcmVkV2l0aC51c2Vycy5wdXNoKHtcblx0XHRcdFx0XHRcdFx0XHRpZDogc2hhcmVXaXRoLFxuXHRcdFx0XHRcdFx0XHRcdGRpc3BsYXluYW1lOiBzaGFyZVdpdGgsXG5cdFx0XHRcdFx0XHRcdFx0d3JpdGFibGU6IHdyaXRhYmxlXG5cdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0fSBlbHNlIGlmIChzaGFyZVR5cGUgPT09IE9DLlNoYXJlLlNIQVJFX1RZUEVfR1JPVVApIHtcblx0XHRcdFx0XHRcdFx0YWRkcmVzc0Jvb2suc2hhcmVkV2l0aC5ncm91cHMucHVzaCh7XG5cdFx0XHRcdFx0XHRcdFx0aWQ6IHNoYXJlV2l0aCxcblx0XHRcdFx0XHRcdFx0XHRkaXNwbGF5bmFtZTogc2hhcmVXaXRoLFxuXHRcdFx0XHRcdFx0XHRcdHdyaXRhYmxlOiB3cml0YWJsZVxuXHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0fSxcblxuXHRcdHVuc2hhcmU6IGZ1bmN0aW9uKGFkZHJlc3NCb29rLCBzaGFyZVR5cGUsIHNoYXJlV2l0aCkge1xuXHRcdFx0dmFyIHhtbERvYyA9IGRvY3VtZW50LmltcGxlbWVudGF0aW9uLmNyZWF0ZURvY3VtZW50KCcnLCAnJywgbnVsbCk7XG5cdFx0XHR2YXIgb1NoYXJlID0geG1sRG9jLmNyZWF0ZUVsZW1lbnQoJ286c2hhcmUnKTtcblx0XHRcdG9TaGFyZS5zZXRBdHRyaWJ1dGUoJ3htbG5zOmQnLCAnREFWOicpO1xuXHRcdFx0b1NoYXJlLnNldEF0dHJpYnV0ZSgneG1sbnM6bycsICdodHRwOi8vb3duY2xvdWQub3JnL25zJyk7XG5cdFx0XHR4bWxEb2MuYXBwZW5kQ2hpbGQob1NoYXJlKTtcblxuXHRcdFx0dmFyIG9SZW1vdmUgPSB4bWxEb2MuY3JlYXRlRWxlbWVudCgnbzpyZW1vdmUnKTtcblx0XHRcdG9TaGFyZS5hcHBlbmRDaGlsZChvUmVtb3ZlKTtcblxuXHRcdFx0dmFyIGRIcmVmID0geG1sRG9jLmNyZWF0ZUVsZW1lbnQoJ2Q6aHJlZicpO1xuXHRcdFx0aWYgKHNoYXJlVHlwZSA9PT0gT0MuU2hhcmUuU0hBUkVfVFlQRV9VU0VSKSB7XG5cdFx0XHRcdGRIcmVmLnRleHRDb250ZW50ID0gJ3ByaW5jaXBhbDpwcmluY2lwYWxzL3VzZXJzLyc7XG5cdFx0XHR9IGVsc2UgaWYgKHNoYXJlVHlwZSA9PT0gT0MuU2hhcmUuU0hBUkVfVFlQRV9HUk9VUCkge1xuXHRcdFx0XHRkSHJlZi50ZXh0Q29udGVudCA9ICdwcmluY2lwYWw6cHJpbmNpcGFscy9ncm91cHMvJztcblx0XHRcdH1cblx0XHRcdGRIcmVmLnRleHRDb250ZW50ICs9IHNoYXJlV2l0aDtcblx0XHRcdG9SZW1vdmUuYXBwZW5kQ2hpbGQoZEhyZWYpO1xuXHRcdFx0dmFyIGJvZHkgPSBvU2hhcmUub3V0ZXJIVE1MO1xuXG5cblx0XHRcdHJldHVybiBEYXZDbGllbnQueGhyLnNlbmQoXG5cdFx0XHRcdGRhdi5yZXF1ZXN0LmJhc2ljKHttZXRob2Q6ICdQT1NUJywgZGF0YTogYm9keX0pLFxuXHRcdFx0XHRhZGRyZXNzQm9vay51cmxcblx0XHRcdCkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRpZiAocmVzcG9uc2Uuc3RhdHVzID09PSAyMDApIHtcblx0XHRcdFx0XHRpZiAoc2hhcmVUeXBlID09PSBPQy5TaGFyZS5TSEFSRV9UWVBFX1VTRVIpIHtcblx0XHRcdFx0XHRcdGFkZHJlc3NCb29rLnNoYXJlZFdpdGgudXNlcnMgPSBhZGRyZXNzQm9vay5zaGFyZWRXaXRoLnVzZXJzLmZpbHRlcihmdW5jdGlvbih1c2VyKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiB1c2VyLmlkICE9PSBzaGFyZVdpdGg7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9IGVsc2UgaWYgKHNoYXJlVHlwZSA9PT0gT0MuU2hhcmUuU0hBUkVfVFlQRV9HUk9VUCkge1xuXHRcdFx0XHRcdFx0YWRkcmVzc0Jvb2suc2hhcmVkV2l0aC5ncm91cHMgPSBhZGRyZXNzQm9vay5zaGFyZWRXaXRoLmdyb3Vwcy5maWx0ZXIoZnVuY3Rpb24oZ3JvdXBzKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBncm91cHMuaWQgIT09IHNoYXJlV2l0aDtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvL3RvZG8gLSByZW1vdmUgZW50cnkgZnJvbSBhZGRyZXNzYm9vayBvYmplY3Rcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0fVxuXG5cblx0fTtcblxufSk7XG4iLCJ2YXIgY29udGFjdHM7XG5hcHAuc2VydmljZSgnQ29udGFjdFNlcnZpY2UnLCBmdW5jdGlvbihEYXZDbGllbnQsIEFkZHJlc3NCb29rU2VydmljZSwgQ29udGFjdCwgJHEsIENhY2hlRmFjdG9yeSwgdXVpZDQpIHtcblxuXHR2YXIgY2FjaGVGaWxsZWQgPSBmYWxzZTtcblxuXHRjb250YWN0cyA9IENhY2hlRmFjdG9yeSgnY29udGFjdHMnKTtcblxuXHR2YXIgb2JzZXJ2ZXJDYWxsYmFja3MgPSBbXTtcblxuXHR0aGlzLnJlZ2lzdGVyT2JzZXJ2ZXJDYWxsYmFjayA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5cdFx0b2JzZXJ2ZXJDYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG5cdH07XG5cblx0dmFyIG5vdGlmeU9ic2VydmVycyA9IGZ1bmN0aW9uKGV2ZW50TmFtZSwgdWlkKSB7XG5cdFx0dmFyIGV2ID0ge1xuXHRcdFx0ZXZlbnQ6IGV2ZW50TmFtZSxcblx0XHRcdHVpZDogdWlkLFxuXHRcdFx0Y29udGFjdHM6IGNvbnRhY3RzLnZhbHVlcygpXG5cdFx0fTtcblx0XHRhbmd1bGFyLmZvckVhY2gob2JzZXJ2ZXJDYWxsYmFja3MsIGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5cdFx0XHRjYWxsYmFjayhldik7XG5cdFx0fSk7XG5cdH07XG5cblx0dGhpcy5maWxsQ2FjaGUgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gQWRkcmVzc0Jvb2tTZXJ2aWNlLmdldEVuYWJsZWQoKS50aGVuKGZ1bmN0aW9uKGVuYWJsZWRBZGRyZXNzQm9va3MpIHtcblx0XHRcdHZhciBwcm9taXNlcyA9IFtdO1xuXHRcdFx0ZW5hYmxlZEFkZHJlc3NCb29rcy5mb3JFYWNoKGZ1bmN0aW9uKGFkZHJlc3NCb29rKSB7XG5cdFx0XHRcdHByb21pc2VzLnB1c2goXG5cdFx0XHRcdFx0QWRkcmVzc0Jvb2tTZXJ2aWNlLnN5bmMoYWRkcmVzc0Jvb2spLnRoZW4oZnVuY3Rpb24oYWRkcmVzc0Jvb2spIHtcblx0XHRcdFx0XHRcdGZvcih2YXIgaSBpbiBhZGRyZXNzQm9vay5vYmplY3RzKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnRhY3QgPSBuZXcgQ29udGFjdChhZGRyZXNzQm9vaywgYWRkcmVzc0Jvb2sub2JqZWN0c1tpXSk7XG5cdFx0XHRcdFx0XHRcdGNvbnRhY3RzLnB1dChjb250YWN0LnVpZCgpLCBjb250YWN0KTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KVxuXHRcdFx0XHQpO1xuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gJHEuYWxsKHByb21pc2VzKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRjYWNoZUZpbGxlZCA9IHRydWU7XG5cdFx0XHR9KTtcblx0XHR9KTtcblx0fTtcblxuXHR0aGlzLmdldEFsbCA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmKGNhY2hlRmlsbGVkID09PSBmYWxzZSkge1xuXHRcdFx0cmV0dXJuIHRoaXMuZmlsbENhY2hlKCkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuIGNvbnRhY3RzLnZhbHVlcygpO1xuXHRcdFx0fSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiAkcS53aGVuKGNvbnRhY3RzLnZhbHVlcygpKTtcblx0XHR9XG5cdH07XG5cblx0dGhpcy5nZXRHcm91cHMgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHRoaXMuZ2V0QWxsKCkudGhlbihmdW5jdGlvbihjb250YWN0cykge1xuXHRcdFx0cmV0dXJuIF8udW5pcShjb250YWN0cy5tYXAoZnVuY3Rpb24gKGVsZW1lbnQpIHtcblx0XHRcdFx0cmV0dXJuIGVsZW1lbnQuY2F0ZWdvcmllcygpO1xuXHRcdFx0fSkucmVkdWNlKGZ1bmN0aW9uKGEsIGIpIHtcblx0XHRcdFx0cmV0dXJuIGEuY29uY2F0KGIpO1xuXHRcdFx0fSwgW10pLnNvcnQoKSwgdHJ1ZSk7XG5cdFx0fSk7XG5cdH07XG5cblx0dGhpcy5nZXRCeUlkID0gZnVuY3Rpb24odWlkKSB7XG5cdFx0aWYoY2FjaGVGaWxsZWQgPT09IGZhbHNlKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5maWxsQ2FjaGUoKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gY29udGFjdHMuZ2V0KHVpZCk7XG5cdFx0XHR9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuICRxLndoZW4oY29udGFjdHMuZ2V0KHVpZCkpO1xuXHRcdH1cblx0fTtcblxuXHR0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uKG5ld0NvbnRhY3QsIGFkZHJlc3NCb29rKSB7XG5cdFx0YWRkcmVzc0Jvb2sgPSBhZGRyZXNzQm9vayB8fCBBZGRyZXNzQm9va1NlcnZpY2UuZ2V0RGVmYXVsdEFkZHJlc3NCb29rKCk7XG5cdFx0bmV3Q29udGFjdCA9IG5ld0NvbnRhY3QgfHwgbmV3IENvbnRhY3QoYWRkcmVzc0Jvb2spO1xuXHRcdHZhciBuZXdVaWQgPSB1dWlkNC5nZW5lcmF0ZSgpO1xuXHRcdG5ld0NvbnRhY3QudWlkKG5ld1VpZCk7XG5cdFx0bmV3Q29udGFjdC5zZXRVcmwoYWRkcmVzc0Jvb2ssIG5ld1VpZCk7XG5cdFx0bmV3Q29udGFjdC5hZGRyZXNzQm9va0lkID0gYWRkcmVzc0Jvb2suZGlzcGxheU5hbWU7XG5cblx0XHRyZXR1cm4gRGF2Q2xpZW50LmNyZWF0ZUNhcmQoXG5cdFx0XHRhZGRyZXNzQm9vayxcblx0XHRcdHtcblx0XHRcdFx0ZGF0YTogbmV3Q29udGFjdC5kYXRhLmFkZHJlc3NEYXRhLFxuXHRcdFx0XHRmaWxlbmFtZTogbmV3VWlkICsgJy52Y2YnXG5cdFx0XHR9XG5cdFx0KS50aGVuKGZ1bmN0aW9uKHhocikge1xuXHRcdFx0bmV3Q29udGFjdC5zZXRFVGFnKHhoci5nZXRSZXNwb25zZUhlYWRlcignRVRhZycpKTtcblx0XHRcdGNvbnRhY3RzLnB1dChuZXdVaWQsIG5ld0NvbnRhY3QpO1xuXHRcdFx0bm90aWZ5T2JzZXJ2ZXJzKCdjcmVhdGUnLCBuZXdVaWQpO1xuXHRcdFx0cmV0dXJuIG5ld0NvbnRhY3Q7XG5cdFx0fSkuY2F0Y2goZnVuY3Rpb24oZSkge1xuXHRcdFx0Y29uc29sZS5sb2coXCJDb3VsZG4ndCBjcmVhdGVcIiwgZSk7XG5cdFx0fSk7XG5cdH07XG5cblx0dGhpcy5tb3ZlQ29udGFjdCA9IGZ1bmN0aW9uIChjb250YWN0LCBhZGRyZXNzYm9vaykge1xuXHRcdGlmIChjb250YWN0LmFkZHJlc3NCb29rSWQgPT09IGFkZHJlc3Nib29rLmRpc3BsYXlOYW1lKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGNvbnRhY3Quc3luY1ZDYXJkKCk7XG5cdFx0dmFyIGNsb25lID0gYW5ndWxhci5jb3B5KGNvbnRhY3QpO1xuXG5cdFx0Ly8gY3JlYXRlIHRoZSBjb250YWN0IGluIHRoZSBuZXcgdGFyZ2V0IGFkZHJlc3Nib29rXG5cdFx0dGhpcy5jcmVhdGUoY2xvbmUsIGFkZHJlc3Nib29rKTtcblxuXHRcdC8vIGRlbGV0ZSB0aGUgb2xkIG9uZVxuXHRcdHRoaXMuZGVsZXRlKGNvbnRhY3QpO1xuXHR9O1xuXG5cdHRoaXMudXBkYXRlID0gZnVuY3Rpb24oY29udGFjdCkge1xuXHRcdGNvbnRhY3Quc3luY1ZDYXJkKCk7XG5cblx0XHQvLyB1cGRhdGUgY29udGFjdCBvbiBzZXJ2ZXJcblx0XHRyZXR1cm4gRGF2Q2xpZW50LnVwZGF0ZUNhcmQoY29udGFjdC5kYXRhLCB7anNvbjogdHJ1ZX0pLnRoZW4oZnVuY3Rpb24oeGhyKSB7XG5cdFx0XHR2YXIgbmV3RXRhZyA9IHhoci5nZXRSZXNwb25zZUhlYWRlcignRVRhZycpO1xuXHRcdFx0Y29udGFjdC5zZXRFVGFnKG5ld0V0YWcpO1xuXHRcdH0pO1xuXHR9O1xuXG5cdHRoaXMuZGVsZXRlID0gZnVuY3Rpb24oY29udGFjdCkge1xuXHRcdC8vIGRlbGV0ZSBjb250YWN0IGZyb20gc2VydmVyXG5cdFx0cmV0dXJuIERhdkNsaWVudC5kZWxldGVDYXJkKGNvbnRhY3QuZGF0YSkudGhlbihmdW5jdGlvbih4aHIpIHtcblx0XHRcdGNvbnRhY3RzLnJlbW92ZShjb250YWN0LnVpZCgpKTtcblx0XHRcdG5vdGlmeU9ic2VydmVycygnZGVsZXRlJywgY29udGFjdC51aWQoKSk7XG5cdFx0fSk7XG5cdH07XG59KTtcbiIsImFwcC5zZXJ2aWNlKCdEYXZDbGllbnQnLCBmdW5jdGlvbigpIHtcblx0dmFyIHhociA9IG5ldyBkYXYudHJhbnNwb3J0LkJhc2ljKFxuXHRcdG5ldyBkYXYuQ3JlZGVudGlhbHMoKVxuXHQpO1xuXHRyZXR1cm4gbmV3IGRhdi5DbGllbnQoeGhyKTtcbn0pOyIsImFwcC5zZXJ2aWNlKCdEYXZTZXJ2aWNlJywgZnVuY3Rpb24oRGF2Q2xpZW50KSB7XG5cdHJldHVybiBEYXZDbGllbnQuY3JlYXRlQWNjb3VudCh7XG5cdFx0c2VydmVyOiBPQy5saW5rVG9SZW1vdGVCYXNlKCdkYXYvYWRkcmVzc2Jvb2tzJyksXG5cdFx0YWNjb3VudFR5cGU6ICdjYXJkZGF2Jyxcblx0XHR1c2VQcm92aWRlZFBhdGg6IHRydWVcblx0fSk7XG59KTtcbiIsImFwcC5zZXJ2aWNlKCdTZXR0aW5nc1NlcnZpY2UnLCBmdW5jdGlvbigpIHtcblx0dmFyIHNldHRpbmdzID0ge1xuXHRcdGFkZHJlc3NCb29rczogW1xuXHRcdFx0J3Rlc3RBZGRyJ1xuXHRcdF1cblx0fTtcblxuXHR0aGlzLnNldCA9IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcblx0XHRzZXR0aW5nc1trZXldID0gdmFsdWU7XG5cdH07XG5cblx0dGhpcy5nZXQgPSBmdW5jdGlvbihrZXkpIHtcblx0XHRyZXR1cm4gc2V0dGluZ3Nba2V5XTtcblx0fTtcblxuXHR0aGlzLmdldEFsbCA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBzZXR0aW5ncztcblx0fTtcbn0pO1xuIiwiYXBwLnNlcnZpY2UoJ3ZDYXJkUHJvcGVydGllc1NlcnZpY2UnLCBmdW5jdGlvbigpIHtcblx0LyoqXG5cdCAqIG1hcCB2Q2FyZCBhdHRyaWJ1dGVzIHRvIGludGVybmFsIGF0dHJpYnV0ZXNcblx0ICpcblx0ICogcHJvcE5hbWU6IHtcblx0ICogXHRcdG11bHRpcGxlOiBbQm9vbGVhbl0sIC8vIGlzIHRoaXMgcHJvcCBhbGxvd2VkIG1vcmUgdGhhbiBvbmNlPyAoZGVmYXVsdCA9IGZhbHNlKVxuXHQgKiBcdFx0cmVhZGFibGVOYW1lOiBbU3RyaW5nXSwgLy8gaW50ZXJuYXRpb25hbGl6ZWQgcmVhZGFibGUgbmFtZSBvZiBwcm9wXG5cdCAqIFx0XHR0ZW1wbGF0ZTogW1N0cmluZ10sIC8vIHRlbXBsYXRlIG5hbWUgZm91bmQgaW4gL3RlbXBsYXRlcy9kZXRhaWxJdGVtc1xuXHQgKiBcdFx0Wy4uLl0gLy8gb3B0aW9uYWwgYWRkaXRpb25hbCBpbmZvcm1hdGlvbiB3aGljaCBtaWdodCBnZXQgdXNlZCBieSB0aGUgdGVtcGxhdGVcblx0ICogfVxuXHQgKi9cblx0dGhpcy52Q2FyZE1ldGEgPSB7XG5cdFx0bmlja25hbWU6IHtcblx0XHRcdHJlYWRhYmxlTmFtZTogdCgnY29udGFjdHMnLCAnTmlja25hbWUnKSxcblx0XHRcdHRlbXBsYXRlOiAndGV4dCdcblx0XHR9LFxuXHRcdG5vdGU6IHtcblx0XHRcdHJlYWRhYmxlTmFtZTogdCgnY29udGFjdHMnLCAnTm90ZXMnKSxcblx0XHRcdHRlbXBsYXRlOiAndGV4dGFyZWEnXG5cdFx0fSxcblx0XHR1cmw6IHtcblx0XHRcdG11bHRpcGxlOiB0cnVlLFxuXHRcdFx0cmVhZGFibGVOYW1lOiB0KCdjb250YWN0cycsICdXZWJzaXRlJyksXG5cdFx0XHR0ZW1wbGF0ZTogJ3VybCdcblx0XHR9LFxuXHRcdGNsb3VkOiB7XG5cdFx0XHRtdWx0aXBsZTogdHJ1ZSxcblx0XHRcdHJlYWRhYmxlTmFtZTogdCgnY29udGFjdHMnLCAnRmVkZXJhdGVkIENsb3VkIElEJyksXG5cdFx0XHR0ZW1wbGF0ZTogJ3RleHQnLFxuXHRcdFx0ZGVmYXVsdFZhbHVlOiB7XG5cdFx0XHRcdHZhbHVlOlsnJ10sXG5cdFx0XHRcdG1ldGE6e3R5cGU6WydIT01FJ119XG5cdFx0XHR9LFxuXHRcdFx0b3B0aW9uczogW1xuXHRcdFx0XHR7aWQ6ICdIT01FJywgbmFtZTogdCgnY29udGFjdHMnLCAnSG9tZScpfSxcblx0XHRcdFx0e2lkOiAnV09SSycsIG5hbWU6IHQoJ2NvbnRhY3RzJywgJ1dvcmsnKX0sXG5cdFx0XHRcdHtpZDogJ09USEVSJywgbmFtZTogdCgnY29udGFjdHMnLCAnT3RoZXInKX1cblx0XHRcdF1cdFx0fSxcblx0XHRhZHI6IHtcblx0XHRcdG11bHRpcGxlOiB0cnVlLFxuXHRcdFx0cmVhZGFibGVOYW1lOiB0KCdjb250YWN0cycsICdBZGRyZXNzJyksXG5cdFx0XHR0ZW1wbGF0ZTogJ2FkcicsXG5cdFx0XHRkZWZhdWx0VmFsdWU6IHtcblx0XHRcdFx0dmFsdWU6WycnLCAnJywgJycsICcnLCAnJywgJycsICcnXSxcblx0XHRcdFx0bWV0YTp7dHlwZTpbJ0hPTUUnXX1cblx0XHRcdH0sXG5cdFx0XHRvcHRpb25zOiBbXG5cdFx0XHRcdHtpZDogJ0hPTUUnLCBuYW1lOiB0KCdjb250YWN0cycsICdIb21lJyl9LFxuXHRcdFx0XHR7aWQ6ICdXT1JLJywgbmFtZTogdCgnY29udGFjdHMnLCAnV29yaycpfSxcblx0XHRcdFx0e2lkOiAnT1RIRVInLCBuYW1lOiB0KCdjb250YWN0cycsICdPdGhlcicpfVxuXHRcdFx0XVxuXHRcdH0sXG5cdFx0Y2F0ZWdvcmllczoge1xuXHRcdFx0cmVhZGFibGVOYW1lOiB0KCdjb250YWN0cycsICdHcm91cHMnKSxcblx0XHRcdHRlbXBsYXRlOiAnZ3JvdXBzJ1xuXHRcdH0sXG5cdFx0YmRheToge1xuXHRcdFx0cmVhZGFibGVOYW1lOiB0KCdjb250YWN0cycsICdCaXJ0aGRheScpLFxuXHRcdFx0dGVtcGxhdGU6ICdkYXRlJ1xuXHRcdH0sXG5cdFx0ZW1haWw6IHtcblx0XHRcdG11bHRpcGxlOiB0cnVlLFxuXHRcdFx0cmVhZGFibGVOYW1lOiB0KCdjb250YWN0cycsICdFbWFpbCcpLFxuXHRcdFx0dGVtcGxhdGU6ICd0ZXh0Jyxcblx0XHRcdGRlZmF1bHRWYWx1ZToge1xuXHRcdFx0XHR2YWx1ZTonJyxcblx0XHRcdFx0bWV0YTp7dHlwZTpbJ0hPTUUnXX1cblx0XHRcdH0sXG5cdFx0XHRvcHRpb25zOiBbXG5cdFx0XHRcdHtpZDogJ0hPTUUnLCBuYW1lOiB0KCdjb250YWN0cycsICdIb21lJyl9LFxuXHRcdFx0XHR7aWQ6ICdXT1JLJywgbmFtZTogdCgnY29udGFjdHMnLCAnV29yaycpfSxcblx0XHRcdFx0e2lkOiAnT1RIRVInLCBuYW1lOiB0KCdjb250YWN0cycsICdPdGhlcicpfVxuXHRcdFx0XVxuXHRcdH0sXG5cdFx0aW1wcDoge1xuXHRcdFx0bXVsdGlwbGU6IHRydWUsXG5cdFx0XHRyZWFkYWJsZU5hbWU6IHQoJ2NvbnRhY3RzJywgJ0luc3RhbnQgbWVzc2FnaW5nJyksXG5cdFx0XHR0ZW1wbGF0ZTogJ3RleHQnLFxuXHRcdFx0ZGVmYXVsdFZhbHVlOiB7XG5cdFx0XHRcdHZhbHVlOlsnJ10sXG5cdFx0XHRcdG1ldGE6e3R5cGU6WydIT01FJ119XG5cdFx0XHR9LFxuXHRcdFx0b3B0aW9uczogW1xuXHRcdFx0XHR7aWQ6ICdIT01FJywgbmFtZTogdCgnY29udGFjdHMnLCAnSG9tZScpfSxcblx0XHRcdFx0e2lkOiAnV09SSycsIG5hbWU6IHQoJ2NvbnRhY3RzJywgJ1dvcmsnKX0sXG5cdFx0XHRcdHtpZDogJ09USEVSJywgbmFtZTogdCgnY29udGFjdHMnLCAnT3RoZXInKX1cblx0XHRcdF1cblx0XHR9LFxuXHRcdHRlbDoge1xuXHRcdFx0bXVsdGlwbGU6IHRydWUsXG5cdFx0XHRyZWFkYWJsZU5hbWU6IHQoJ2NvbnRhY3RzJywgJ1Bob25lJyksXG5cdFx0XHR0ZW1wbGF0ZTogJ3RlbCcsXG5cdFx0XHRkZWZhdWx0VmFsdWU6IHtcblx0XHRcdFx0dmFsdWU6WycnXSxcblx0XHRcdFx0bWV0YTp7dHlwZTpbJ0hPTUUsVk9JQ0UnXX1cblx0XHRcdH0sXG5cdFx0XHRvcHRpb25zOiBbXG5cdFx0XHRcdHtpZDogJ0hPTUUsVk9JQ0UnLCBuYW1lOiB0KCdjb250YWN0cycsICdIb21lJyl9LFxuXHRcdFx0XHR7aWQ6ICdXT1JLLFZPSUNFJywgbmFtZTogdCgnY29udGFjdHMnLCAnV29yaycpfSxcblx0XHRcdFx0e2lkOiAnQ0VMTCcsIG5hbWU6IHQoJ2NvbnRhY3RzJywgJ01vYmlsZScpfSxcblx0XHRcdFx0e2lkOiAnRkFYJywgbmFtZTogdCgnY29udGFjdHMnLCAnRmF4Jyl9LFxuXHRcdFx0XHR7aWQ6ICdIT01FLEZBWCcsIG5hbWU6IHQoJ2NvbnRhY3RzJywgJ0ZheCBob21lJyl9LFxuXHRcdFx0XHR7aWQ6ICdXT1JLLEZBWCcsIG5hbWU6IHQoJ2NvbnRhY3RzJywgJ0ZheCB3b3JrJyl9LFxuXHRcdFx0XHR7aWQ6ICdQQUdFUicsIG5hbWU6IHQoJ2NvbnRhY3RzJywgJ1BhZ2VyJyl9LFxuXHRcdFx0XHR7aWQ6ICdWT0lDRScsIG5hbWU6IHQoJ2NvbnRhY3RzJywgJ1ZvaWNlJyl9XG5cdFx0XHRdXG5cdFx0fVxuXHR9O1xuXG5cdHRoaXMuZmllbGRPcmRlciA9IFtcblx0XHQnb3JnJyxcblx0XHQndGl0bGUnLFxuXHRcdCd0ZWwnLFxuXHRcdCdlbWFpbCcsXG5cdFx0J2FkcicsXG5cdFx0J2ltcHAnLFxuXHRcdCduaWNrJyxcblx0XHQnYmRheScsXG5cdFx0J3VybCcsXG5cdFx0J25vdGUnLFxuXHRcdCdjYXRlZ29yaWVzJyxcblx0XHQncm9sZSdcblx0XTtcblxuXHR0aGlzLmZpZWxkRGVmaW5pdGlvbnMgPSBbXTtcblx0Zm9yICh2YXIgcHJvcCBpbiB0aGlzLnZDYXJkTWV0YSkge1xuXHRcdHRoaXMuZmllbGREZWZpbml0aW9ucy5wdXNoKHtpZDogcHJvcCwgbmFtZTogdGhpcy52Q2FyZE1ldGFbcHJvcF0ucmVhZGFibGVOYW1lLCBtdWx0aXBsZTogISF0aGlzLnZDYXJkTWV0YVtwcm9wXS5tdWx0aXBsZX0pO1xuXHR9XG5cblx0dGhpcy5mYWxsYmFja01ldGEgPSBmdW5jdGlvbihwcm9wZXJ0eSkge1xuXHRcdGZ1bmN0aW9uIGNhcGl0YWxpemUoc3RyaW5nKSB7IHJldHVybiBzdHJpbmcuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHJpbmcuc2xpY2UoMSk7IH1cblx0XHRyZXR1cm4ge1xuXHRcdFx0bmFtZTogJ3Vua25vd24tJyArIHByb3BlcnR5LFxuXHRcdFx0cmVhZGFibGVOYW1lOiBjYXBpdGFsaXplKHByb3BlcnR5KSxcblx0XHRcdHRlbXBsYXRlOiAnaGlkZGVuJyxcblx0XHRcdG5lY2Vzc2l0eTogJ29wdGlvbmFsJ1xuXHRcdH07XG5cdH07XG5cblx0dGhpcy5nZXRNZXRhID0gZnVuY3Rpb24ocHJvcGVydHkpIHtcblx0XHRyZXR1cm4gdGhpcy52Q2FyZE1ldGFbcHJvcGVydHldIHx8IHRoaXMuZmFsbGJhY2tNZXRhKHByb3BlcnR5KTtcblx0fTtcblxufSk7XG4iLCJhcHAuZmlsdGVyKCdKU09OMnZDYXJkJywgZnVuY3Rpb24oKSB7XG5cdHJldHVybiBmdW5jdGlvbihpbnB1dCkge1xuXHRcdHJldHVybiB2Q2FyZC5nZW5lcmF0ZShpbnB1dCk7XG5cdH07XG59KTsiLCJhcHAuZmlsdGVyKCdjb250YWN0Q29sb3InLCBmdW5jdGlvbigpIHtcblx0cmV0dXJuIGZ1bmN0aW9uKGlucHV0KSB7XG5cdFx0dmFyIGNvbG9ycyA9IFtcblx0XHRcdFx0JyMwMDFmM2YnLFxuXHRcdFx0XHQnIzAwNzREOScsXG5cdFx0XHRcdCcjMzlDQ0NDJyxcblx0XHRcdFx0JyMzRDk5NzAnLFxuXHRcdFx0XHQnIzJFQ0M0MCcsXG5cdFx0XHRcdCcjRkY4NTFCJyxcblx0XHRcdFx0JyNGRjQxMzYnLFxuXHRcdFx0XHQnIzg1MTQ0YicsXG5cdFx0XHRcdCcjRjAxMkJFJyxcblx0XHRcdFx0JyNCMTBEQzknXG5cdFx0XHRdLCBhc2NpaVN1bSA9IDA7XG5cdFx0Zm9yKHZhciBpIGluIGlucHV0KSB7XG5cdFx0XHRhc2NpaVN1bSArPSBpbnB1dC5jaGFyQ29kZUF0KGkpO1xuXHRcdH1cblx0XHRyZXR1cm4gY29sb3JzW2FzY2lpU3VtICUgY29sb3JzLmxlbmd0aF07XG5cdH07XG59KTtcbiIsImFwcC5maWx0ZXIoJ2NvbnRhY3RHcm91cEZpbHRlcicsIGZ1bmN0aW9uKCkge1xuXHQndXNlIHN0cmljdCc7XG5cdHJldHVybiBmdW5jdGlvbiAoY29udGFjdHMsIGdyb3VwKSB7XG5cdFx0aWYgKHR5cGVvZiBjb250YWN0cyA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdHJldHVybiBjb250YWN0cztcblx0XHR9XG5cdFx0aWYgKHR5cGVvZiBncm91cCA9PT0gJ3VuZGVmaW5lZCcgfHwgZ3JvdXAudG9Mb3dlckNhc2UoKSA9PT0gdCgnY29udGFjdHMnLCAnQWxsIGNvbnRhY3RzJykudG9Mb3dlckNhc2UoKSkge1xuXHRcdFx0cmV0dXJuIGNvbnRhY3RzO1xuXHRcdH1cblx0XHR2YXIgZmlsdGVyID0gW107XG5cdFx0aWYgKGNvbnRhY3RzLmxlbmd0aCA+IDApIHtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgY29udGFjdHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aWYgKGNvbnRhY3RzW2ldLmNhdGVnb3JpZXMoKS5pbmRleE9mKGdyb3VwKSA+PSAwKSB7XG5cdFx0XHRcdFx0ZmlsdGVyLnB1c2goY29udGFjdHNbaV0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBmaWx0ZXI7XG5cdH07XG59KTtcbiIsImFwcC5maWx0ZXIoJ2ZpZWxkRmlsdGVyJywgZnVuY3Rpb24oKSB7XG5cdCd1c2Ugc3RyaWN0Jztcblx0cmV0dXJuIGZ1bmN0aW9uIChmaWVsZHMsIGNvbnRhY3QpIHtcblx0XHRpZiAodHlwZW9mIGZpZWxkcyA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdHJldHVybiBmaWVsZHM7XG5cdFx0fVxuXHRcdGlmICh0eXBlb2YgY29udGFjdCA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdHJldHVybiBmaWVsZHM7XG5cdFx0fVxuXHRcdHZhciBmaWx0ZXIgPSBbXTtcblx0XHRpZiAoZmllbGRzLmxlbmd0aCA+IDApIHtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgZmllbGRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGlmIChmaWVsZHNbaV0ubXVsdGlwbGUgKSB7XG5cdFx0XHRcdFx0ZmlsdGVyLnB1c2goZmllbGRzW2ldKTtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoXy5pc1VuZGVmaW5lZChjb250YWN0LmdldFByb3BlcnR5KGZpZWxkc1tpXS5pZCkpKSB7XG5cdFx0XHRcdFx0ZmlsdGVyLnB1c2goZmllbGRzW2ldKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gZmlsdGVyO1xuXHR9O1xufSk7XG4iLCJhcHAuZmlsdGVyKCdmaXJzdENoYXJhY3RlcicsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gZnVuY3Rpb24oaW5wdXQpIHtcblx0XHRyZXR1cm4gaW5wdXQuY2hhckF0KDApO1xuXHR9O1xufSk7XG4iLCJhcHAuZmlsdGVyKCdvcmRlckRldGFpbEl0ZW1zJywgZnVuY3Rpb24odkNhcmRQcm9wZXJ0aWVzU2VydmljZSkge1xuXHQndXNlIHN0cmljdCc7XG5cdHJldHVybiBmdW5jdGlvbihpdGVtcywgZmllbGQsIHJldmVyc2UpIHtcblxuXHRcdHZhciBmaWx0ZXJlZCA9IFtdO1xuXHRcdGFuZ3VsYXIuZm9yRWFjaChpdGVtcywgZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0ZmlsdGVyZWQucHVzaChpdGVtKTtcblx0XHR9KTtcblxuXHRcdHZhciBmaWVsZE9yZGVyID0gYW5ndWxhci5jb3B5KHZDYXJkUHJvcGVydGllc1NlcnZpY2UuZmllbGRPcmRlcik7XG5cdFx0Ly8gcmV2ZXJzZSB0byBtb3ZlIGN1c3RvbSBpdGVtcyB0byB0aGUgZW5kIChpbmRleE9mID09IC0xKVxuXHRcdGZpZWxkT3JkZXIucmV2ZXJzZSgpO1xuXG5cdFx0ZmlsdGVyZWQuc29ydChmdW5jdGlvbiAoYSwgYikge1xuXHRcdFx0aWYoZmllbGRPcmRlci5pbmRleE9mKGFbZmllbGRdKSA8IGZpZWxkT3JkZXIuaW5kZXhPZihiW2ZpZWxkXSkpIHtcblx0XHRcdFx0cmV0dXJuIDE7XG5cdFx0XHR9XG5cdFx0XHRpZihmaWVsZE9yZGVyLmluZGV4T2YoYVtmaWVsZF0pID4gZmllbGRPcmRlci5pbmRleE9mKGJbZmllbGRdKSkge1xuXHRcdFx0XHRyZXR1cm4gLTE7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gMDtcblx0XHR9KTtcblxuXHRcdGlmKHJldmVyc2UpIGZpbHRlcmVkLnJldmVyc2UoKTtcblx0XHRyZXR1cm4gZmlsdGVyZWQ7XG5cdH07XG59KTtcbiIsImFwcC5maWx0ZXIoJ3RvQXJyYXknLCBmdW5jdGlvbigpIHtcblx0cmV0dXJuIGZ1bmN0aW9uKG9iaikge1xuXHRcdGlmICghKG9iaiBpbnN0YW5jZW9mIE9iamVjdCkpIHJldHVybiBvYmo7XG5cdFx0cmV0dXJuIF8ubWFwKG9iaiwgZnVuY3Rpb24odmFsLCBrZXkpIHtcblx0XHRcdHJldHVybiBPYmplY3QuZGVmaW5lUHJvcGVydHkodmFsLCAnJGtleScsIHt2YWx1ZToga2V5fSk7XG5cdFx0fSk7XG5cdH07XG59KTtcbiIsImFwcC5maWx0ZXIoJ3ZDYXJkMkpTT04nLCBmdW5jdGlvbigpIHtcblx0cmV0dXJuIGZ1bmN0aW9uKGlucHV0KSB7XG5cdFx0cmV0dXJuIHZDYXJkLnBhcnNlKGlucHV0KTtcblx0fTtcbn0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
