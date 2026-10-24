# Miles Master review guidance

This is a frontend-only React 18 + TypeScript + Vite app using Semantic UI React.
Read SPECIFICATION.md for the accepted product scope and CONTRIBUTING.md for TDD.

When reviewing changes:

- Verify `(cash fare - award cash charges) / miles` and `miles * target + award cash charges`. Award cash charges include fuel surcharge, taxes, and other fees.
- Do not assume an empty fee is zero. A missing cash fare permits an estimate but no cash-versus-miles recommendation. Reject zero required miles for calculations.
- Keep JAL/ANA and domestic/international target values independent. Targets use hundredths of a yen.
- Each option covers one person and the entire one-way or round-trip itinerary.
- Preserve schema-versioned localStorage data and validated JSON backups. Corrupt stored data must remain recoverable. Imported labels must never be injected as HTML.
- Check that Japanese and English translations have matching keys and interpolation placeholders, and that added controls have accessible labels.
- Review both phone and desktop layouts. Avoid introducing a backend, API secrets, currency conversion, live fare scraping, or partner-airline logic into version 1.
- Expect behavior tests before fixes/features, then passing `pnpm run check`. Do not replace tests with assertions that merely mirror implementation details.
- Preserve React 18 compatibility with Semantic UI React 2.x; do not bypass peer dependencies with `--force` or `--legacy-peer-deps`.
- Deployment is a manual action. Ordinary pull requests and pushes must not publish the app.

These instructions configure review context only. They do not enable Copilot, purchase a subscription, or trigger reviews.
