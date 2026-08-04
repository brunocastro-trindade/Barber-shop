// Aplica db/schema.sql no banco apontado por DATABASE_URL.
// Uso: npm run db:migrate
import { Client } from "@neondatabase/serverless";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

if (!process.env.DATABASE_URL) {
  console.error("\nDATABASE_URL não definida. Crie o .env.local a partir do .env.example.\n");
  process.exit(1);
}

const schema = fs.readFileSync(path.join(raiz, "db", "schema.sql"), "utf8");
const client = new Client(process.env.DATABASE_URL);

try {
  await client.connect();
  await client.query(schema);
  const { rows } = await client.query(`
    select table_name from information_schema.tables
    where table_schema = 'public' order by table_name
  `);
  console.log("Schema aplicado. Tabelas no banco:");
  for (const r of rows) console.log("  ·", r.table_name);
} catch (e) {
  console.error("\nFalha ao aplicar o schema:", e.message, "\n");
  process.exitCode = 1;
} finally {
  await client.end();
}
