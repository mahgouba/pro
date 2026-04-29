# Firebase Deployment Guide

This project is organized for deployment on **Firebase Hosting** (frontend) and **Cloud Functions for Firebase** (Express API).

## Project Layout

```
.
├── client/                 React + Vite source (frontend)
├── server/                 Express API source
│   ├── index.ts            Local dev server entry (Replit / `npm run dev`)
│   ├── firebase-entry.ts   Firebase Cloud Function entry (exports `api`)
│   ├── routes.ts           All API routes
│   └── db.ts               Drizzle/Neon database connection
├── shared/                 Shared TypeScript types and Drizzle schema
├── functions/              Self-contained Firebase Functions package
│   ├── package.json        Function-only dependencies + build script
│   ├── .gitignore
│   └── src/                (reserved – build pulls from ../server)
├── public/                 Static assets shipped with the API
├── firebase.json           Firebase Hosting + Functions configuration
├── .firebaserc             Firebase project alias
└── dist/
    ├── public/             Vite build output → served by Firebase Hosting
    └── ...                 (server build output for non-Firebase targets)
```

## How it maps to Firebase

- **Hosting** serves `dist/public` (built by `npm run build`).
- **Cloud Function `api`** is built into `functions/lib/index.js` from `server/firebase-entry.ts`.
- All requests to `/api/**` are rewritten to the `api` function (see `firebase.json`).
- All other paths fall back to `index.html` for client-side routing.

## Required environment variables

Set these in Firebase Functions configuration before deploying:

```bash
firebase functions:secrets:set DATABASE_URL
# (if you use Neon serverless)
firebase functions:secrets:set NEON_DATABASE_URL
firebase functions:secrets:set SESSION_SECRET
```

Or use the deprecated `firebase functions:config:set` if your project still uses it.

## One-time setup

```bash
# Install Firebase CLI (once)
npm install -g firebase-tools

# Log in
firebase login

# Confirm the active project (configured in .firebaserc)
firebase use default
```

## Deploying

```bash
# 1. Build the frontend → dist/public
npm run build

# 2. Deploy hosting + the api function
firebase deploy
```

The `predeploy` hook in `firebase.json` automatically runs
`npm install` and the `build` script inside `functions/`,
which bundles `server/firebase-entry.ts` (and the rest of the
server code) into `functions/lib/index.js` using esbuild.

You can also deploy individual targets:

```bash
firebase deploy --only hosting
firebase deploy --only functions
```

## Local development

Local development is unchanged:

```bash
npm run dev
```

Express + Vite run together on port 5000. The `server/index.ts`
entry is used locally and is **not** deployed to Firebase.
