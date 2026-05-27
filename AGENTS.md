<!--
  - SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
# AGENTS.md

This file provides guidance to AI coding assistants working with code in this repository.

## Commands

### Setup
```bash
composer i
npm ci
```

### JavaScript
See `package.json` scripts for all available commands (build, dev, watch, lint, stylelint, test, test:e2e, etc.).

### PHP
Available composer commands:
```bash
composer cs:check                # Check code style
composer cs:fix                  # Fix code style
composer psalm                   # Run static analysis
composer test:unit               # Run unit tests
composer test:integration        # Run integration tests
```
See `composer.json` for all available commands.

## Architecture

### Stack
- **Backend**: PHP 8.1+ (see `appinfo/info.xml` for version requirements), Nextcloud app framework, SabreDAV for CardDAV protocol. Namespace: `OCA\Contacts\`.
- **Frontend**: Vue 3, Pinia, Vue Router 4, bundled with Vite.

### PHP Backend (`lib/`)
Layered: Controllers → Services → DAV/Providers.

- **`Controller/`** — Thin HTTP handlers; business logic lives in services.
- **`Service/`** — Core logic. Key areas: contact management, address book operations, photo handling, social profile integration, organizational charts.
- **`Dav/`** — CardDAV protocol implementation via SabreDAV. `CarddavPlugin` handles DAV operations; `VCard` entities represent contacts.
- **`ContactsMenu/`** — Integration with Nextcloud contacts menu; providers supply contact details for other apps.
- **`Cron/`** — Background jobs for social profile updates and regular maintenance tasks.
- **`Listener/`** — Event listeners hooked to domain events from `lib/Event/`.
- **`Settings/`** — Admin settings for the contacts app.
- **`Exception/`** — Custom exceptions for error handling.
- **`Capabilities.php`** — Declares app capabilities for Nextcloud federation.

### JavaScript Frontend (`src/`)
Single-page Vue 3 app with Vite bundling. Entry point: `main.js`, root component: `ContactsRoot.vue`.

- **`store/`** — Pinia stores for contacts, address books, groups, and app state management.
- **`services/`** — JS services that call the PHP REST API and handle CardDAV operations via `@nextcloud/cdav-library`.
- **`components/`** — Vue 3 components (contact list, contact detail, address book picker, organization chart, etc.).
- **`router/`** — Vue Router 4 routes for contact views, address books, and organization pages.
- **`views/`** — Page-level components (contact details, address book view, etc.).
- **`models/`** — Data models for contacts and related entities.
- **`utils/`** — Helper functions for contact formatting, validation, and vCard parsing.
- **`mixins/`** — Shared component logic.

### Key Conventions
- **Registration**: `appinfo/info.xml` registers background jobs, admin settings, navigation, and DAV providers. `AppInfo/Application.php` bootstraps services and event listeners.
- **Events**: Domain events in `lib/Event/` are dispatched after contact/address book state changes; `lib/Listener/` reacts to them.
- **CardDAV**: Contact data flows through SabreDAV's CardDAV plugin; contacts are stored as vCard format files.
- **REUSE & SPDX**: Every file requires an SPDX license header. **New files must use `AGPL-3.0-or-later`, never `AGPL-3.0-only`**. Header format:
  ```php
  /*
   * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
   * SPDX-License-Identifier: AGPL-3.0-or-later
   */
  ```

## Testing

### Unit Tests
Located in `tests/Unit/` with structure mirroring `lib/`.

#### Pattern
- Use **arrange-act-assert** structure with blank lines separating each phase (no literal comments)
- Mock dependencies via `$this->createMock(Interface::class)`
- Setup mocks in `setUp()` for common fixtures

#### Running Tests
```bash
composer test:unit                                    # Run all unit tests
composer test:unit -- tests/Unit/Service/ContactTest.php # Run specific test file
composer test:unit -- --filter="TestClassName"        # Run tests matching filter
```

### JavaScript Tests
```bash
npm test                         # Run all Jest tests
npm test -- src/components      # Run tests matching a path
npm test:watch                   # Run tests in watch mode
npm test:coverage               # Generate coverage report
```

### E2E Tests
Located in `tests/e2e/` using Playwright.

#### Running Tests
```bash
npm run test:e2e                # Run all E2E tests
npm run test:e2e:ui            # Run E2E tests with UI
```

## Git Workflow

Do NOT commit changes unless explicitly asked to do so.

After completing code changes:
1. Verify your work is complete and tests pass
2. Never push directly to `main` — always create a feature branch with a descriptive name (e.g. `feat/org-chart`, `fix/vcard-parsing`, `chore/update-agents`).
3. Worktree branches must use descriptive feature-branch names, not generated names like `agent-xxxx`.
4. Make sure there is no trailing whitespace
5. Leave changes in working directory or staged (do not commit)
6. Provide a summary of what was changed and why
7. Suggest a commit message using Conventional Commits format
8. The user will review and commit when ready

### PR Review Workflow

Once a branch is pushed and under review, **do not force-push**. Reviewers track changes incrementally — a force-push destroys that history and forces them to re-read the full diff from scratch.

Instead, address feedback with **fixup commits**:
```bash
git commit --fixup=<sha>   # targets the specific commit being corrected
```

The branch will be rebased and squashed into a clean history before merge (CI enforces this). The failing "clean history" CI check is intentional and expected during review — ignore it until the PR has a positive review, then rebase to clean up.

### Commit Message Format

All commits must include two trailers at the end:
1. Agent/model attribution: `Assisted-by: <AgentName>:<model-id>`
2. DCO sign-off: Use `git commit -s` to add automatically

When committing, use: `git commit -m "message" -s`

This ensures the sign-off includes your configured Git user email.

Example:
```
fix(contacts): improve vCard parsing

- update vCard parser to handle edge cases
- verify all tests pass

Assisted-by: Claude:claude-sonnet-4-6
Signed-off-by: Name <email>
```

### Styling

For all CSS colors, spacing, and dimensions, you must use the standard Nextcloud CSS variables.

Do not leave any magic numbers. If you need more specific control over dimensions use `calc(x*var)` when necessary.

You can find the CSS variables already in use in this repository, and the full documentation available at this link: https://docs.nextcloud.com/server/latest/developer_manual/html_css_design/css.html.

