# Miles Master

A responsive frontend app that helps you decide whether to pay cash or redeem miles for a trip. Compare different flights serving the same trip, with independent details for the cash and award alternatives. Includes fuel surcharges, taxes, and fees; Japanese, English, and Hong Kong Traditional Chinese (`zh-HK`) interfaces; JPY pricing; and local browser storage with JSON backup/import.

## Stack

- React 18 + TypeScript + Vite
- Semantic UI React and Semantic UI CSS
- i18next + react-i18next, with `src/locales/ja.json`, `src/locales/en.json`, and `src/locales/zh-HK.json`
- Vitest + React Testing Library for test-driven development
- GitHub Actions for validation; Cloudflare Workers Static Assets prepared for later hosting

React 18 matches Semantic UI React's supported peer dependencies. All calculations run in the browser. No backend, account system, or fare API is required.

## Run locally

```sh
nvm use
corepack enable pnpm
pnpm install --frozen-lockfile
pnpm run dev
```

Open the local URL printed by Vite. Use Node.js 24.14.0 or newer; `.nvmrc` pins the development and CI version. The `packageManager` field pins pnpm 10.34.7; Corepack selects it after `nvm use` and `corepack enable pnpm`. `pnpm start` is an alias for the development server.

```sh
pnpm run test:watch     # TDD loop
pnpm test              # All tests once
pnpm run test:coverage # Domain/storage coverage plus UI tests
pnpm run format        # Format source and documentation
pnpm run check         # Formatting, types, tests, coverage, production build
pnpm run preview       # Serve the built dist/ directory
```

Read [SPECIFICATION.md](./SPECIFICATION.md) for product requirements and [CONTRIBUTING.md](./CONTRIBUTING.md) for the development and review workflow.

## Calculations

**Value per mile** = (cash ticket price − award ticket cash charges) ÷ required miles.

**Break-even cash fare** = required miles × target value + award ticket cash charges.

Each trip can contain several cash-versus-miles comparisons. The primary result favors cash or miles and shows the difference at your target valuation, not literal cash savings. The cash and award flights may differ in airports, dates, flight numbers, airlines, and cabins; consider those differences when choosing.

Enter totals for one person and the entire one-way or round-trip itinerary. The cash fare must include all charges. Award charges can be entered as a total or a breakdown including fuel surcharge. Empty charges mean unknown; enter `0` for no charge. A cash fare is optional when calculating only the target-based ticket value.

JAL and ANA each have independent domestic and international targets. The award airline, domestic/international category, and selected award cabin choose the applicable target; the cash airline and optional cabin labels are descriptive. Each category has editable economy, business, and first-class targets, initially ¥2 / ¥4 / ¥6 per mile. These are personal decision thresholds, not market valuations. Higher targets require a better redemption before favoring miles. Existing saved thresholds are preserved; use “Use ¥2 / ¥4 / ¥6 defaults” in target settings to adopt the new defaults.

## Optional award-mile lookup

Open “Estimate miles from an award chart” under the award ticket. Select International, the award cabin, and departure/destination cities. The initial dataset covers direct trips between Tokyo (Haneda/Narita) and Hong Kong, Singapore, Honolulu, Sydney, London, or New York (JFK), in either direction. Same cabin both ways; no connecting flights or premium economy. Domestic and unsupported combinations remain manual entry. ANA first class is included only for Honolulu, London, and New York in this initial dataset.

For ANA and JAL first class, select the outbound and return seasons separately after checking dates against the linked official chart. Seasons are not inferred from dates. Click “Use this mileage” to fill the whole-trip, per-person mileage and award route label. You can edit the result. Changing lookup choices never automatically replaces entered miles; reapply if needed. Fuel surcharge and taxes remain separate manual inputs.

Reference data was checked on **2026-10-24** against the [JAL chart](https://www.jal.co.jp/jp/en/jalmile/use/jal/inter/routemiles.html) (updated April 16, 2026) and [ANA rules and charts](https://www.ana.co.jp/en/de/amc/international-flight-awards/) with the [ANA one-way mileage PDF](https://www.ana.co.jp/guide/amc/award/international/usage/images/mileage_chart_int_oneway_en_250325.pdf) (tickets issued from June 24, 2025). JAL estimates use base miles; PLUS can require more. These are bundled reference tables, not live booking quotes, seat searches, or confirmation of operating routes/cabins. Verify the airline's actual booking result before redeeming.

To update data, review the official sources, change `src/domain/awardChart.ts` and its verification date, and update route/season tests. Keep unsupported combinations unavailable rather than guessing. No API keys or backend are needed.

## Storage and translations

Comparisons, targets, and language are saved under `miles-master.v1` in localStorage. Data belongs to the current browser and origin. Clearing site data removes it; use Export backup for JSON backups and moving data between localhost and a hosted domain. Export uses schema version 3 with separate flight details, award cabin, cabin-specific targets, and lookup selections. Import validates the file before asking to replace current data and also upgrades version 1 and 2 backups. Existing saved browser data is upgraded automatically, preserving old prices and labels. Each old numeric target is copied into all three cabins. Migrated comparisons start with the economy target category; optional cabin labels remain unchanged, so select the appropriate award cabin before using different cabin targets. Corrupt saved data can be downloaded for recovery.

Add interface strings to all locale files. Tests check key and placeholder parity. JPY formatting is locale-aware; adding other currencies and conversion is a future feature.

## CI and reviews

`.github/workflows/ci.yml` runs on pull requests and pushes to `main`, checks the app, and saves build/coverage artifacts. The workflow will run on GitHub after these commits are pushed. Copilot instructions are included, but Copilot Free does not provide code review. See [GitHub's availability documentation](https://docs.github.com/en/copilot/concepts/agents/code-review).

## Cloudflare deployment — prepared, deferred

`wrangler.jsonc` serves only the built `dist/` assets, with no Worker script, database, or server API. Cloudflare documents static asset requests as [free and unlimited](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/). Account/platform limits still apply. Cloudflare [recommends Workers for new projects](https://developers.cloudflare.com/pages/framework-guides/).

Nothing is deployed automatically on push. When ready:

1. Review the Worker name `miles-master` in `wrangler.jsonc`.
2. Run `pnpm run deploy:dry-run` to validate packaging without publishing.
3. Run `pnpm exec wrangler login` to authenticate locally, then `pnpm run deploy`. This checks and builds the app before publication to your Cloudflare account.

Alternatively, create the GitHub `production` environment and add `CLOUDFLARE_ACCOUNT_ID` and a scoped `CLOUDFLARE_API_TOKEN` as environment secrets. The token needs permission to deploy Workers in the selected account. Run the **Deploy to Cloudflare** workflow manually from `main`. It validates the app before deploying; it never runs for an ordinary push or pull request. Do not put tokens in Vite variables or source files. See [Cloudflare's GitHub Actions guide](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/) for token setup.

## Other static hosts

`pnpm run build` produces `dist/`, which also works on Cloudflare Pages or GitHub Pages. Asset paths are relative. For Cloudflare Pages, use `pnpm run build` and the `dist` output directory with Node 24.14.0. GitHub Pages requires publishing the built `dist/` contents, not serving the TypeScript source directory. A `.nojekyll` file is included in the output.

## License

[MIT](./LICENSE), retained from the original repository.
