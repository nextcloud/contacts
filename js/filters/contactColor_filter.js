app.filter('contactColor', function() {
	return function(input) {
		var colors = [
			'#001f3f',
			'#0074D9',
			'#39CCCC',
			'#3D9970',
			'#2ECC40',
			'#FF851B',
			'#FF4136',
			'#85144b',
			'#F012BE',
			'#B10DC9'
		], asciiSum = 0;
		for(var i in input) {
			asciiSum += input.charCodeAt(i);
		}
		return colors[asciiSum % colors.length];
	};
});
