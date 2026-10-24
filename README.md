# Miles Master

A responsive frontend app for comparing JAL and ANA award tickets with cash fares. Includes fuel surcharges, taxes, and fees; Japanese and English interfaces; JPY pricing; and local browser storage with JSON backup/import.

## Stack

- React 18 + TypeScript + Vite
- Semantic UI React and Semantic UI CSS
- i18next + react-i18next, with `src/locales/ja.json` and `src/locales/en.json`
- Vitest + React Testing Library for test-driven development
- GitHub Actions for validation; Cloudflare Workers Static Assets prepared for later hosting

React 18 matches Semantic UI React's supported peer dependencies. All calculations run in the browser. No backend, account system, or fare API is required.

## Run locally

```sh
nvm use
npm ci
npm run dev
```

Open the local URL printed by Vite. Use Node.js 24.14.0 or newer; `.nvmrc` pins the development and CI version. `npm start` is an alias for the development server.

```sh
npm run test:watch     # TDD loop
npm test              # All tests once
npm run test:coverage # Domain/storage coverage plus UI tests
npm run format        # Format source and documentation
npm run check         # Formatting, types, tests, coverage, production build
npm run preview       # Serve the built dist/ directory
```

Read [SPECIFICATION.md](./SPECIFICATION.md) for product requirements and [CONTRIBUTING.md](./CONTRIBUTING.md) for the development and review workflow.

## Calculations

**Value per mile** = (cash ticket price − award ticket cash charges) ÷ required miles.

**Ticket value at your target** = required miles × target value + award ticket cash charges.

Enter totals for one person and the entire one-way or round-trip itinerary. The cash fare must include all charges. Award charges can be entered as a total or a breakdown including fuel surcharge. Empty charges mean unknown; enter `0` for no charge. A cash fare is optional when calculating only the target-based ticket value.

JAL and ANA each have independent domestic and international targets. Defaults of ¥1.50/mile domestic and ¥2.00/mile international are editable examples, not market valuations.

## Storage and translations

Comparisons, targets, and language are saved under `miles-master.v1` in localStorage. Data belongs to the current browser and origin. Clearing site data removes it; use Export backup for JSON backups and moving data between localhost and a hosted domain. Import validates the file before asking to replace current data. Corrupt saved data can be downloaded for recovery.

Add interface strings to both locale files. Tests check key and placeholder parity. JPY formatting is locale-aware; adding other currencies and conversion is a future feature.

## CI and reviews

`.github/workflows/ci.yml` runs on pull requests and pushes to `main`, checks the app, and saves build/coverage artifacts. The workflow will run on GitHub after these commits are pushed. Copilot instructions are included, but Copilot Free does not provide code review. See [GitHub's availability documentation](https://docs.github.com/en/copilot/concepts/agents/code-review).

## Cloudflare deployment — prepared, deferred

`wrangler.jsonc` serves only the built `dist/` assets, with no Worker script, database, or server API. Cloudflare documents static asset requests as [free and unlimited](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/). Account/platform limits still apply. Cloudflare [recommends Workers for new projects](https://developers.cloudflare.com/pages/framework-guides/).

Nothing is deployed automatically on push. When ready:

1. Review the Worker name `miles-master` in `wrangler.jsonc`.
2. Run `npm run deploy:dry-run` to validate packaging without publishing.
3. Run `npx wrangler login` to authenticate locally, then `npm run deploy`. This checks and builds the app before publication to your Cloudflare account.

Alternatively, create the GitHub `production` environment and add `CLOUDFLARE_ACCOUNT_ID` and a scoped `CLOUDFLARE_API_TOKEN` as environment secrets. The token needs permission to deploy Workers in the selected account. Run the **Deploy to Cloudflare** workflow manually from `main`. It validates the app before deploying; it never runs for an ordinary push or pull request. Do not put tokens in Vite variables or source files. See [Cloudflare's GitHub Actions guide](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/) for token setup.

## Other static hosts

`npm run build` produces `dist/`, which also works on Cloudflare Pages or GitHub Pages. Asset paths are relative. For Cloudflare Pages, use `npm run build` and the `dist` output directory with Node 24.14.0. GitHub Pages requires publishing the built `dist/` contents, not serving the TypeScript source directory. A `.nojekyll` file is included in the output.

## License

[MIT](./LICENSE), retained from the original repository.
