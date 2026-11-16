---
name: nextcloud-pr-screenshots
description: Capture screenshots for any Nextcloud PR (server or app) that changes UI, choosing the states, viewports and themes the change actually affects, and put one labeled composite image in a collapsible section of the PR description or a PR comment. Ships scripts for preflight, seeding, capture, composing and posting.
---
<!--
  - SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

# Nextcloud PR screenshots

Use this for every PR to the Nextcloud server or a Nextcloud app that adds or changes visible UI. Reviewers should be able to judge the change in every situation where it could look different or break, without checking out the branch, and without scrolling past screenshots that show nothing new.

All tooling lives in `scripts/` next to this file (called `$S` below). Don't write your own Playwright setup, login, seeding or image composition: the scripts already handle the usual problems (missing pretty URLs, Node version, login throttling, demo data, layout). Only the shot list is specific to a PR.

## Fast path

Run from the repo under test (an app or the server), with the PR branch checked out:

```bash
S=<this skill>/scripts
node $S/preflight.mjs                     # ~3 s; fixes or explains every environment problem
npm ci && npm run build                   # only if preflight says so; run it in the background
                                          # meanwhile, write the shot list (step 2)
node $S/run.mjs <shots.mjs> --seed --explore   # once per new view: ARIA snapshot + screenshot to pick selectors
node $S/run.mjs <shots.mjs>               # capture; failing scenes are reported with a screenshot, the rest still run
node $S/compose.mjs <out dir>             # one labeled PNG
node $S/post.mjs --pr <n> --image <png> --notes <notes.md> [--to comment] [--dry-run]
```

- Put the shot list in `~/.cache/nc-pr-shots/<repo>/<pr>/shots.mjs` (outside the repo), starting from `$S/templates/shots.example.mjs`. Output goes to `out/` next to it. Re-running the same file is how you update screenshots later.
- If preflight fails, read `reference/troubleshooting.md`. Don't debug the environment by trial and error.
- Configuration is through env vars, all optional: `NC_URL` (default `http://nextcloud.local`), `NC_ADMIN_USER` / `NC_ADMIN_PASS` (default admin/admin, only used to create the test user), `NC_SHOTS_USER` (default `shotuser`).

## 1. Decide what to capture — before touching the browser

**The rule: every screenshot has to answer a question a reviewer would actually ask.** If a shot would look the same as another one except for something the PR can't affect, leave it out.

### Start with the baseline
- One shot of the changed UI in its most representative state, at desktop width, in the light theme.
- If the PR changes existing UI, add the same shot from the target branch as **before / after** (see step 4).
- If the changed element is small (a button, a badge, an icon, a single row), add a **close-up** (`nc.closeup`, rendered at 2x).

For many small PRs, the baseline is all you need.

### Add what the change can affect

| If the change touches… | …capture | In the shot list |
|---|---|---|
| Layout: spacing, sizing, flex/grid, wrapping, positioning, a new view or component | **Viewports**: mobile, tablet (where the app navigation collapses), desktop | `viewports: ['desktop', 'tablet', 'mobile']` |
| Colors: custom CSS colors, backgrounds, borders, shadows, colored icons, anything not using Nextcloud CSS variables or `@nextcloud/vue` as intended | **Themes**: light, dark, high contrast (plus dark high contrast if custom colors are used in dark mode). If the UI uses or sits next to the primary color, also a custom primary color | `themes: ['light', 'dark', 'highcontrast', 'dark-highcontrast']`; primary color: see troubleshooting |
| Loading data, async actions, forms that submit, anything that waits on the backend | **Loading** and **error** states, plus success if there is one | `nc.delay(glob)` / `nc.fail(glob)`, `toasts: true` |
| Lists, tables, collections, anything that shows user data | **Empty**, **some**, **many** (enough to scroll) | fixtures `:empty` / `:some` / `:many` |
| Text and labels, or containers for user-provided text | **Long strings**: German, long names, large numbers; at mobile width if layout is also affected | `lang: 'de'`, fixture set `:long` |
| Interactive controls | **Hover / keyboard focus** and **disabled / read-only** | `locator.focus()` / `hover()` before `nc.shot` |
| Dialogs, popovers, dropdowns | The **open** state | open it in `setup` |
| Direction-dependent styling | **RTL** | `lang: 'ar'` or `lang: 'he'` |
| Other contexts: public share pages, guests, admin vs. user | Each **context** the UI appears in | a scene per context; `nc.page.goto(...)` for public links |
| An interaction that is the core of the change | Optionally a short **recording**, only if stills can't show it or the user asks | Playwright `recordVideo` on a separate context |

If a trigger doesn't match, don't capture that dimension. A label change doesn't need dark mode. A color change doesn't need mobile unless it also changes layout. A purely visual tweak has no loading state. UI built only from `@nextcloud/vue` components and CSS variables, used as intended, already handles themes, so light is enough. If you're unsure whether a dimension is affected, capture it.

### Don't multiply every dimension by every other
Vary each triggered dimension on its own, starting from the baseline. Combine two only when the combination itself can break: themes at desktop and viewports in light; German at mobile width; content states at every viewport only if the layout changes with the amount of content. More than about 20 shots: go through them again.

## 2. Write the shot list

A shot list is a small ES module (see `templates/shots.example.mjs` for every option). One **scene** per state you want to show:

```js
export default {
  fixtures: 'contacts:some',                       // seeded by --seed
  scenes: [{
    section: 'Settings dialog',                    // header in the composite
    viewports: ['desktop', 'mobile'],
    setup: async (nc) => { await nc.open('contacts'); await nc.openAppSettings() },
    capture: (nc) => nc.shot('Settings'),          // runs per viewport × theme
  }],
}
```

How it runs, so you don't need to optimize by hand:
- **One login per machine.** The session is cached and reused by every page and run.
- **Scenes run in parallel** (`--workers 4`), each in its own page. Mark scenes that change server state (saving a setting, deleting data) `exclusive: true`; they run alone afterwards. Reset that state at the end of the scene.
- **Light and dark switch without reloading** (via `prefers-color-scheme`). High contrast, dyslexia and language are user settings; scenes needing them are grouped, and each setting is applied once and reset afterwards.
- **Viewports**: `setup` runs again after each resize, because a view resized while open can look different from what a user at that width gets. If the view reflows correctly, set `keepOnResize: true` to skip the reload.
- `nc.shot` waits until requests (including XHR) have finished, loading indicators are gone and fonts have loaded. Toasts, animations, the text caret and dev toolbars are hidden. Don't add fixed sleeps.
- `--only <scene>` re-runs one scene and merges it into the existing manifest.

**Selectors**: run `--explore` once and read the `.aria.yml` files. Prefer `nc.page.getByRole(...)` and `getByText(...)` over CSS classes. Use a class only as a crop `target`. To crop around several elements at once (for example all rows of a list), use `{ target: '.row', all: true }`.

**Data**: never screenshot a real account or real data. `seed.mjs` creates the test user "Sam Tester", resets their theme and language, and loads neutral fixtures (`contacts`, `files`, `calendar` so far). For another app, add `scripts/fixtures/<app>.mjs`: a default-exported `async ({ env, auth, dav, davList, ocs, pool }, set) => {}` that replaces the user's data for that app with neutral data from `lib/data.mjs` over DAV/OCS, and is safe to run repeatedly. If an app has no API for its data, create it in the scene's `setup` through the UI.

## 3. Review

Look at the **composite** (`compose.mjs` output) once, not every single shot. Open a single PNG only when something in the composite looks off. Redo any scene that shows a half-loaded view, the wrong theme or language, a stray toast or real data. If a scene fails, the run prints the error and saves `error-<scene>.png`; fix that scene and re-run it with `--only`.

## 4. Before / after

- **Frontend-only change** (`build-swap.mjs prepare` warns otherwise): build the base once in a worktree and swap the build output that is served. No checkout or rebuild cycle:
  ```bash
  node $S/build-swap.mjs prepare origin/main      # in the background while you write the shot list
  node $S/build-swap.mjs use base && node $S/run.mjs shots.mjs --tag before
  node $S/build-swap.mjs use head && node $S/run.mjs shots.mjs --tag after
  node $S/build-swap.mjs clean
  ```
- **Backend changes too**: check out the base branch, build, `run.mjs --tag before`, check out the PR branch, build, `run.mjs --tag after`.

`compose.mjs` puts each "before" directly left of the "after" with the same section and label.

## 5. Post

Write a notes file with what you captured and left out, and why. Reviewers use it to check your choices:

```
Captured: viewports (layout change), loading/error (saves to the backend), close-up of the new button.
Not captured: themes (only @nextcloud/vue components and CSS variables).
```

Then `post.mjs`. Default is the PR description; pass `--to comment` when the user wants a comment instead. It wraps the image and notes in a collapsible `<!-- screenshots:start/end -->` block, uploads the image with `gh … --attach` and replaces an existing block instead of adding a second image. Use `--dry-run` to print the body first. Follow the repo's and the user's rules for posting: AI disclosure (pass it with `--footer` for comments), and ask before posting on someone else's PR unless the user already said to.

### Hosting without push access
`--attach` needs gh ≥ 2.99 and push access to the repo. Otherwise:
- **Fork**: commit the image to a `pr-screenshots` branch of the contributor's fork, under `<repo>/<pr>/screenshots-<sha>.png`, then replace `./screenshots-<sha>.png` in the body with the raw URL pinned to that commit (`https://raw.githubusercontent.com/<user>/<fork>/<commit>/<path>`). Tell the contributor not to delete that branch while the PR is open.
- **By hand**: give the user the file to drag into the PR, then put the resulting URL between the markers.

Anyone with the link can view the files, which is one more reason never to include real data.

## 6. Keeping it current

The screenshots must always match the PR's latest UI. When a new commit changes anything visible, re-run the same shot list (`run.mjs`, `compose.mjs`, `post.mjs`): the image gets the new SHA and replaces the old one. If the commit changes what kind of change the PR is, go through the table in step 1 again. When you push UI changes to a PR that already has screenshots, update them as part of that push without being asked. Editing a description doesn't notify anyone, so after an update (not the first time) post a short comment, for example `Screenshots updated for abc1234: <what changed visually>`.

## Clean up
`node $S/seed.mjs --delete` removes the test user; `build-swap.mjs clean` removes the base worktree.

## Checklist
- [ ] Every dimension whose trigger matches the diff is captured, and none that the change can't affect
- [ ] Dimensions are combined only where the combination itself can break
- [ ] Before/after is included if existing UI changed
- [ ] Small changed elements have a close-up
- [ ] Composite reviewed; no real data, dev overlays or stray toasts
- [ ] One image under 10 MB with the SHA in its name, inside the markers, pointing to an uploaded or commit-pinned URL
- [ ] Notes say what was captured and what wasn't, and why
- [ ] If this was an update, reviewers were notified
