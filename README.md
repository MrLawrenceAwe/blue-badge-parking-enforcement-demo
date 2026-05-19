# Blue Badge Parking Enforcement Demo

A React/Vite prototype for a digital Blue Badge parking enforcement system for UK councils.

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

For manual publishing, run `npm run build` and deploy the generated `dist/` folder to your static host of choice.

## What is included

- Digital badge profiles with signed demo QR verification tokens and badge status
- Locked digital parking session clock with tamper-evident demo attestation
- Badge holder, carer, officer, and council admin views
- Officer scan/lookup flow for badge ID, QR value, or vehicle registration
- Rules-based verification scoring and traffic-light verification outcomes
- Stolen badge reporting with immediate deactivation
- Admin dashboard with sessions, scans, cases, review scores, filters, and reactivation
- Accessible, high-contrast, mobile-first UI with large controls

This is a demo prototype with realistic mock data and in-memory state. It shows the intended enforcement flows, role boundaries, and tamper-evident behaviour, but it is not production authentication, storage, or backend security.

## Demo scripts

Use these paths when walking someone through the prototype.

1. Valid badge with active session
   - Start as `amelia.hart@example.test`
   - Review the digital badge, QR code, and active Oxford Street session
   - Switch to Officer and verify `BB-WCC-104928` with vehicle `LS24 HRT`
   - Confirm the result is valid and no enforcement case is needed

2. Vehicle mismatch escalation
   - Switch to Officer
   - Verify `BB-WCC-104928` with observed vehicle `WR64 BAD`
   - Review the unregistered vehicle escalation explanation
   - Open an enforcement case from the scan
   - Switch to Admin, open Cases, and inspect the new case

3. Stolen badge deactivation
   - Start as the holder or carer for `BB-WCC-104928`
   - Use Report stolen and confirm the incident details
   - Switch to Officer and scan the badge
   - Confirm the officer result shows a deactivated high-priority alert
   - Switch to Admin and reactivate after review when appropriate

4. Verification-rule tuning
   - Switch to Admin and open Verification rules
   - Adjust monitor, review, or high-priority thresholds
   - The app rejects inverted threshold ordering and out-of-range values
   - Re-run an officer scan to see scores update immediately

## Production hardening checklist

This prototype intentionally runs entirely in the browser. A production version should move these responsibilities server-side:

- Authentication, password handling, sessions, and account recovery
- Role and badge-access authorization
- Audit-log writes and case mutations
- Badge QR token issuance, key rotation, revocation, and verification policy
- Session proof signing and immutable evidence storage
- Council data storage, retention, deletion, and disclosure workflows

## Quality checks

```bash
npm run lint
npm run test
npm run build
npm run test:e2e
```

Pull requests run the same checks through GitHub Actions, including Playwright smoke and accessibility assertions.
