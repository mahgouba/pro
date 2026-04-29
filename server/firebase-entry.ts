import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

// Secrets are bound from Google Secret Manager at runtime.
// Set them with:
//   firebase functions:secrets:set DATABASE_URL
//   firebase functions:secrets:set NEON_DATABASE_URL   (optional alias)
//   firebase functions:secrets:set SESSION_SECRET
const DATABASE_URL = defineSecret("DATABASE_URL");
const NEON_DATABASE_URL = defineSecret("NEON_DATABASE_URL");
const SESSION_SECRET = defineSecret("SESSION_SECRET");

let initPromise: Promise<express.Express> | null = null;

async function buildApp(): Promise<express.Express> {
  // Make secret values visible as standard env vars before any module that
  // reads process.env (e.g. server/db.ts) is loaded.
  if (!process.env.DATABASE_URL) {
    try {
      process.env.DATABASE_URL = DATABASE_URL.value();
    } catch {}
  }
  if (!process.env.NEON_DATABASE_URL) {
    try {
      process.env.NEON_DATABASE_URL = NEON_DATABASE_URL.value();
    } catch {}
  }
  if (!process.env.SESSION_SECRET) {
    try {
      process.env.SESSION_SECRET = SESSION_SECRET.value();
    } catch {}
  }

  // Lazy-import so the modules pick up env vars set above.
  const { registerRoutes } = await import("./routes");

  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: false, limit: "50mb" }));

  await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  return app;
}

function initialize() {
  if (!initPromise) initPromise = buildApp();
  return initPromise;
}

export const api = onRequest(
  {
    memory: "1GiB",
    timeoutSeconds: 60,
    cors: true,
    secrets: [DATABASE_URL, NEON_DATABASE_URL, SESSION_SECRET],
  },
  async (req, res) => {
    const app = await initialize();
    return app(req, res);
  }
);
