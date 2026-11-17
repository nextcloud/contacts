/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// Example shot list: copy to ~/.cache/nc-pr-shots/<repo>/<pr>/shots.mjs and adapt.
//
// Scene options: section, viewports (desktop|tablet|mobile), themes (light|dark|highcontrast|
// dark-highcontrast|dyslexia), lang, exclusive (changes server state: runs alone), toasts,
// keepOnResize (don't re-run setup after a resize), setup(nc), capture(nc).
//
// nc: open(app, subPath), openNavigation(), openAppSettings(), shot(label, { target, all, pad, fullPage }),
// closeup(target, label), delay(glob) → release(), fail(glob, status), ocs(…), dav(…), page, viewport, theme

export default {
	fixtures: 'files:some',
	// clock: '2026-03-02T10:00:00Z',
	scenes: [
		{
			section: 'File list',
			viewports: ['desktop', 'tablet', 'mobile'],
			setup: (nc) => nc.open('files'),
			capture: (nc) => nc.shot('Some files'),
		},
		{
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
			exclusive: true,
			setup: (nc) => nc.open('files'),
			capture: async (nc) => {
				const release = await nc.delay('**/remote.php/dav/files/**')
				await nc.page.reload()
				await nc.shot('Loading')
				await release()
				await nc.fail('**/remote.php/dav/files/**')
				await nc.page.reload()
				await nc.shot('Error')
			},
		},
	],
}
