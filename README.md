# TurfMate — Manhattan Cricket

A mobile-friendly React + TypeScript starter for tracking cricket turf sessions, splitting costs equally among participants, managing a player roster and recording contributions.

## Current status: local UI prototype

- Overview, Sessions, Players and Payments screens.
- Add players, create sessions and record partial contributions.
- Demo data persists in this browser using localStorage.

**Not production-ready:** there is no phone OTP, shared database, multi-user sync, organiser verification workflow, automated reminders or UPI integration. Data is local to the browser/device. Do not use this as the group's authoritative ledger yet.

## Run locally

```bash
npm install
npm run dev
```

## Production milestones

1. Create Supabase schema for profiles, group membership, sessions, session participants, expenses and append-only payment records.
2. Configure phone OTP and confirm SMS-provider pricing in India.
3. Enforce row-level security and organiser-only payment verification.
4. Add session-aware ledger, partial payment allocation, roles and audit history.
5. Deploy to Vercel and enable PWA installation.

Never expose a Supabase service-role key in frontend code. Use the public anon/publishable key with correctly configured RLS.
