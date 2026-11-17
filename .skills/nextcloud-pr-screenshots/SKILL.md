---
name: nextcloud-pr-screenshots
description: Capture screenshots for any Nextcloud PR (server or app) that changes UI, choosing the states, viewports and themes the change actually affects, and put one labeled composite image in a collapsible section of the PR description or a PR comment. Ships scripts for preflight, seeding, capture, composing and posting.
---
<!--
  - SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

# Nextcloud PR screenshots

Reviewers should be able to judge a UI change in every situation where it could look different or break, without checking out the branch and without scrolling past shots that show nothing new.

Use the scripts in `scripts/` (`$S` below) instead of writing your own Playwright setup, login, seeding or image layout. Only the shot list is specific to a PR.

## Steps

Run in the repo under test, with the PR branch checked out:

```bash
node $S/preflight.mjs                      # instance, Node version, build, browser; installs Playwright
npm ci && npm run build                    # if preflight says so; in the background while you write the shot list
node $S/run.mjs <shots.mjs> --seed --explore   # ARIA snapshot + screenshot per scene, to pick selectors
node $S/run.mjs <shots.mjs>                # failing scenes are reported with a screenshot, the rest still run
node $S/compose.mjs <out dir>
node $S/post.mjs --pr <n> --image <png> --notes <notes.md> [--to comment] [--dry-run]
```

- Shot list: `~/.cache/nc-pr-shots/<repo>/<pr>/shots.mjs`, based on `templates/shots.example.mjs`. Output goes to `out/` next to it. Re-run it to update the screenshots later.
- Env vars: `NC_URL` (default `http://nextcloud.local`), `NC_ADMIN_USER` / `NC_ADMIN_PASS` (default admin/admin), `NC_SHOTS_USER` (default `shotuser`; must not be an existing account).
- If something fails, read `reference/troubleshooting.md` before debugging.

## What to capture

Every shot has to answer a question a reviewer would ask. Start with the changed UI at desktop width in the light theme; add **before/after** if existing UI changed, and a **close-up** (`nc.closeup`) if the changed element is small. Then add only what the diff can affect:

| The change touches… | Capture | Shot list |
|---|---|---|
| Layout, sizing, a new view or component | desktop, tablet, mobile | `viewports` |
| Custom colors, not just `@nextcloud/vue` and CSS variables | light, dark, high contrast; a custom primary color if it sits near the primary color | `themes` |
| Anything waiting on the backend | loading, error, success | `nc.delay`, `nc.fail`, `toasts: true` |
| Lists or user data | empty, some, many | fixture sets `:empty`, `:some`, `:many` |
| Text or containers for user text | German and long names, at mobile width if layout is affected | `lang: 'de'`, set `:long` |
| Interactive controls | focus, hover, disabled | focus/hover the locator, then `nc.shot` |
| Dialogs, menus | the open state | open it in `setup` |
| Left/right-dependent styling | RTL | `lang: 'ar'` |
| Public pages, guests, admin views | each context | one scene each |

Vary each dimension on its own and combine two only when the combination itself can break (e.g. German at mobile width). More than about 20 shots: check again what each one answers.

## Shot lists

- `setup` runs per viewport, `capture` per viewport × theme. Light/dark switch without reloading. Server-side themes and languages are applied once per group of scenes and reset afterwards.
- Scenes run in parallel. Mark scenes that change server state `exclusive: true`, and reset that state at the end.
- `nc.shot` waits for requests and loading indicators, and hides toasts, animations and the caret. Don't add sleeps.
- Pick selectors from the `--explore` output and prefer `getByRole` / `getByText`. To crop to several elements, e.g. list rows, use `{ target, all: true }`.
- Data: `--seed` loads the shot list's `fixtures` for the test user "Sam Tester". For an app without a fixture, add `scripts/fixtures/<app>.mjs`, a default export `async ({ env, auth, dav, davList, ocs, pool }, set) => {}` that replaces that app's data with neutral data from `lib/data.mjs`. Never show real accounts or data.

## Before/after

Check out the base branch and build, then `run.mjs shots.mjs --tag before`. Check out the PR branch and build, then `run.mjs shots.mjs --tag after`. `compose.mjs` puts each before next to its after.

## Review and post

Look at the composite once and open single shots only if something looks off. Redo scenes that show a half-loaded view, the wrong theme or language, or real data.

The notes file says what was captured and what was left out, and why, e.g. `Captured: viewports (layout change), error state (saves to the backend). Not captured: themes (only @nextcloud/vue components).`

`post.mjs` puts the image and notes in a collapsible `<!-- screenshots:start/end -->` block. In the description (default), it replaces an earlier block. With `--to comment`, it posts a new comment, with `--footer` for an AI-assistance line. Follow the repo's posting rules, and ask before posting on someone else's PR. Without push access, put the image on a `pr-screenshots` branch of the contributor's fork and reference its commit-pinned raw URL instead.

When a later commit changes anything visible, re-run the shot list and post again; after a description update, leave a short comment so reviewers notice.

Clean up with `node $S/seed.mjs --delete`.
