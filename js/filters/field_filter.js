app.filter('fieldFilter', [
	function() {
		'use strict';
		return function (fields, contact) {
			if (typeof fields === "undefined") {
				return fields;
			}
			if (typeof contact === "undefined") {
				return fields;
			}
			var filter = [];
			if (fields.length > 0) {
				for (var i = 0; i < fields.length; i++) {
					if (fields[i].multiple ) {
						filter.push(fields[i]);
						continue;
					}
					if (_.isUndefined(contact.getProperty(fields[i].id))) {
						filter.push(fields[i]);
					}
				}
			}
			return filter;
		};
	}
]);
