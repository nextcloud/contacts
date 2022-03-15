const esModules = ['p-limit', 'yocto-queue'].join('|')

module.exports = {
	preset: 'ts-jest',
	moduleFileExtensions: ['js', 'vue', 'ts'],
	collectCoverageFrom: [
		'src/**/*.{js,vue}',
		'!**/node_modules/**',
	],
	coverageReporters: [
		'html',
		'text-summary',
	],
	setupFilesAfterEnv: [
		'<rootDir>/tests/setup.js',
	],
	testEnvironment: 'jsdom',
	transform: {
		'^.+\\.ts$': 'ts-jest',
		'^.+\\.js$': 'babel-jest',
		'^.+\\.vue$': '@vue/vue2-jest',
	},
	transformIgnorePatterns: [`/node_modules/(?!${esModules})`],
}
