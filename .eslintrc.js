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
}
