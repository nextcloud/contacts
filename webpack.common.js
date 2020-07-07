const path = require('path')
const webpack = require('webpack')
const { VueLoaderPlugin } = require('vue-loader')
const StyleLintPlugin = require('stylelint-webpack-plugin')
const packageJson = require('./package.json')
const appVersion = JSON.stringify(packageJson.version)

module.exports = {
	entry: {
<<<<<<< HEAD
		adminSettings: path.join(__dirname, 'src', 'adminSettings.js'),
		contacts: path.join(__dirname, 'src', 'main.js'),
=======
		[appName]: path.join(__dirname, 'src', 'main.js'),
		'contacts-files-action': path.join(__dirname, 'src', 'files_action.js'),
>>>>>>> fa9c8847... Import vcf from files
	},
	output: {
		path: path.resolve(__dirname, './js'),
		publicPath: '/js/',
<<<<<<< HEAD
		chunkFilename: 'chunks/[name]-[hash].js'
=======
		filename: '[name].js',
		chunkFilename: 'chunks/[name]-[hash].js',
>>>>>>> fa9c8847... Import vcf from files
	},
	module: {
		rules: [
			{
				test: /\.css$/,
				use: ['vue-style-loader', 'css-loader'],
			},
			{
				test: /\.scss$/,
				use: ['vue-style-loader', 'css-loader', 'sass-loader'],
			},
			{
				test: /\.(js|vue)$/,
				use: 'eslint-loader',
				exclude: /node_modules/,
				enforce: 'pre',
			},
			{
				test: /\.vue$/,
				loader: 'vue-loader',
				exclude: /node_modules/,
			},
			{
				test: /\.js$/,
				loader: 'babel-loader',
				exclude: /node_modules/,
			}
		]
	},
	plugins: [
		new VueLoaderPlugin(),
		new StyleLintPlugin(),
		new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
		new webpack.DefinePlugin({ appVersion }),
	],
	resolve: {
		extensions: ['*', '.js', '.vue'],
		symlinks: false,
	},
}
