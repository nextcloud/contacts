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