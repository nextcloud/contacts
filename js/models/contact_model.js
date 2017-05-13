angular.module('contactsApp')
.factory('Contact', function($filter, MimeService) {
	return function Contact(addressBook, vCard) {
		angular.extend(this, {

			data: {},
			props: {},
			failedProps: [],

			dateProperties: ['bday', 'anniversary', 'deathdate'],

			addressBookId: addressBook.displayName,

			version: function() {
				var property = this.getProperty('version');
				if(property) {
					return property.value;
				}

				return undefined;
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

			sortFirstName: function() {
				return [this.firstName(), this.lastName()];
			},

			sortLastName: function() {
				return [this.lastName(), this.firstName()];
			},

			sortDisplayName: function() {
				return this.displayName();
			},

			displayName: function() {
				var displayName = this.fullName() || this.org() || '';
				if(angular.isArray(displayName)) {
					return displayName.join(' ');
				}
				return displayName;
			},

			readableFilename: function() {
				if(this.displayName()) {
					return (this.displayName()) + '.vcf';
				} else {
					// fallback to default filename (see download attribute)
					return '';
				}

			},

			firstName: function() {
				var property = this.getProperty('n');
				if (property) {
					return property.value[1];
				} else {
					return this.displayName();
				}
			},

			lastName: function() {
				var property = this.getProperty('n');
				if (property) {
					return property.value[0];
				} else {
					return this.displayName();
				}
			},

			additionalNames: function() {
				var property = this.getProperty('n');
				if (property) {
					return property.value[2];
				} else {
					return '';
				}
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
						return property.value.filter(function(elem) {
							return elem;
						}).join(' ');
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
					var property = this.validate('photo', this.getProperty('photo'));
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
					if (angular.isString(value)) {
						/* check for empty string */
						this.setProperty('categories', { value: !value.length ? [] : [value] });
					} else if (angular.isArray(value)) {
						this.setProperty('categories', { value: value });
					}
				} else {
					// getter
					var property = this.validate('categories', this.getProperty('categories'));
					if(!property) {
						return [];
					}
					if (angular.isArray(property.value)) {
						return property.value;
					}
					return [property.value];
				}
			},

			formatDateAsRFC6350: function(name, data) {
				if (angular.isUndefined(data) || angular.isUndefined(data.value)) {
					return data;
				}
				if (this.dateProperties.indexOf(name) !== -1) {
					var match = data.value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
					if (match) {
						data.value = match[1] + match[2] + match[3];
					}
				}

				return data;
			},

			formatDateForDisplay: function(name, data) {
				if (angular.isUndefined(data) || angular.isUndefined(data.value)) {
					return data;
				}
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
					return this.formatDateForDisplay(name, this.props[name][0]);
				} else {
					return undefined;
				}
			},
			addProperty: function(name, data) {
				data = angular.copy(data);
				data = this.formatDateAsRFC6350(name, data);
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
				data = this.formatDateAsRFC6350(name, data);
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

			getISODate: function(date) {
				function pad(number) {
					if (number < 10) {
						return '0' + number;
					}
					return '' + number;
				}

				return date.getUTCFullYear() + '' +
						pad(date.getUTCMonth() + 1) +
						pad(date.getUTCDate()) +
						'T' + pad(date.getUTCHours()) +
						pad(date.getUTCMinutes()) +
						pad(date.getUTCSeconds()) + 'Z';
			},

			syncVCard: function() {

				this.setProperty('rev', { value: this.getISODate(new Date()) });
				var self = this;

				_.each(this.dateProperties, function(name) {
					if (!angular.isUndefined(self.props[name]) && !angular.isUndefined(self.props[name][0])) {
						// Set dates again to make sure they are in RFC-6350 format
						self.setProperty(name, self.props[name][0]);
					}
				});
				// force fn to be set
				this.fullName(this.fullName());

				// keep vCard in sync
				self.data.addressData = $filter('JSON2vCard')(self.props);

				// Revalidate all props
				_.each(self.failedProps, function(name, index) {
					if (!angular.isUndefined(self.props[name]) && !angular.isUndefined(self.props[name][0])) {
						// Reset previously failed properties
						self.failedProps.splice(index, 1);
						// And revalidate them again
						self.validate(name, self.props[name][0]);

					} else if(angular.isUndefined(self.props[name]) || angular.isUndefined(self.props[name][0])) {
						// Property has been removed
						self.failedProps.splice(index, 1);
					}
				});

			},

			matches: function(pattern) {
				if (angular.isUndefined(pattern) || pattern.length === 0) {
					return true;
				}
				var model = this;
				var matchingProps = ['fn', 'title', 'org', 'email', 'nickname', 'note', 'url', 'cloud', 'adr', 'impp', 'tel', 'gender'].filter(function (propName) {
					if (model.props[propName]) {
						return model.props[propName].filter(function (property) {
							if (!property.value) {
								return false;
							}
							if (angular.isString(property.value)) {
								return property.value.toLowerCase().indexOf(pattern.toLowerCase()) !== -1;
							}
							if (angular.isArray(property.value)) {
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
			},

			/* eslint-disable no-console */
			validate: function(prop, property) {
				switch(prop) {
				case 'categories':
					// Avoid unescaped commas
					if (angular.isArray(property.value)) {
						if(property.value.join(';').indexOf(',') !== -1) {
							this.failedProps.push(prop);
							property.value = property.value.join(',').split(',');
							//console.warn(this.uid()+': Categories split: ' + property.value);
						}
					} else if (angular.isString(property.value)) {
						if(property.value.indexOf(',') !== -1) {
							this.failedProps.push(prop);
							property.value = property.value.split(',');
							//console.warn(this.uid()+': Categories split: ' + property.value);
						}
					}
					if(property.value.length !== 0) {
						// Remove duplicate categories
						var uniqueCategories = _.unique(property.value);
						if(!angular.equals(uniqueCategories, property.value)) {
							this.failedProps.push(prop);
							property.value = uniqueCategories;
							//console.warn(this.uid()+': Categories duplicate: ' + property.value);
						}
					}
					break;
				case 'photo':
					// Avoid undefined photo type
					if (angular.isDefined(property)) {
						if (angular.isUndefined(property.meta.type)) {
							var mime = MimeService.b64mime(property.value);
							if (mime) {
								this.failedProps.push(prop);
								property.meta.type=[mime];
								this.setProperty('photo', {value:property.value,
														   meta:{type:property.meta.type,
																 encoding:property.meta.encoding}});
								console.warn(this.uid()+': Photo detected as ' + property.meta.type);
							} else {
								this.failedProps.push(prop);
								this.removeProperty('photo', property);
								property = undefined;
								console.warn(this.uid()+': Photo removed');
							}
						}
					}
					break;
				}
				return property;
			}
			/* eslint-enable no-console */

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
			// categories should always have the same type (an array)
			this.categories([]);
		} else {
			if (angular.isString(property.value)) {
				this.categories([property.value]);
			}
		}
	};
});
