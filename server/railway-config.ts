// Railway database configuration
export const RAILWAY_DATABASE_URL = "postgresql://postgres:TueqQrTNoDNBPZoWIUFrIlxFUZdUmpWJ@shortline.proxy.rlwy.net:52512/railway";

export const getRailwayConfig = () => {
  return {
    connectionString: RAILWAY_DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
}