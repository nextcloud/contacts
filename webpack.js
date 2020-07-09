
const path = require('path')
const webpack = require('webpack')
const { merge } = require('webpack-merge')
const webpackConfig = require('@nextcloud/webpack-vue-config')

const config = {
	entry: {
		'files-action': path.join(__dirname, 'src', 'files_action.js'),
	},
	plugins: [
		new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
	],
}

if (process.env.NODE_ENV === 'production') {
	module.exports = merge(config, webpackConfig.prod)
}
module.exports = merge(config, webpackConfig.dev)
