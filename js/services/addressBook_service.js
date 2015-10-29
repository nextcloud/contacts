app.service('AddressBookService', ['DavService', function(DavService){

	return DavService.then(function(account) {
		return account.addressBooks;
	});
}]);