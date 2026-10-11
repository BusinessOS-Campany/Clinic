import { Client } from "pg";
import "dotenv/config";

async function main() {
  const url = new URL(process.env.DATABASE_URL!);
  const admin = new Client({
    host: url.hostname,
    port: Number(url.port || 5432),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: "postgres",
  });
  await admin.connect();
  const dbName = url.pathname.slice(1);
  // Terminate all connections to the database
  await admin.query(`
    SELECT pg_terminate_backend(pg_stat_activity.pid)
    FROM pg_stat_activity
    WHERE pg_stat_activity.datname = '${dbName}'
      AND pid <> pg_backend_pid();
  `);
  await admin.query(`DROP DATABASE IF EXISTS "${dbName}"`);
  await admin.query(`CREATE DATABASE "${dbName}"`);
  console.log(`Recreated database ${dbName}`);
  await admin.end();
}

main().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});