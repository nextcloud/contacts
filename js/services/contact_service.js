angular.module('contactsApp')
.service('ContactService', function(DavClient, AddressBookService, Contact, $q, CacheFactory, uuid4) {

	var contactService = this;

	var cacheFilled = false;
	var contactsCache = CacheFactory('contacts');
	var observerCallbacks = [];
	var loadPromise = undefined;

	this.registerObserverCallback = function(callback) {
		observerCallbacks.push(callback);
	};

	var notifyObservers = function(eventName, uid) {
		var ev = {
			event: eventName,
			uid: uid,
			contacts: contactsCache.values()
		};
		angular.forEach(observerCallbacks, function(callback) {
			callback(ev);
		});
	};

	this.getFullContacts = function(contacts) {
		AddressBookService.getAll().then(function (enabledAddressBooks) {
			var promises = [];
			var xhrAddressBooks = [];
			contacts.forEach(function (contact) {
				// Regroup urls by addressbooks
				if(enabledAddressBooks.indexOf(contact.data.addressBook) !== -1) {
					// Initiate array if no exists
					xhrAddressBooks[contact.addressBookId] = xhrAddressBooks[contact.addressBookId] || [];
					xhrAddressBooks[contact.addressBookId].push(contact.data.url);
				}
			});
			// Get our full vCards
			enabledAddressBooks.forEach(function(addressBook) {
				if(angular.isArray(xhrAddressBooks[addressBook.displayName])) {
					var promise = DavClient.getContacts(addressBook, {}, xhrAddressBooks[addressBook.displayName]).then(
						function (vcards) {
							return vcards.map(function (vcard) {
								return new Contact(addressBook, vcard);
							});
						}).then(function (contacts_) {
							contacts_.map(function (contact) {
								// Validate some fields
								if(contact.fix()) {
									// Can't use this in those nested functions
									contactService.update(contact);
								}
								contactsCache.put(contact.uid(), contact);
							});
						});
					promises.push(promise);
				}
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
							addressBook.objects.forEach(function(vcard) {
								try {
									var contact = new Contact(addressBook, vcard);
									contactsCache.put(contact.uid(), contact);
								} catch(error) {
									// eslint-disable-next-line no-console
									console.log('Invalid contact received: ', vcard);
								}
							});
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
				return contactsCache.values();
			});
		} else {
			return $q.when(contactsCache.values());
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

	this.getById = function(addressBooks, uid) {
		return (function () {
			if(cacheFilled === false) {
				return this.fillCache().then(function() {
					return contactsCache.get(uid);
				});
			} else {
				return $q.when(contactsCache.get(uid));
			}
		}).call(this)
			.then(function (contact) {
				if(angular.isUndefined(contact)) {
					OC.Notification.showTemporary(t('contacts', 'Contact not found.'));
					return;
				} else {
					var addressBook = _.find(addressBooks, function(book) {
						return book.displayName === contact.addressBookId;
					});
					return addressBook
						? DavClient.getContacts(addressBook, {}, [ contact.data.url ]).then(
							function (vcards) { return new Contact(addressBook, vcards[0]); }
						).then(function (contact) {
							contactsCache.put(contact.uid(), contact);
							notifyObservers('getFullContacts', contact.uid());
							return contact;
						}) : contact;
				}
			});
	};

	this.create = function(newContact, addressBook, uid, fromImport) {
		addressBook = addressBook || AddressBookService.getDefaultAddressBook();
		if(addressBook.readOnly) {
			OC.Notification.showTemporary(t('contacts', 'You don\'t have permission to write to this addressbook.'));
			return;
		}
		try {
			newContact = newContact || new Contact(addressBook);
		} catch(error) {
			OC.Notification.showTemporary(t('contacts', 'Contact could not be created.'));
			return;
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
			newContact.fullName(newContact.displayName());
		}

		return DavClient.createCard(
			addressBook,
			{
				data: newContact.data.addressData,
				filename: newUid + '.vcf'
			}
		).then(function(xhr) {
			newContact.setETag(xhr.getResponseHeader('ETag'));
			contactsCache.put(newUid, newContact);
			if (fromImport !== true) {
				notifyObservers('create', newUid);
				$('#details-fullName').select();
			}
			return newContact;
		}).catch(function() {
			OC.Notification.showTemporary(t('contacts', 'Contact could not be created.'));
			return false;
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

		notifyObservers('importstart');

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
			this.create(newContact, addressBook, '', true).then(function(xhrContact) {
				if (xhrContact !== false) {
					var xhrContactName = xhrContact.displayName();
				}
				// Update the progress indicator
				if (progressCallback) {
					progressCallback(num / singleVCards.length, xhrContactName);
				}
				num++;
				/* Import is over, let's notify */
				if(num >= singleVCards.length) {
					notifyObservers('importend');
				}
			});
		}
	};

	this.moveContact = function (contact, addressBook) {
		if (contact.addressBookId === addressBook.displayName) {
			return;
		}
		if(addressBook.readOnly) {
			OC.Notification.showTemporary(t('contacts', 'You don\'t have permission to write to this addressbook.'));
			return;
		}
		contact.syncVCard();
		var uid = contact.uid();

		// Delete on server
		DavClient.deleteCard(contact.data).then(function() {
			// Create new on server
			DavClient.createCard(
				addressBook,
				{
					data: contact.data.addressData,
					filename: uid + '.vcf'
				}
			).then(function(xhr) {
				// Edit local cached contact
				contact.setETag(xhr.getResponseHeader('ETag'));
				contact.setAddressBook(addressBook);
			});
		});
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
			contactsCache.remove(contact.uid());
			notifyObservers('delete', contact.uid());
		});
	};

	this.updateDeletedAddressbook = function(callback) {
		// Delete contacts which addressbook has been removed from cache
		AddressBookService.getAll().then(function (enabledAddressBooks) {
			var addressBooksIds = [];
			angular.forEach(enabledAddressBooks, function(addressBook) {
				addressBooksIds.push(addressBook.displayName);
			});
			angular.forEach(contactsCache.values(), function(contact) {
				if (addressBooksIds.indexOf(contact.addressBookId) === -1) {
					contactsCache.remove(contact.uid());
				}
			});
			callback();
			notifyObservers('groupsUpdate');
		});
	};

});
