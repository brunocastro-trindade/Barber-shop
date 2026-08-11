// Aplica db/schema.sql no banco.
// Uso: npm run db:migrate (local) · npm run release (deploy)
//
// ── Qual credencial esta migração usa ────────────────────────────────────────
//
// `DATABASE_URL_MIGRACAO` primeiro, `DATABASE_URL` como alternativa.
//
// Em produção a aplicação roda com um papel restrito, que de propósito NÃO faz
// DDL (ver o checklist em CONTEXT.md). O schema tem 46 instruções de DDL, então
// a migração precisa do papel dono, que vive numa variável separada.
//
// A escolha mora aqui, e não numa linha de shell no render.yaml, porque lá ela
// falhava calada: `DATABASE_URL="$DATABASE_URL_MIGRACAO" npm run release` com a
// variável ausente vira `DATABASE_URL=""`, e o erro que aparecia era
// "DATABASE_URL não definida" — apontando para a variável errada. Aqui a
// mensagem diz exatamente qual falta.
//
// Onde só existe DATABASE_URL (máquina de quem desenvolve), a alternativa faz o
// comando seguir funcionando sem configuração extra.
import { Client } from "@neondatabase/serverless";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const url = process.env.DATABASE_URL_MIGRACAO || process.env.DATABASE_URL;

if (!url) {
  console.error(
    "\nNenhuma connection string para migrar.\n" +
    "  Em deploy:  defina DATABASE_URL_MIGRACAO com o papel DONO do banco.\n" +
    "  Na sua máquina: DATABASE_URL no .env.local (veja o .env.example).\n"
  );
  process.exit(1);
}

console.log(
  process.env.DATABASE_URL_MIGRACAO
    ? "Migrando com DATABASE_URL_MIGRACAO (papel dono)."
    : "Migrando com DATABASE_URL (DATABASE_URL_MIGRACAO não definida)."
);

const schema = fs.readFileSync(path.join(raiz, "db", "schema.sql"), "utf8");
const client = new Client(url);

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
