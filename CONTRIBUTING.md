# Development workflow

Use Node.js 24.14.0 (see `.nvmrc`) and npm. The original repository's MIT LICENSE is retained.

## Test-driven development

1. Describe the user-visible behavior in a failing test. Use `src/domain/model.test.ts` for calculations and backup rules, `src/storage.test.ts` for persistence failures, and React Testing Library for user interactions.
2. Run the focused test and verify it fails for the intended reason: `npm test -- src/domain/model.test.ts`.
3. Implement the smallest complete change that makes the test pass.
4. Refactor while keeping the tests green. Prefer pure domain functions and small UI components. Keep display strings in both locale JSON files.
5. Run `npm run format`, then `npm run check` before committing. This checks formatting, TypeScript, tests, coverage, and the production build.

Use `npm run test:watch` for the red/green/refactor loop. Test behavior and edge cases rather than snapshots of implementation structure. The configured coverage thresholds apply to domain logic and storage; React interaction tests run too, but those modules are not included in the coverage percentage.

The migration started with failing suites for the new TypeScript modules. Later regression tests demonstrated failures for target precision and excessive combined fees before those fixes were implemented.

## Commit messages

Use Conventional Commits, with one coherent change per commit:

- `feat: add a new comparison feature`
- `fix: preserve award charges when changing fee mode`
- `test: cover rejected backup imports`
- `ci: update validation workflow`
- `docs: explain Cloudflare deployment`
- `chore: update dependencies`

Review `git diff --staged` before committing. Do not commit `node_modules`, builds, backups containing personal trip data, or credentials.

## Pull requests and CI

CI runs on pull requests and pushes to `main`. It executes `npm ci` and `npm run check`, and uploads build and coverage artifacts. After the workflow has run in GitHub, the repository owner can make **Tests, types, and build** a required status check in a branch ruleset.

Copilot review instructions live in `.github/copilot-instructions.md`. GitHub Copilot Free does not include code review, so no paid review automation is enabled. If you later have an eligible plan or entitlement, request Copilot under a pull request's Reviewers section or configure automatic review in GitHub. See [GitHub's code review availability documentation](https://docs.github.com/en/copilot/concepts/agents/code-review).

## Dependency notes

- React 18 matches Semantic UI React 2.x's declared peer dependencies.
- Import only the Semantic UI CSS components used by this app. The full CSS bundle includes a legacy popup selector that Vite's Lightning CSS minifier rejects.
- `undici` is overridden within its 7.x major to pick up the advisory fixes starting in 7.30.1 in Wrangler's development dependency chain. Reassess the override when upgrading Wrangler.

## Manual browser checks

Open the app with `npm run dev`. Check Japanese and English at 375px and 1440px widths. Confirm that comparison cards stack on phones, multiple options remain usable on desktop, keyboard focus is visible, and no page-wide horizontal scrolling appears. Validate export/import and reload persistence in a real browser before a release. DOM tests do not verify visual layout.
