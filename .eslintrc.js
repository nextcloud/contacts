module.exports = {
	globals: {
		appName: true,
		appVersion: true,
	},

	plugins: ['import'],
	extends: ['@nextcloud'],

	settings: {
		'import/parsers': {
			'@typescript-eslint/parser': ['.ts', '.tsx'],
		},
		'import/resolver': {
			typescript: {
				alwaysTryTypes: true,
				paths: './tsconfig.json',
			},
		},
	},

	rules: {
		'vue/no-reserved-component-names': 'off', // @nextcloud/vue has Button, Content components restricted by rule
	},
}
