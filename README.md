# Blue Badge Parking Enforcement Demo

A React/Vite prototype for a secure digital Blue Badge parking enforcement system for UK councils.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite, usually `http://localhost:5173/`.

## Quick demo accounts

All demo accounts use password `demo123`.

- `amelia.hart@example.test` - holder journey
- `officer@example.test` - enforcement officer journey
- `admin@westminster.gov.uk` - council admin journey
- `maya.hart@example.test` - carer journey

## Share it

Recommended: use the included GitHub Pages workflow for a stable URL.

1. Push this project to GitHub
2. GitHub Actions will build and deploy automatically from `main`
3. Share the GitHub Pages URL

For a one-off share without a repo, run `npm run build` and upload the `dist/` folder to [Netlify Drop](https://app.netlify.com/drop).

## What is included

- Digital badge profiles with secure QR codes and badge status
- Locked digital parking session clock
- Badge holder, carer, officer, and council admin views
- Officer scan/lookup flow for badge ID, QR value, or vehicle registration
- Rules-based fraud scoring and traffic-light verification outcomes
- Stolen badge reporting with immediate deactivation
- Admin dashboard with sessions, scans, cases, fraud scores, filters, and reactivation
- Accessible, high-contrast, mobile-first UI with large controls

This is a demo prototype with realistic mock data and in-memory state. It is not production authentication, storage, or security.
