// Apply a SQL migration file to the Neon database.
// Usage: node --env-file=.env.local scripts/migrate.mjs lib/migrations/006_user_display_name.sql
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const file = process.argv[2];
if (!file) {
  console.error("usage: node --env-file=.env.local scripts/migrate.mjs <file.sql>");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set (pass --env-file=.env.local)");
  process.exit(1);
}

const text = readFileSync(file, "utf8");
const sql = neon(process.env.DATABASE_URL);
// Neon's http client is a tagged-template function; invoke it with a
// no-interpolation template so the literal SQL is sent as-is.
await sql(Object.assign([text], { raw: [text] }));
console.log(`Applied migration: ${file}`);
