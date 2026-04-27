# Deploying to Vercel

## Deployment Requirements

### 1. Database Setup
- Use **Neon Database** (recommended) or any other cloud PostgreSQL provider.
- Obtain your `DATABASE_URL`.

### 2. Required Environment Variables
Add these to your Vercel Project Settings:

```
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
NODE_ENV=production
SESSION_SECRET=your-strong-session-secret-here
```

### 3. Vercel Project Settings
1. Connect your repository to Vercel.
2. Framework Preset: **Vite** (Vercel should detect this automatically).
3. Build Command: `npm run build` (or leave as default).
4. Output Directory: `dist/public`.
5. Install Command: `npm install`.
6. Root Directory: `.` (Project root).

### 4. Configuration Files

#### vercel.json
- Optimized for Vite + Express on Vercel
- Correct output directory: `dist/public`
- Catch-all rewrite for SPA routing

#### api/index.ts
- Entry point for Vercel Serverless Functions
- Connects Express app to Vercel's environment
- Uses `@neondatabase/serverless` via `server/db.ts` for efficient HTTP-based database access

#### tsconfig.server.json
- TypeScript configuration for the backend functions
- Ensures proper compilation for Node.js environment on Vercel

### 5. Deployment Structure
```
├── server/           # Backend API logic
├── client/           # Frontend React App  
├── shared/           # Shared schemas and types
├── dist/public/      # Final build files (served by Vercel)
├── vercel.json       # Vercel configuration
└── package.json      # Project dependencies and scripts
```

### 6. Deployment Steps
1. Ensure your cloud database (Neon) is ready.
2. Push your code to a GitHub repository.
3. Import the repository in Vercel.
4. Add the required Environment Variables.
5. Deploy!

### 7. Important Notes
- Ensure `DATABASE_URL` includes `sslmode=require`.
- User sessions currently use `MemoryStore` (suitable for testing/small scale).
- For production, consider using Redis for session management.

### 8. Post-Deployment Checklist
- [ ] Homepage loads correctly.
- [ ] User authentication works.
- [ ] Inventory data is displayed.
- [ ] API functions are responsive.

### 9. Troubleshooting
- Check **Vercel Function Logs** for backend errors.
- Verify environment variables are correct.
- Check database connectivity and permissions.