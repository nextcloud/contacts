const path = require('path')
const webpack = require('webpack')
const webpackConfig = require('@nextcloud/webpack-vue-config')

webpackConfig.entry['files-action'] = path.join(__dirname, 'src', 'files-action.js')
webpackConfig.entry['admin-settings'] = path.join(__dirname, 'src', 'admin-settings.js')
webpackConfig.plugins.push(...[
	new webpack.IgnorePlugin({
		resourceRegExp: /^\.\/locale$/,
		contextRegExp: /moment$/,
	}),
])

webpackConfig.module.rules.push({
	  test: /\.tsx?$/,
	  use: 'ts-loader',
	  exclude: /node_modules/,
})

webpackConfig.resolve.extensions = ['.js', '.vue', '.ts', '.tsx']

module.exports = webpackConfig
