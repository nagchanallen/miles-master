# Miles Master — version 1 specification

## Purpose and platform

A frontend-only app answering: “For this trip, should I pay cash or redeem miles?” Each comparison pairs a cash ticket with an award ticket that serves the same trip; the flights may differ. JAL and ANA identify the award program used for valuation, rather than being the primary comparison axis. React 18, TypeScript, and Vite with Semantic UI React. Japanese and English interfaces use i18next/react-i18next; JPY only. Language strings and currency formatting are centralized for future expansion. Cloudflare Workers Static Assets is prepared for free static hosting; actual deployment is deferred. The build also supports GitHub Pages and other static hosts. No backend, account system, or external fare lookup.

## Scope

- JAL miles on JAL flights; ANA miles on ANA flights.
- Domestic and international itineraries.
- One-way or round-trip; every amount covers one person and the whole itinerary.
- Named trips with multiple cash-versus-miles comparison pairs. Each pair has one cash alternative and one award alternative; the flights may have different airlines, airports, dates, flight numbers, and cabins. Users decide whether both alternatives meet their trip needs.
- Manual cash fares, required miles, and award ticket cash charges.
- Independent optional route, flight numbers, departure date, return date for round-trips, and cabin labels for each alternative. Cash airline is optional (JAL/ANA); award airline is required and selects the mileage target.
- No miles earned on paid tickets, partner redemptions, currency conversion, live fares, or award availability in version 1.

## Target values

Four independently editable values: JAL domestic, JAL international, ANA domestic, ANA international. Proposed initial examples are ¥1.50/mile for domestic and ¥2.00/mile for international, for each airline. They are illustrative defaults, not market valuations. Positive targets up to ¥10,000/mile are accepted in increments of ¥0.01.

## Inputs and fees

Cash fare includes fuel surcharge, taxes, and all other fees for the selected cash alternative. It need not be the same flight as the award alternative, but both should serve the same trip. It is optional. Required miles must be a positive whole number to calculate results. Prices and fees are nonnegative whole yen.

Award cash charges support either one total or a breakdown of fuel surcharge, taxes, and other fees. Missing fees are not silently assumed to be zero: users explicitly enter 0 for no charge. All three breakdown fields are required for calculation in that mode. Moving from breakdown to total sums completed fees. Moving from a known total to breakdown preserves the amount under Other fees with fuel and taxes initially zero, and explains that the user should supply the actual breakdown. An unknown total produces three empty fields. Each numeric amount and the combined fee total are limited to ¥1 trillion. Invalid numeric drafts clear the corresponding calculation input rather than retaining a stale recommendation.

## Calculations

- Value per mile against the selected cash alternative = (cash fare − award cash charges) / miles required.
- Break-even cash fare (the award ticket’s equivalent cost at target) = miles required × applicable airline/flight-type target + award cash charges.
- Cash fare above estimated ticket value: target favors miles.
- Cash fare below estimated ticket value: target favors cash.
- Equal values: neutral result, using a ¥0.005 comparison tolerance for floating-point arithmetic.
- Signed valuation difference = cash fare − break-even cash fare. A positive difference favors miles; a negative difference favors cash. Display its absolute amount with up to two decimal places and the winning payment method, so sub-yen differences do not appear as zero; omit the amount for equal or incomplete alternatives. This is not literal cash savings.

Without a cash fare, show the estimated ticket value and omit actual value and recommendation. Without valid miles or complete fees, show incomplete results. Negative actual values remain visible when award charges exceed the cash fare. Display values per mile to two decimal places and ticket prices to whole yen; compare using unrounded values. Recommendations reflect only the user's target and entered prices. Explain that times, airports, cabins, baggage, and flexibility may differ and are not priced by the calculator. Changing the cash airline never changes the mileage target; changing the award airline or domestic/international category does.

## Persistence and backups

Auto-save valid changes under `miles-master.v1` in localStorage. Save language, targets, comparison groups, options, and active comparison. Data is specific to the browser and site origin. Storage failures must be visible and must not prevent in-memory use or export.

JSON export contains schema `version: 2` and the complete saved state, including `cashAirline`, `cashFlight`, and `awardFlight`. Both flight-detail objects contain route, flight numbers, departure, return, and cabin. Import also accepts version 1: its shared labels are copied into two independent detail objects, cash airline remains unspecified, and prices and targets are preserved. The original localStorage key is retained so existing browser data migrates automatically. Import validates version, enumerations, amounts, target values, identifiers, and limits before asking to replace current data. Unsupported files leave current state intact. Maximum import size is 5 MiB; up to 100 groups and 100 options per group. Reject duplicate group IDs or duplicate option IDs within a group. Discard unknown fields. Imported text is escaped when rendered.

Unreadable local data is preserved until an explicit reset or import. Offer a recovery download rather than automatically overwriting it. Confirm destructive option/group deletion, backup replacement, and storage reset. Deleting the final group creates a new empty comparison.

## Responsive interface and accessibility

Comparison pairs appear vertically within a trip. Each pair prominently displays the payment recommendation, valuation difference, and supporting break-even fare and value per mile. Cash and award entry panels sit side by side when space permits and stack on narrow screens. Use a sidebar on wider screens and a compact trip selector on phones. Flight details collapse by default. Narrow panels stack their date and other fields to avoid clipping. Avoid page-wide horizontal scrolling. Inputs have visible labels, keyboard focus indicators, and touch-friendly controls. Announce calculation updates and status messages. Set document language when switching interfaces.

## Acceptance examples

1. ¥50,000 cash fare, 20,000 miles, and ¥5,000 award charges produce ¥2.25/mile. At ¥2/mile target, break-even cash fare is ¥45,000 and miles are favored by ¥5,000 at the target valuation.
2. The same redemption without a cash fare still shows ¥45,000 estimated value, without a recommendation.
3. ¥3,000 fuel + ¥1,500 taxes + ¥500 other fees produces the same result as ¥5,000 total charges.
4. Reload retains comparisons and targets; exporting and importing reproduces that state.
5. Switching award airline or domestic/international updates the applicable target and results; changing cash airline does not.
6. An ANA cash flight from HND and a JAL award flight from NRT can be entered independently for the same trip; both sets of labels survive reload and backup/import.
7. A version 1 backup retains its fares, targets, and labels when upgraded to version 2.
8. Both interfaces work at narrow phone and wide desktop widths.

## Future extensions

More currencies and languages, manual and automatic exchange rates, passengers, paid-ticket mileage earnings, and additional airlines. These are outside version 1.

## Development and delivery

- Use test-driven development: failing behavior test, implementation, then refactoring.
- Vitest and React Testing Library cover calculation rules, storage failures, import/export, and UI workflows.
- GitHub Actions checks formatting, TypeScript, tests, coverage, and production builds on pull requests and pushes to main.
- Use Conventional Commit messages. Keep the original repository history and LICENSE.
- Include Copilot review context, but do not enable a paid review service. GitHub Copilot Free does not include code review.
- Prepare a manually triggered Cloudflare deployment workflow. Publication remains deferred until explicitly requested.
