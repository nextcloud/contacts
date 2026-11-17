<!--
  - SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
# Troubleshooting

Cached settings live in `~/.cache/nc-pr-shots/env.json`; delete it to start over.

| Symptom | Fix |
|---|---|
| Build fails with odd module errors | Wrong Node version for `npm ci`. Use the one preflight names, then `npm ci` again. |
| Login is slow or hangs | Brute-force throttling from repeated logins. The scripts log in once and reuse the session; don't log in in every script. Wait, or ask an admin to reset it. |
| `seed.mjs` refuses the user | `NC_SHOTS_USER` names an account it didn't create, or `env.json` with its password was deleted. Pick another id. |
| Lists show sample data or the system "Accounts" address book | Load the app's fixture with `--seed`. |
| A shot shows a spinner | Something loads after the requests finish. Wait for it in the scene: `await nc.page.getByText('…').waitFor()`. |
| A loading-state shot shows the finished state | The glob in `nc.delay()` doesn't match the request URL. |
| A click does nothing at mobile width | The navigation is collapsed; call `nc.openNavigation()` first. |
| Custom primary color | Admin setting: `occ theming:config primary_color '#f5e663'`, then `--reset` afterwards. Run that scene alone. |
| `unknown flag --attach` | Update gh to 2.99 or newer. |
