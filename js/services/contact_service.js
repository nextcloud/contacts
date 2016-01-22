var contacts;
app.service('ContactService', [ 'DavClient', 'AddressBookService', 'Contact', '$q', 'CacheFactory', 'uuid4', function(DavClient, AddressBookService, Contact, $q, CacheFactory, uuid4) {

	contacts = CacheFactory('contacts');

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
			return $q.all(promises);
		});
	};

	this.getAll = function() {
		return this.fillCache().then(function() {
			var contactsArray = [];
			var keys = contacts.keys();

			keys.forEach(function(key) {
				contactsArray.push(contacts.get(key));
			});

			return contactsArray;
		});
	};

	this.getById = function(uid) {
		return contacts.get(uid);
	};

	this.create = function(newContact, addressBook) {
		newContact = newContact || new Contact();
		var newUid = uuid4.generate();
		newContact.uid(newUid);
		addressBook = addressBook || AddressBookService.getDefaultAddressBook();

		return DavClient.createCard(
			addressBook,
			{
				data: newContact.data.addressData,
				filename: newUid + '.vcf'
			}
		).then(function() {
			console.log("Successfully created");
			contacts.put(newUid, contact);
			return newContact;
		}).catch(function() {
			console.log("Couldn't create");
		});
	};

	this.update = function(contact) {
		console.log('a', contact);
		// update contact on server
		return DavClient.updateCard(contact.data, {json: true}).then(function(xhr){
			console.log('hello!!!!');
			var newEtag = xhr.getResponseHeader('ETag');
			console.log('hello2', contact);
			contact.setETag(newEtag);
			console.log('hello3');
			console.log('b', contact);
		});
	};

	this.delete = function(contact) {
		// delete contact from server
		return DavClient.deleteCard(contact);
	};

	this.fromArray = function(array) {
		// from array to contact
	};
}]);
