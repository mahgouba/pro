import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { onRequest } from "firebase-functions/v2/https";
import { registerRoutes } from "./routes";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

let initPromise: Promise<void> | null = null;

async function initialize() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    await registerRoutes(app);
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });
  })();
  return initPromise;
}

export const api = onRequest(
  {
    memory: "1GiB",
    timeoutSeconds: 60,
    cors: true,
  },
  async (req, res) => {
    await initialize();
    return app(req, res);
  }
);
