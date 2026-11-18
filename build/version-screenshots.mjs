/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * Suffixes freshly captured screenshots with the major.minor version of appinfo/info.xml,
 * e.g. screenshots/contacts.png becomes screenshots/contacts-8.10.png, removes older versions
 * of them and points the screenshot URLs of info.xml and README.md at the versioned files.
 * The App Store serves screenshots through a cache keyed by URL, so a new file name per minor
 * release makes it fetch the refreshed images.
 *
 * Exits with 1 if info.xml has no screenshot hosted in this repo or a URL references a missing file.
 */

/* eslint-disable no-console -- command line script */

import { existsSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import process from 'node:process'

const INFO_XML = new URL('../appinfo/info.xml', import.meta.url)
const README = new URL('../README.md', import.meta.url)
const SCREENSHOTS = new URL('../screenshots/', import.meta.url)
const SCREENSHOT_URL = /(https:\/\/raw\.githubusercontent\.com\/nextcloud\/contacts\/main\/screenshots\/)([\w-]+?)(?:-\d+\.\d+)?\.png/g
const VERSIONED_FILE = /^([\w-]+?)-\d+\.\d+\.png$/

const xml = readFileSync(INFO_XML, 'utf8')
const version = xml.match(/<version>(\d+)\.(\d+)\.[^<]*<\/version>/)
if (!version) {
	console.error('No <version> found in appinfo/info.xml')
	process.exit(1)
}
const minorVersion = `${version[1]}.${version[2]}`

const files = readdirSync(SCREENSHOTS).filter((file) => file.endsWith('.png'))
const captured = files.filter((file) => !VERSIONED_FILE.test(file)).map((file) => file.slice(0, -'.png'.length))
// The version suffix makes the URL unique per release: the App Store proxies screenshots
// through usercontent.apps.nextcloud.com, which caches by URL and would keep serving an
// overwritten file under an unchanged name.
for (const name of captured) {
	for (const file of files.filter((file) => file.match(VERSIONED_FILE)?.[1] === name)) {
		rmSync(new URL(file, SCREENSHOTS))
	}
	renameSync(new URL(`${name}.png`, SCREENSHOTS), new URL(`${name}-${minorVersion}.png`, SCREENSHOTS))
}

const referenced = new Set()
/**
 * Point every screenshot URL of this repo in the given file at the versioned screenshot.
 *
 * @param {URL} path The file to update
 * @return {number} The number of updated URLs
 */
function pointAtVersionedScreenshots(path) {
	let count = 0
	const content = readFileSync(path, 'utf8').replace(SCREENSHOT_URL, (_, base, name) => {
		count++
		referenced.add(`${name}-${minorVersion}.png`)
		return `${base}${name}-${minorVersion}.png`
	})
	writeFileSync(path, content)
	return count
}

if (pointAtVersionedScreenshots(INFO_XML) === 0) {
	console.error('No screenshot hosted in nextcloud/contacts found in appinfo/info.xml')
	process.exit(1)
}
pointAtVersionedScreenshots(README)

const missing = [...referenced].filter((file) => !existsSync(new URL(file, SCREENSHOTS)))
if (missing.length > 0) {
	console.error(`Missing screenshots/${missing.join(', screenshots/')}`)
	process.exit(1)
}

console.log([...referenced].map((file) => `screenshots/${file}`).join('\n'))
