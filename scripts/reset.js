// DESTRUTIVO: apaga todas as tabelas e recria o schema do zero.
// Uso: npm run db:reset  [-- --force]
//
// Sem --force, o script se recusa a rodar caso exista qualquer registro. Isso
// existe para o dia em que houver barbearia de verdade no banco e alguém
// (provavelmente você, com pressa) rodar isto por engano.
import { Client } from "@neondatabase/serverless";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const force = process.argv.includes("--force");

if (!process.env.DATABASE_URL) {
  console.error("\nDATABASE_URL não definida. Crie o .env.local a partir do .env.example.\n");
  process.exit(1);
}

const client = new Client(process.env.DATABASE_URL);

try {
  await client.connect();

  // Conta o que existe hoje, ignorando tabelas que ainda não foram criadas.
  const { rows: tabelas } = await client.query(`
    select table_name from information_schema.tables
    where table_schema = 'public'
  `);

  let total = 0;
  for (const { table_name } of tabelas) {
    const { rows } = await client.query(`select count(*)::int as n from "${table_name}"`);
    total += rows[0].n;
  }

  if (total > 0 && !force) {
    console.error(
      `\nO banco tem ${total} registros em ${tabelas.length} tabelas.\n` +
      "Este comando apagaria todos eles.\n\n" +
      "Se é isso mesmo que você quer:  npm run db:reset -- --force\n"
    );
    process.exit(1);
  }

  console.log(total === 0 ? "Banco vazio — recriando schema." : `Apagando ${total} registros (--force).`);

  await client.query(fs.readFileSync(path.join(raiz, "db", "reset.sql"), "utf8"));
  await client.query(fs.readFileSync(path.join(raiz, "db", "schema.sql"), "utf8"));

  const { rows } = await client.query(`
    select table_name from information_schema.tables
    where table_schema = 'public' order by table_name
  `);
  console.log("\nSchema recriado. Tabelas:");
  for (const r of rows) console.log("  ·", r.table_name);
} catch (e) {
  console.error("\nFalha no reset:", e.message, "\n");
  process.exitCode = 1;
} finally {
  await client.end();
}
