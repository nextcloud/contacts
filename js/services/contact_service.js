angular.module('contactsApp')
.service('ContactService', function(DavClient, AddressBookService, Contact, $routeParams, $q, CacheFactory, uuid4, vCardPropertiesService ) {

	var cacheFilled = false;

	var contacts = CacheFactory('contacts');
	var urlsByDisplayname = CacheFactory('urlsByDisplayname');

	var observerCallbacks = [];

	var loadPromise = undefined;

	var newContactJustAdded = false;


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

	this.getFullContacts = function getFullContacts(names) {
		AddressBookService.getAll().then(function (enabledAddressBooks) {
			var promises = [];
			enabledAddressBooks.forEach(function (addressBook) {
				var urlLists = names.map(function (name) { return urlsByDisplayname.get(name); });
				var urls = [].concat.apply([], urlLists);
				var promise = DavClient.getContacts(addressBook, {}, urls)
						.then(
							function (vcards) {
								return vcards.map(function (vcard) {
									return new Contact(addressBook, vcard);
								});
							})
						.then(function (contacts_) {
							contacts_.map(function (contact) {
								contacts.put(contact.uid(), contact);
							});
						});
				promises.push(promise);
			});
			$q.all(promises).then(function () {
				notifyObservers('getFullContacts', '');
			});
		});
	};

	this.fillCache = function() {
		if (_.isUndefined(loadPromise)) {
			loadPromise = AddressBookService.getAll().then(function (enabledAddressBooks) {
				var promises = [];
				enabledAddressBooks.forEach(function (addressBook) {
					promises.push(
						AddressBookService.sync(addressBook).then(function (addressBook) {
							for (var i in addressBook.objects) {
								if (addressBook.objects[i].addressData) {
									var contact = new Contact(addressBook, addressBook.objects[i]);
									contacts.put(contact.uid(), contact);
									var oldList = urlsByDisplayname.get(contact.displayName()) || [];
									urlsByDisplayname.put(contact.displayName(), oldList.concat(contact.data.url));
								} else {
									// eslint-disable-next-line no-console
									console.log('Invalid contact received: ' + addressBook.objects[i].url);
								}
							}
						})
					);
				});
				return $q.all(promises).then(function () {
					cacheFilled = true;
				});
			});
		}
		return loadPromise;
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

	// get list of groups and the count of contacts in said groups
	this.getGroupList = function () {
		return this.getAll().then(function(contacts) {
			// the translated names for all and not-grouped are used in filtering, they must be exactly like this
			var allContacts = [t('contacts', 'All contacts'), contacts.length];
			var notGrouped =
				[t('contacts', 'Not grouped'),
					contacts.filter(
						function (contact) {
							 return contact.categories().length === 0;
						}).length
				];

			// allow groups with names such as toString
			var otherGroups = Object.create(null);

			// collect categories and their associated counts
			contacts.forEach(function (contact) {
				contact.categories().forEach(function (category) {
					otherGroups[category] = otherGroups[category] ? otherGroups[category] + 1 : 1;
				});
			});

			return [allContacts, notGrouped]
				.concat(_.keys(otherGroups).map(
					function (key) {
						return [key, otherGroups[key]];
					}));


		});
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

	this.updateNewContactJustAdded = function () {
		newContactJustAdded = true;
	};

	this.getById = function(addressBooks, uid) {
		return (function () {
			if(cacheFilled === false) {
				return this.fillCache().then(function() {
					return contacts.get(uid);
				});
			} else {
				return $q.when(contacts.get(uid));
			}
		}).call(this)
			.then(function (contact) {
				var addressBook = _.find(addressBooks, function(book) {
					return book.displayName === contact.addressBookId;
				});
				return addressBook
					? DavClient.getContacts(addressBook, {}, [ contact.data.url ]).then(
						function (vcards) {


							var newContact = new Contact(addressBook, vcards[0]);
							if(newContactJustAdded === true) {
								['tel', 'adr', 'email'].forEach(function(field) {
									var defaultValue = vCardPropertiesService.getMeta(field).defaultValue || {value: ''};
									newContact.addProperty(field, defaultValue);
								} );
								if ([t('contacts', 'All contacts'), t('contacts', 'Not grouped')].indexOf($routeParams.gid) === -1) {
									newContact.categories([ $routeParams.gid ]);
								} else {
									newContact.categories([]);
								}
								newContactJustAdded = false;
							}
							return newContact;
						}
						//function (vcards) { return new Contact(addressBook, vcards[0]); }
					).then(function (contact) {
						contacts.put(contact.uid(), contact);
						notifyObservers('getFullContacts', contact.uid());
						return contact;
					}) : contact;
			});
	};

	this.create = function(newContact, addressBook, uid) {
		addressBook = addressBook || AddressBookService.getDefaultAddressBook();
		try {
			newContact = newContact || new Contact(addressBook);
		} catch(error) {
			OC.Notification.showTemporary(t('contacts', 'Contact could not be created.'));
		}
		var newUid = '';
		if(uuid4.validate(uid)) {
			newUid = uid;
		} else {
			newUid = uuid4.generate();
		}
		newContact.uid(newUid);
		newContact.setUrl(addressBook, newUid);
		newContact.addressBookId = addressBook.displayName;
		if (_.isUndefined(newContact.fullName()) || newContact.fullName() === '') {
			newContact.fullName(t('contacts', 'New contact'));
		}

		return DavClient.createCard(
			addressBook,
			{
				data: newContact.data.addressData,
				filename: newUid + '.vcf'
			}
		).then(function(xhr) {
			if (!(_.isUndefined(newContact.fullName()) || newContact.fullName() === '')) {
				newContact.setETag(xhr.getResponseHeader('ETag'));
				contacts.put(newUid, newContact);
				notifyObservers('create', newUid);
				$('#details-fullName').select();
				return newContact;
			}
		}).catch(function() {
			OC.Notification.showTemporary(t('contacts', 'Contact could not be created.'));
		});

	};

	this.import = function(data, type, addressBook, progressCallback) {
		addressBook = addressBook || AddressBookService.getDefaultAddressBook();

		var regexp = /BEGIN:VCARD[\s\S]*?END:VCARD/mgi;
		var singleVCards = data.match(regexp);

		if (!singleVCards) {
			OC.Notification.showTemporary(t('contacts', 'No contacts in file. Only vCard files are allowed.'));
			if (progressCallback) {
				progressCallback(1);
			}
			return;
		}
		var num = 1;
		for(var i in singleVCards) {
			var newContact = new Contact(addressBook, {addressData: singleVCards[i]});
			if (['3.0', '4.0'].indexOf(newContact.version()) < 0) {
				if (progressCallback) {
					progressCallback(num / singleVCards.length);
				}
				OC.Notification.showTemporary(t('contacts', 'Only vCard version 4.0 (RFC6350) or version 3.0 (RFC2426) are supported.'));
				num++;
				continue;
			}
			this.create(newContact, addressBook).then(function() {
				// Update the progress indicator
				if (progressCallback) {
					progressCallback(num / singleVCards.length);
				}
				num++;
			});
		}
	};

	this.moveContact = function (contact, addressbook) {
		if (contact.addressBookId === addressbook.displayName) {
			return;
		}
		contact.syncVCard();
		var clone = angular.copy(contact);
		var uid = contact.uid();

		// delete the old one before to avoid conflict
		this.delete(contact);

		// create the contact in the new target addressbook
		this.create(clone, addressbook, uid);
	};

	this.update = function(contact) {
		// update rev field
		contact.syncVCard();

		// update contact on server
		return DavClient.updateCard(contact.data, {json: true}).then(function(xhr) {
			var newEtag = xhr.getResponseHeader('ETag');
			contact.setETag(newEtag);
			notifyObservers('update', contact.uid());
		}).catch(function() {
			OC.Notification.showTemporary(t('contacts', 'Contact could not be saved.'));
		});
	};

	this.delete = function(contact) {
		// delete contact from server
		return DavClient.deleteCard(contact.data).then(function() {
			contacts.remove(contact.uid());
			notifyObservers('delete', contact.uid());
		});
	};
});
