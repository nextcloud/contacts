angular.module('contactsApp')
.filter('contactColor', function() {
	return function(input) {
		// Check if core has the new color generator
		if(typeof input.toRgb === 'function') {
			var rgb = input.toRgb();
			return 'rgb('+rgb['r']+', '+rgb['g']+', '+rgb['b']+')';
		} else if(typeof input.toHsl === 'function') {
			var hsl = input.toHsl();
			return 'hsl('+hsl[0]+', '+hsl[1]+'%, '+hsl[2]+'%)';
		} else {
			// If not, we use the old one
			/* global md5 */
			var hash = md5(input).substring(0, 4),
				maxRange = parseInt('ffff', 16),
				hue = parseInt(hash, 16) / maxRange * 256;
			return 'hsl(' + hue + ', 90%, 65%)';
		}
	};
});