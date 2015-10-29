app.factory('Contact', function(ContactService)
{
	return function Contact(jCard) {
		angular.extend(this, {

			jCard: [],

			name: function(value) {
				var name = this.getProperty('n');
				if (angular.isDefined(value)) {
					// setter
					this.setPropertyValue(name, value);
				} else {
					// getter
					return this.getPropertyValue(name);
				}

			},

			getProperty: function(name) {
				var contact = this;
				if(!angular.isDefined(contact.jCard.addressData[1])) {
					return undefined;
				}
				var properties = contact.jCard.addressData[1];
				for(var i in properties) {
					if(properties[i][0] === name)
						return properties[i];
				}
				return undefined;
			},

			getPropertyValue: function(property) {
				if(property[3] instanceof Array) {
					return property[3].join(' ');
				} else {
					return property[3];
				}
			},

			setPropertyValue: function(property, propertyValue) {
				property[3] = propertyValue;
				this.update();
			},

			update: function() {
				ContactService.update(this.jCard);
			}

		});
		angular.extend(this.jCard, jCard);
	};
});