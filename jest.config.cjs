/**
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
const esModules = [
	'p-limit',
].join('|')

module.exports = {
	preset: 'ts-jest',
	moduleFileExtensions: ['js', 'vue', 'ts'],
	collectCoverageFrom: [
		'src/**/*.{js,vue}',
		'!**/node_modules/**',
	],
	setupFilesAfterEnv: [
		'<rootDir>/tests/setup.js',
	],
	testEnvironment: 'jsdom',
	transform: {
		'^.+\\.ts$': 'ts-jest',
		'^.+\\.js$': 'babel-jest',
		'^.+\\.vue$': '@vue/vue2-jest',
		'^.+\\.(css|styl|less|sass|scss|jpg|jpeg|png|svg|gif|eot|otf|webp|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|avif)$': 'jest-transform-stub',
	},
	transformIgnorePatterns: [`/node_modules/(?!${esModules})/.+\\.js$`],
	testPathIgnorePatterns: ['tests/javascript/e2e'],
}
