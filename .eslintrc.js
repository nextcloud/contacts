module.exports = {
	ignorePatterns: ['src/**/*.d.ts'],
	globals: {
		appName: true,
		appVersion: true,
	},
	extends: [
		'@nextcloud/eslint-config/typescript',
	],
	rules: {
		// @nextcloud/vue has Button, Content components restricted by rule
		'vue/no-reserved-component-names': 'off',
	},
}
