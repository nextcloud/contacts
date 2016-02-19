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