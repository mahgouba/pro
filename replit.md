# InventoryMaster — Vehicle Inventory & Dealership Management System

## Overview
A full-stack Arabic RTL dealership management system for vehicle inventory, quotations, invoicing, financing calculations, and HR. Built with React + Vite (frontend) and Express + Drizzle ORM (backend), running on a PostgreSQL database.

## Architecture

- **Frontend**: React 18 + Vite, Wouter routing, TanStack Query, shadcn/ui components, Tailwind CSS, RTL Arabic layout
- **Backend**: Express.js + TypeScript (tsx), Drizzle ORM, passport-local authentication, session-based auth stored in localStorage
- **Database**: Replit PostgreSQL (via `DATABASE_URL`)
- **Shared**: `shared/schema.ts` — single source of truth for all Drizzle table definitions and Zod schemas

## Key Features
- Vehicle inventory management (manufacturers, categories, trim levels, colors, chassis, images)
- Quotation creation and PDF generation
- Invoice management
- Financing calculator with bank-specific interest rates
- HR: attendance tracking, work schedules, leave requests
- CRM: reservations, sold vehicle tracking
- Appearance/branding customization (colors, logos, PDF templates)
- Role-based access: admin, inventory_manager, sales_director, accountant, bank_accountant, salesperson

## Running the App

```bash
npm run dev       # Start development server (port 5000)
npm run build     # Build for production
npm run db:push   # Push schema changes to database
```

## Default Credentials
- Username: `admin`
- Password: `admin123`
- Role: `admin`

## Project Structure

```
client/          — React frontend (Vite root)
  src/
    App.tsx      — Main router with role-based redirects
    pages/       — Page components
    components/  — UI components (dashboard, inventory, etc.)
    lib/         — Utilities (queryClient, firebase analytics)
server/          — Express backend
  index.ts       — Server entry point (port 5000)
  routes.ts      — All API routes (~4500 lines)
  db.ts          — PostgreSQL connection via Drizzle
  vite.ts        — Vite dev middleware
shared/
  schema.ts      — Drizzle schema + Zod validation schemas
public/          — Static assets (logos, images, sounds)
attached_assets/ — Additional images/templates
```

## Database
- Uses Replit's built-in PostgreSQL (`DATABASE_URL`)
- Schema defined in `shared/schema.ts` with Drizzle ORM
- Push schema changes: `npm run db:push`

## Authentication
- Custom passport-local authentication (no external auth provider)
- Sessions stored in `localStorage` under key `"auth"`
- Login endpoint: `POST /api/auth/login`
- Roles: admin, inventory_manager, sales_director, accountant, bank_accountant, salesperson, seller, user

## Deployment
- Build: `npm run build` (Vite + esbuild bundle)
- Run: `node ./dist/index.cjs`
- Deployment target: autoscale
