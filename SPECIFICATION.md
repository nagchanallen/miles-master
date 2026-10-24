# Miles Master — version 1 specification

## Purpose and platform

A frontend-only app for comparing the value of JAL and ANA award tickets with paid tickets. React 18, TypeScript, and Vite with Semantic UI React. Japanese and English interfaces use i18next/react-i18next; JPY only. Language strings and currency formatting are centralized for future expansion. Cloudflare Workers Static Assets is prepared for free static hosting; actual deployment is deferred. The build also supports GitHub Pages and other static hosts. No backend, account system, or external fare lookup.

## Scope

- JAL miles on JAL flights; ANA miles on ANA flights.
- Domestic and international itineraries.
- One-way or round-trip; every amount covers one person and the whole itinerary.
- Named comparison groups with multiple options, including different airlines, dates, and cabins.
- Manual cash fares, required miles, and award ticket cash charges.
- Optional route, departure date, return date for round-trips, and cabin labels.
- No miles earned on paid tickets, partner redemptions, currency conversion, live fares, or award availability in version 1.

## Target values

Four independently editable values: JAL domestic, JAL international, ANA domestic, ANA international. Proposed initial examples are ¥1.50/mile for domestic and ¥2.00/mile for international, for each airline. They are illustrative defaults, not market valuations. Positive targets up to ¥10,000/mile are accepted in increments of ¥0.01.

## Inputs and fees

Cash fare includes fuel surcharge, taxes, and all other fees for a comparable paid itinerary. It is optional. Required miles must be a positive whole number to calculate results. Prices and fees are nonnegative whole yen.

Award cash charges support either one total or a breakdown of fuel surcharge, taxes, and other fees. Missing fees are not silently assumed to be zero: users explicitly enter 0 for no charge. All three breakdown fields are required for calculation in that mode. Moving from breakdown to total sums completed fees. Moving from a known total to breakdown preserves the amount under Other fees with fuel and taxes initially zero, and explains that the user should supply the actual breakdown. An unknown total produces three empty fields. Each numeric amount and the combined fee total are limited to ¥1 trillion. Invalid numeric drafts clear the corresponding calculation input rather than retaining a stale recommendation.

## Calculations

- Actual value per mile = (cash fare − award cash charges) / miles required.
- Estimated ticket value at target = miles required × applicable airline/flight-type target + award cash charges.
- Cash fare above estimated ticket value: target favors miles.
- Cash fare below estimated ticket value: target favors cash.
- Equal values: neutral result, using a ¥0.005 comparison tolerance for floating-point arithmetic.

Without a cash fare, show the estimated ticket value and omit actual value and recommendation. Without valid miles or complete fees, show incomplete results. Negative actual values remain visible when award charges exceed the cash fare. Display values per mile to two decimal places and ticket prices to whole yen; compare using unrounded values. Recommendations reflect only the user's target and entered prices.

## Persistence and backups

Auto-save valid changes under `miles-master.v1` in localStorage. Save language, targets, comparison groups, options, and active comparison. Data is specific to the browser and site origin. Storage failures must be visible and must not prevent in-memory use or export.

JSON export contains schema `version: 1` and the complete saved state. Import validates version, enumerations, amounts, target values, identifiers, and limits before asking to replace current data. Unsupported files leave current state intact. Maximum import size is 5 MiB; up to 100 groups and 100 options per group. Reject duplicate group IDs or duplicate option IDs within a group. Discard unknown fields. Imported text is escaped when rendered.

Unreadable local data is preserved until an explicit reset or import. Offer a recovery download rather than automatically overwriting it. Confirm destructive option/group deletion, backup replacement, and storage reset. Deleting the final group creates a new empty comparison.

## Responsive interface and accessibility

At mobile widths, use vertically stacked comparison cards, a compact group selector, and full-width controls. Wider layouts use a sidebar and a grid of comparison cards. Avoid page-wide horizontal scrolling. Inputs have visible labels, keyboard focus indicators, and touch-friendly controls. Announce calculation updates and status messages. Set document language when switching interfaces.

## Acceptance examples

1. ¥50,000 cash fare, 20,000 miles, and ¥5,000 award charges produce ¥2.25/mile. At ¥2/mile target, estimated ticket value is ¥45,000 and miles are favored.
2. The same redemption without a cash fare still shows ¥45,000 estimated value, without a recommendation.
3. ¥3,000 fuel + ¥1,500 taxes + ¥500 other fees produces the same result as ¥5,000 total charges.
4. Reload retains comparisons and targets; exporting and importing reproduces that state.
5. Switching airline or domestic/international updates the applicable target and results.
6. Both interfaces work at narrow phone and wide desktop widths.

## Future extensions

More currencies and languages, manual and automatic exchange rates, passengers, paid-ticket mileage earnings, and additional airlines. These are outside version 1.

## Development and delivery

- Use test-driven development: failing behavior test, implementation, then refactoring.
- Vitest and React Testing Library cover calculation rules, storage failures, import/export, and UI workflows.
- GitHub Actions checks formatting, TypeScript, tests, coverage, and production builds on pull requests and pushes to main.
- Use Conventional Commit messages. Keep the original repository history and LICENSE.
- Include Copilot review context, but do not enable a paid review service. GitHub Copilot Free does not include code review.
- Prepare a manually triggered Cloudflare deployment workflow. Publication remains deferred until explicitly requested.
