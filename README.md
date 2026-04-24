# SubTrack

SubTrack is a private React dashboard for tracking substitute teaching assignments, assistant-sub work, payments, hours, and expected pay.

## Features

- Log teacher-sub and instructional assistant-sub assignments.
- Track schools, classes, teachers, districts, start/end times, and hours.
- Calculate expected pay from the saved assignment type.
- View dashboard totals for paid earnings, expected pay, assignments, hours, school-year periods, monthly trends, district split, and biweekly expected pay.
- Log actual payment records.
- Import and export records as CSV.
- Switch between dark and light mode.
- Protect the deployed app with a Cloudflare Worker login and store app data through a Cloudflare KV-backed API.

## Local Development

Prerequisites:

- Node.js

Install dependencies:

```bash
npm install
```

Start the local Vite server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Deployment Notes

The frontend is a Vite app. The included Cloudflare Worker handles password-gated access, proxies the static app, and exposes `/api/data` for loading and saving assignment/payment data.

Do not commit real environment values, passwords, API keys, Cloudflare account details, or production KV data. Keep deployment secrets in your hosting provider's environment/secret settings.
