module.exports = {
	root: true,
	env: {
		browser: true,
		es6: true,
		node: true,
		jest: true
	},
	globals: {
		t: false,
		n: false,
		OC: false,
		OCA: false
	},
	parserOptions: {
		parser: 'babel-eslint'
	},
	extends: [
		'eslint:recommended',
		'plugin:node/recommended',
		'plugin:vue/recommended',
		'standard'
	],
	plugins: ['vue', 'node'],
	rules: {
		// space before function ()
		'space-before-function-paren': ['error', 'never'],
		// curly braces always space
		'object-curly-spacing': ['error', 'always'],
		// stay consistent with array brackets
		'array-bracket-newline': ['error', 'consistent'],
		// 1tbs brace style
		'brace-style': 'error',
		// tabs only
		indent: ['error', 'tab'],
		'no-tabs': 0,
		// es6 import/export and require
		'node/no-unpublished-require': ['off'],
		'node/no-unsupported-features': ['off'],
		// vue format
		'vue/html-indent': ['error', 'tab'],
		'vue/max-attributes-per-line': [
			'error',
			{
				singleline: 3,
				multiline: {
					max: 3,
					allowFirstLine: true
				}
			}
		]
	}
};
