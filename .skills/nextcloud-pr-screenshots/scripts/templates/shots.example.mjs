/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// Example shot list. Copy it to ~/.cache/nc-pr-shots/<repo>/<pr>/shots.mjs and edit it.
// Run:  node <skill>/scripts/run.mjs shots.mjs --seed          (add --explore first to pick selectors)
//
// Each scene gets its own browser page. `setup` runs once per viewport (or once in total with
// keepOnResize: true), then `capture` runs for every viewport × theme of the scene.
//
// nc.open(app, '/sub/path')       open an app page and wait until it settles
// nc.openNavigation()             open the collapsed app navigation (mobile/tablet)
// nc.openAppSettings()            open the app's settings dialog
// nc.shot(label, { target, all, pad, fullPage })   screenshot (target: selector or locator)
// nc.closeup(target, label)       2x crop of one element
// nc.delay(urlGlob) → release()   hold requests to show a loading state
// nc.fail(urlGlob, status)        make requests fail to show an error state
// nc.showToasts()                 toasts are hidden unless the scene sets toasts: true
// nc.ocs(method, path, body)      OCS call as the test user (body: object or [[key, value], …])
// nc.dav(method, path, body)      DAV call as the test user
// nc.page                         the Playwright page, for anything else
// nc.viewport / nc.theme          the current variant

export default {
	// Loaded by --seed: fixtures from scripts/fixtures, set = empty | some | many | long
	fixtures: 'files:some',
	// Optional fixed date for everything that shows times
	// clock: '2026-03-02T10:00:00Z',

	scenes: [
		{
			section: 'File list',
			viewports: ['desktop', 'tablet', 'mobile'],
			setup: (nc) => nc.open('files'),
			capture: (nc) => nc.shot('Some files'),
		},
		{
			// light/dark switch without reload; highcontrast, dark-highcontrast and dyslexia are
			// enabled on the server for the test user and run as their own group
			section: 'Themes',
			themes: ['light', 'dark', 'highcontrast'],
			setup: (nc) => nc.open('files'),
			capture: (nc) => nc.shot('File list', { target: '.files-list' }),
		},
		{
			section: 'German',
			lang: 'de',
			viewports: ['mobile'],
			setup: (nc) => nc.open('files'),
			capture: (nc) => nc.shot('Long strings'),
		},
		{
			section: 'States',
			// Changes server state, so it runs alone after the parallel scenes
			exclusive: true,
			toasts: true,
			setup: (nc) => nc.open('files'),
			capture: async (nc) => {
				const release = await nc.delay('**/remote.php/dav/files/**')
				await nc.page.reload()
				await nc.shot('Loading')
				await release()
				await nc.fail('**/remote.php/dav/files/**', 500)
				await nc.page.reload()
				await nc.shot('Error')
			},
		},
	],
}
