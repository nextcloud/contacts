const path = require('path')
const webpack = require('webpack')
const webpackConfig = require('@nextcloud/webpack-vue-config')

webpackConfig.entry['files-action'] = path.join(__dirname, 'src', 'files-action.js')
webpackConfig.entry['admin-settings'] = path.join(__dirname, 'src', 'admin-settings.js')
webpackConfig.plugins.push(...[
	new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
])

module.exports = webpackConfig
