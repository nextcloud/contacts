const path = require('path')
const webpackConfig = require('@nextcloud/webpack-vue-config')
const webpackRules = require('@nextcloud/webpack-vue-config/rules')

webpackConfig.entry['files-action'] = path.join(__dirname, 'src', 'files-action.js')
webpackConfig.entry['admin-settings'] = path.join(__dirname, 'src', 'admin-settings.js')

// Include mdi icons as raw svg strings
webpackRules.RULE_SVG = {
	resourceQuery: /raw/,
	type: 'asset/source',
}
webpackConfig.module.rules = Object.values(webpackRules)

webpackConfig.resolve.fallback = { fs: false }

module.exports = webpackConfig
