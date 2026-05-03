# inventoryMaster-2 — Vehicle Inventory & Quotation Management System

## Overview
A comprehensive vehicle inventory and quotation management system targeting Arabic-speaking car dealerships. The UI is fully in Arabic (RTL).

## Features
- Vehicle inventory tracking (manufacturer, model, trim, chassis, colors)
- Sales quotations and PDF invoice generation
- Financing calculator with bank-specific interest rates
- HR: employee attendance, work schedules, leave requests
- CRM: customer interactions and reservations
- Appearance/branding customization

## Tech Stack
- **Frontend**: React 18 + Vite, Tailwind CSS, Shadcn UI, TanStack Query, wouter, React Hook Form + Zod
- **Backend**: Node.js + Express
- **Database**: PostgreSQL via Neon (serverless), Drizzle ORM
- **Auth**: Passport.js with local strategy + bcryptjs (username/password)
- **PDF**: jspdf + html2canvas
- **Other**: Firebase (client-side analytics only), multer (file uploads), xlsx (Excel import/export)

## Project Structure
```
client/          # React frontend (Vite)
  src/
    components/  # UI + domain components
    hooks/       # Custom hooks
    pages/       # App views
    lib/         # Utilities (queryClient, firebase analytics)
server/          # Express backend
  routes.ts      # Main API routes (4400+ lines)
  routes/
    integration.ts  # Integration settings UI (mock)
  db.ts          # Neon DB connection
  storage.ts     # DB interaction layer
  vite.ts        # Vite middleware setup
  index.ts       # Entry point
shared/
  schema.ts      # Drizzle schema (source of truth)
public/          # Static assets
```

## Running the App
- **Dev**: `npm run dev` (runs `npx tsx server/index.ts` on port 5000)
- **Build**: `npm run build`
- **Start (prod)**: `npm start`
- **DB push**: `npm run db:push`

## Environment Variables
- `NEON_DATABASE_URL` — PostgreSQL connection string (set in .replit userenv)
- `DATABASE_URL` — fallback alias for the DB URL
- `SESSION_SECRET` — optional, for session signing
- `OPENAI_API_KEY` — optional, for AI features

## Authentication
Uses Passport.js local strategy with bcrypt-hashed passwords stored in the `users` table. Sessions managed with express-session + memorystore.

## Database
Connected to Neon (serverless PostgreSQL). Schema managed via Drizzle Kit. Run `npm run db:push` to sync schema changes.

## Notes
- The `server/firebase-entry.ts` file is a legacy Firebase Functions entry point — not used in Replit.
- Firebase on the client is analytics-only (no auth, no Firestore).
- `server/routes/integration.ts` is a UI settings mock — no live external API calls.
