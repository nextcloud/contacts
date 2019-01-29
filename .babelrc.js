module.exports = {
	plugins: ['@babel/plugin-syntax-dynamic-import'],
	presets: [
		[
			'@babel/preset-env',
			{
				targets: {
					browsers: ['> 0.5%', 'not IE 11', 'not dead']
				},
				useBuiltIns: 'usage'
			}
		]
	]
}
