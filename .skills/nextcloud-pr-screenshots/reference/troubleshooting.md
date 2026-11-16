<!--
  - SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
# Troubleshooting

Read this only when `preflight.mjs` or a run fails. Settings detected by preflight are cached in
`~/.cache/nc-pr-shots/env.json`; delete it to start over.

| Symptom | Cause and fix |
|---|---|
| `status.php is not reachable` | Instance not running, or a different URL. Start it, or set `NC_URL`. |
| `/login` gives 404, everything else works | No pretty URLs (common in dev setups). Preflight detects this and the scripts use `/index.php/…`. In your own code use `nc.open()` rather than hard-coded URLs. |
| Browser can't reach the instance, but curl/Node can | The browser resolves the host differently (e.g. `::1` vs IPv4, or a proxy). Preflight retries with `--host-resolver-rules` mapped to the IPv4 address and caches that. |
| `admin login failed` | Set `NC_ADMIN_USER` / `NC_ADMIN_PASS`. Only used to create and reset the test user, and to change its language. |
| Build fails with odd module errors (`Missing "./style.css" specifier`) | Wrong Node version for `npm ci`; it may fail without a clear message. Use the version from `engines.node` (preflight prints it), then `npm ci` again. |
| Login hangs or is very slow on later runs | Brute-force throttling after many logins. The scripts log in once and reuse the cached session; don't log in by hand in every script. If it's already throttled, wait or ask an admin to reset it. Don't clear the throttle table yourself. |
| Lists contain real-looking people, sample files or the system "Accounts" address book | Skeleton/example data or system address book. `seed.mjs` with the app's fixture replaces it. |
| A shot shows a spinner or half-loaded view | `nc.shot` waits for requests and loading indicators. If something loads later than that (lazy images, WebSockets), wait for the element: `await nc.page.getByText('…').waitFor()`. |
| A loading-state shot shows the finished state | The request wasn't held: check the glob in `nc.delay()` against the request URL (`**/path/part**`). |
| The mobile shot keeps desktop layout or shows gaps | You set `keepOnResize: true` on a view that doesn't reflow cleanly. Remove it so `setup` runs again at that width. |
| A click doesn't work at mobile width | The app navigation is collapsed; call `nc.openNavigation()` first (`nc.openAppSettings()` already does). |
| Custom primary color | Admin-only: `occ theming:config primary_color '#f5e663'`, or Administration settings → Theming. Run that scene alone and reset it afterwards (`occ theming:config primary_color --reset`). |
| `gh: unknown flag --attach` | gh is older than 2.99; update it, or host the image on the fork (see SKILL.md). |
| `build-swap` warns about non-frontend files | The PR changes PHP or templates, so the base build alone isn't the real "before". Check out the base branch for the before shots. |
