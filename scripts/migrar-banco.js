// Copia os dados de um banco para outro. Uso típico: trocar o Neon de região.
//
//   DATABASE_URL=<origem> DESTINO_URL=<destino> npm run db:migrar-banco
//
// Aplica db/schema.sql no destino e copia tabela por tabela, na ordem das
// chaves estrangeiras. Não apaga nada na origem — se algo der errado no meio,
// o banco antigo continua intacto e você só refaz.
//
// Fica de fora, de propósito:
//   `limites_uso`  contadores de rate limit; nascem de novo sozinhos
//   convites usados  já foram consumidos, não valem nada no destino
//
// As senhas viajam como o hash bcrypt que já está gravado: quem entrava com a
// senha antiga continua entrando. Nenhuma senha em texto passa por aqui.
import { neon } from "@neondatabase/serverless";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const ORIGEM = process.env.DATABASE_URL;
const DESTINO = process.env.DESTINO_URL;

if (!ORIGEM || !DESTINO) {
  console.error(
    "\nInforme os dois bancos:\n" +
    "  DATABASE_URL=<origem> DESTINO_URL=<destino> npm run db:migrar-banco\n"
  );
  process.exit(1);
}
if (ORIGEM === DESTINO) {
  console.error("\nOrigem e destino são o mesmo banco. Nada a fazer.\n");
  process.exit(1);
}

const origem = neon(ORIGEM);
const destino = neon(DESTINO);

// Ordem importa: pai antes de filho, senão a chave estrangeira recusa.
const TABELAS = [
  "barbeiros", "unidades", "equipe", "clientes", "servicos", "produtos",
  "planos", "despesas", "assinaturas", "agendamentos", "visitas",
  "fila_espera", "favoritos", "avaliacoes",
];

const citar = (id) => `"${String(id).replace(/"/g, '""')}"`;

try {
  console.log("\nAplicando o schema no destino...");
  const schema = fs.readFileSync(path.join(raiz, "db", "schema.sql"), "utf8");
  await destino.query(schema);
  console.log("  schema aplicado.\n");

  // A trigger do teto de equipe precisa ficar quieta durante a cópia.
  //
  // Ela recusa o 4º funcionário ativo de uma unidade — o que está certo no uso
  // normal e errado aqui: uma conta criada antes da trigger pode ter mais de 3
  // (a migração de propósito manteve quem já estava), e a cópia falharia no meio
  // ao tentar recriar exatamente o que já existe na origem.
  await destino.query("alter table equipe disable trigger equipe_limite_por_unidade");

  let total = 0;
  for (const tabela of TABELAS) {
    const linhas = await origem.query(`select * from ${tabela}`);
    if (!linhas.length) {
      console.log(`  ${tabela.padEnd(14)} vazia`);
      continue;
    }

    const colunas = Object.keys(linhas[0]);
    const lista = colunas.map(citar).join(", ");

    for (const linha of linhas) {
      const marcadores = colunas.map((_, i) => `$${i + 1}`).join(", ");
      // `on conflict do nothing` deixa o comando ser repetido sem duplicar,
      // caso a cópia pare no meio e precise ser refeita.
      await destino.query(
        `insert into ${tabela} (${lista}) values (${marcadores}) on conflict do nothing`,
        colunas.map((c) => linha[c])
      );
    }
    total += linhas.length;
    console.log(`  ${tabela.padEnd(14)} ${linhas.length} linha(s)`);
  }

  // Convites ainda livres continuam valendo; os usados ficam para trás.
  const livres = await origem.query("select * from convites where usado_em is null");
  for (const c of livres) {
    await destino.query(
      "insert into convites (id, codigo, observacao, criado_em) values ($1,$2,$3,$4) on conflict do nothing",
      [c.id, c.codigo, c.observacao, c.criado_em]
    );
  }
  if (livres.length) console.log(`  convites       ${livres.length} livre(s)`);

  await destino.query("alter table equipe enable trigger equipe_limite_por_unidade");
  console.log(`\n${total + livres.length} linha(s) copiadas. Trigger do teto religada.`);

  // Confere os dois lados antes de você trocar a variável de ambiente.
  console.log("\nConferência:");
  for (const tabela of ["barbeiros", "unidades", "equipe", "clientes", "visitas", "agendamentos"]) {
    const [a] = await origem.query(`select count(*)::int as n from ${tabela}`);
    const [b] = await destino.query(`select count(*)::int as n from ${tabela}`);
    const igual = a.n === b.n;
    console.log(`  ${igual ? "ok  " : "DIFERE"} ${tabela.padEnd(14)} origem=${a.n} destino=${b.n}`);
  }
  console.log("\nA origem não foi alterada. Troque a DATABASE_URL só depois de conferir.\n");
} catch (e) {
  console.error("\nFalhou:", e.message);
  // Religa a trigger mesmo em caso de erro: deixá-la desligada seria pior do
  // que a falha — o teto de funcionários pararia de valer no banco novo, sem
  // nada indicando isso.
  try {
    await destino.query("alter table equipe enable trigger equipe_limite_por_unidade");
    console.error("Trigger do teto religada.");
  } catch { /* o destino pode nem ter chegado a existir */ }
  console.error("O banco de origem não foi tocado.\n");
  process.exitCode = 1;
}
