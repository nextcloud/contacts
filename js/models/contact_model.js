angular.module('contactsApp')
.factory('Contact', function($filter) {
	return function Contact(addressBook, vCard) {
		angular.extend(this, {

			data: {},
			props: {},

			dateProperties: ['bday', 'anniversary', 'deathdate'],

			addressBookId: addressBook.displayName,

			rev: function(value) {
				var model = this;
				if (angular.isDefined(value)) {
					// setter
					return model.setProperty('rev', { value: value });
				} else {
					// getter
					return model.getProperty('rev').value;
				}
			},

			uid: function(value) {
				var model = this;
				if (angular.isDefined(value)) {
					// setter
					return model.setProperty('uid', { value: value });
				} else {
					// getter
					return model.getProperty('uid').value;
				}
			},

			displayName: function() {
				return this.fullName() || this.org() || '';
			},

			fullName: function(value) {
				var model = this;
				if (angular.isDefined(value)) {
					// setter
					return this.setProperty('fn', { value: value });
				} else {
					// getter
					var property = model.getProperty('fn');
					if(property) {
						return property.value;
					}
					property = model.getProperty('n');
					if(property) {
						return property.value.join();
					}
					return undefined;
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

			photo: function(value) {
				if (angular.isDefined(value)) {
					// setter
					// splits image data into "data:image/jpeg" and base 64 encoded image
					var imageData = value.split(';base64,');
					var imageType = imageData[0].slice('data:'.length);
					if (!imageType.startsWith('image/')) {
						return;
					}
					imageType = imageType.substring(6).toUpperCase();

					return this.setProperty('photo', { value: imageData[1], meta: {type: [imageType], encoding: ['b']} });
				} else {
					var property = this.getProperty('photo');
					if(property) {
						var type = property.meta.type;
						if (angular.isArray(type)) {
							type = type[0];
						}
						if (!type.startsWith('image/')) {
							type = 'image/' + type.toLowerCase();
						}
						return 'data:' + type + ';base64,' + property.value;
					} else {
						return undefined;
					}
				}
			},

			categories: function(value) {
				if (angular.isDefined(value)) {
					// setter
					return this.setProperty('categories', { value: value });
				} else {
					// getter
					var property = this.getProperty('categories');
					if(property && property.value.length > 0) {
						return property.value.split(',');
					} else {
						return [];
					}
				}
			},

			formateDateAsRFC6350: function(name, data) {
				if (this.dateProperties.indexOf(name) !== -1) {
					var match = data.value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
					if (match) {
						data.value = match[1] + match[2] + match[3];
					}
				}

				return data;
			},

			formateDateForDisplay: function(name, data) {
				if (this.dateProperties.indexOf(name) !== -1) {
					var match = data.value.match(/^(\d{4})(\d{2})(\d{2})$/);
					if (match) {
						data.value = match[1] + '-' + match[2] + '-' + match[3];
					}
				}

				return data;
			},

			getProperty: function(name) {
				if (this.props[name]) {
					return this.formateDateForDisplay(name, this.props[name][0]);
				} else {
					return undefined;
				}
			},
			addProperty: function(name, data) {
				data = angular.copy(data);
				data = this.formateDateAsRFC6350(name, data);
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
				data = this.formateDateAsRFC6350(name, data);
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
				var self = this;

				_.each(this.dateProperties, function(name) {
					if (!_.isUndefined(self.props[name])) {
						// Set dates again to make sure they are in RFC-6350 format
						self.setProperty(name, self.props[name][0]);
					}
				});

				// keep vCard in sync
				this.data.addressData = $filter('JSON2vCard')(this.props);
			},

			matches: function(pattern) {
				if (_.isUndefined(pattern) || pattern.length === 0) {
					return true;
				}
				var model = this;
				var matchingProps = ['fn', 'title', 'org', 'email', 'nickname', 'note', 'url', 'cloud', 'adr', 'impp', 'tel'].filter(function (propName) {
					if (model.props[propName]) {
						return model.props[propName].filter(function (property) {
							if (!property.value) {
								return false;
							}
							if (_.isString(property.value)) {
								return property.value.toLowerCase().indexOf(pattern.toLowerCase()) !== -1;
							}
							if (_.isArray(property.value)) {
								return property.value.filter(function(v) {
									return v.toLowerCase().indexOf(pattern.toLowerCase()) !== -1;
								}).length > 0;
							}
							return false;
						}).length > 0;
					}
					return false;
				});
				return matchingProps.length > 0;
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
});
