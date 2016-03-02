app.factory('Contact', [ '$filter', function($filter) {
	return function Contact(addressBook, vCard) {
		angular.extend(this, {

			data: {},
			props: {},

			getSingleProperties: function() {
				var singleProperties = [];
				for(var prop in this.props) {
					if(this.props.hasOwnProperty(prop)) {
						var index = 0;
						this.props[prop].forEach(function(propData) {
							singleProperties.push({ name: prop, data: propData, index: index++ });
						});
					}
				}
				return singleProperties;
			},

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
			removeProperty: function (name, index) {
				delete this.props[name][index];
				this.data.addressData = $filter('JSON2vCard')(this.props);
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

		});

		if(angular.isDefined(vCard)) {
			angular.extend(this.data, vCard);
			angular.extend(this.props, $filter('vCard2JSON')(this.data.addressData));
		} else {
			angular.extend(this.props, {
				version: [{value: "3.0"}],
				fn: [{value: ""}]
			});
			this.data.addressData = $filter('JSON2vCard')(this.props);
		}
	};
}]);
