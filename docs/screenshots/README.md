# Screenshot Guide

Use only sanitized demo data in screenshots. Do not capture real bounty targets, browser profiles, reports, aliases, tokens, customer data, or private notes.

## Run Locally

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## Recommended Screenshots

- `dashboard-overview.png` - Hero, stats, Safe by Design, and workflow overview.
- `paste-target-in-scope.png` - Demo Shop profile with `https://demo-shop.example` allowed and authorization checked.
- `paste-target-out-of-scope.png` - A fake out-of-scope host such as `https://outside.example` blocked.
- `candidate-statuses.png` - Mapping only, needs owned-account proof, candidate finding, out of scope, and report ready badges.
- `request-map-preview.png` - Sanitized request map with fake IDs.
- `report-readiness.png` - Report readiness checklist with one pending media item.
- `mobile-dashboard.png` - Responsive layout at a mobile width.

## Portfolio Use

Good places to use screenshots:

- GitHub README.
- Handshake project entry.
- LinkedIn featured project post.
- Portfolio website case-study page.

Keep image names lowercase and descriptive. Re-run `npm run public:safety` before committing screenshot references or generated image assets.
