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