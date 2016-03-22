angular.module('contactsApp')
.filter('contactColor', function() {
	return function(input) {
		function hslToRgb(h, s, l) {
			var r, g, b;
			if (s === 0) {
				r = g = b = l;
			} else {
				var hue2rgb = function hue2rgb(p, q, t) {
					if(t < 0) t += 1;
					if(t > 1) t -= 1;
					if(t < 1/6) return p + (q - p) * 6 * t;
					if(t < 1/2) return q;
					if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
					return p;
				};
				var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
				var p = 2 * l - q;
				r = hue2rgb(p, q, h + 1/3);
				g = hue2rgb(p, q, h);
				b = hue2rgb(p, q, h - 1/3);
			}
			return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
		}

		var hash = input.split('-').join('');
		var result = 0;
		var sat = 80;
		var lum = 68;
		for(var i in hash) {
			result += parseInt(hash.charAt(i), 16)/16;
		}
		result = result * 360;
		var rgb = hslToRgb(result, sat, lum);
		var bright = Math.sqrt( 0.299 * Math.pow(rgb[0], 2) + 0.587 * Math.pow(rgb[1], 2) + 0.114 * Math.pow(rgb[2], 2) );
		if (bright >= 200) {
			sat = 60;
		}
		return 'hsl('+result+', '+sat+'%, '+lum+'%)';
	};
});
