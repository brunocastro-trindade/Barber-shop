// Copia os dados de um banco para outro. Uso típico: trocar o Neon de região.
//
//   DESTINO_URL=<destino> npm run db:migrar-banco
//
// (a origem sai do DATABASE_URL do .env.local; dá para passar as duas na mão)
//
// Aplica db/schema.sql no destino e copia tabela por tabela, na ordem das
// chaves estrangeiras. Não apaga nada na origem — se algo der errado no meio,
// o banco antigo continua intacto e você só refaz.
//
// Fica de fora, de propósito:
//   `limites_uso`    contadores de rate limit; nascem de novo sozinhos
//   convites usados  já foram consumidos, não valem nada no destino
//
// As senhas viajam como o hash bcrypt que já está gravado: quem entrava com a
// senha antiga continua entrando. Nenhuma senha em texto passa por aqui.
//
// ── Por que `Client` e não `neon()` ──────────────────────────────────────────
// O driver HTTP (`neon()`) recusa SQL com mais de uma instrução —
// "cannot insert multiple commands into a prepared statement" — e o
// db/schema.sql é um arquivo inteiro de instruções. `Client` fala o protocolo
// do Postgres por WebSocket e aceita, que é o mesmo motivo de scripts/migrate.js
// usá-lo. Também sai mais rápido aqui: uma conexão para tudo, em vez de uma
// requisição HTTP por linha copiada.
import { Client } from "@neondatabase/serverless";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const ORIGEM = process.env.DATABASE_URL;
const DESTINO = process.env.DESTINO_URL;

if (!ORIGEM || !DESTINO) {
  console.error(
    "\nInforme os dois bancos:\n" +
    "  DESTINO_URL=<destino> npm run db:migrar-banco\n" +
    "  (a origem vem do DATABASE_URL do .env.local)\n"
  );
  process.exit(1);
}
if (ORIGEM === DESTINO) {
  console.error("\nOrigem e destino são o mesmo banco. Nada a fazer.\n");
  process.exit(1);
}

// Ordem importa: pai antes de filho, senão a chave estrangeira recusa.
const TABELAS = [
  "barbeiros", "unidades", "equipe", "clientes", "servicos", "produtos",
  "planos", "despesas", "assinaturas", "agendamentos", "visitas",
  "fila_espera", "favoritos", "avaliacoes",
];

const citar = (id) => `"${String(id).replace(/"/g, '""')}"`;

const origem = new Client(ORIGEM);
const destino = new Client(DESTINO);
let triggerDesligada = false;

try {
  await origem.connect();
  await destino.connect();
  console.log("\nConectado nos dois bancos.");

  console.log("Aplicando o schema no destino...");
  await destino.query(fs.readFileSync(path.join(raiz, "db", "schema.sql"), "utf8"));
  console.log("  schema aplicado.\n");

  // A trigger do teto de equipe precisa ficar quieta durante a cópia.
  //
  // Ela recusa o 4º funcionário ativo de uma unidade — o que está certo no uso
  // normal e errado aqui: uma conta criada antes da trigger pode ter mais de 3
  // (a migração de propósito manteve quem já estava), e a cópia falharia ao
  // tentar recriar exatamente o que já existe na origem.
  await destino.query("alter table equipe disable trigger equipe_limite_por_unidade");
  triggerDesligada = true;

  // Copia só as colunas que existem NOS DOIS lados.
  //
  // Um `select *` cego quebra na primeira diferença entre os bancos — e elas
  // acontecem: este projeto tinha `barbeiros.auth_user_id`, criada à mão
  // direto no banco, ausente do db/schema.sql e sem uso no código. A cópia
  // parava com "column auth_user_id does not exist".
  //
  // Coluna a mais na origem é ignorada (e listada abaixo, para você saber que
  // existe). Coluna a mais no destino fica com o default dela.
  const colunasDe = async (cliente, tabela) => {
    const { rows } = await cliente.query(
      `select column_name from information_schema.columns
        where table_schema = 'public' and table_name = $1`, [tabela]);
    return new Set(rows.map(r => r.column_name));
  };

  let total = 0;
  const ignoradas = [];
  for (const tabela of TABELAS) {
    const naOrigem = await colunasDe(origem, tabela);
    const noDestino = await colunasDe(destino, tabela);
    const colunas = [...naOrigem].filter(c => noDestino.has(c));
    const fora = [...naOrigem].filter(c => !noDestino.has(c));
    if (fora.length) ignoradas.push(`${tabela}.${fora.join(", " + tabela + ".")}`);

    const lista = colunas.map(citar).join(", ");
    const { rows } = await origem.query(`select ${lista} from ${tabela}`);
    if (!rows.length) {
      console.log(`  ${tabela.padEnd(14)} vazia`);
      continue;
    }

    const marcadores = colunas.map((_, i) => `$${i + 1}`).join(", ");

    for (const linha of rows) {
      // `on conflict do nothing` deixa o comando ser repetido sem duplicar,
      // caso a cópia pare no meio e precise ser refeita.
      await destino.query(
        `insert into ${tabela} (${lista}) values (${marcadores}) on conflict do nothing`,
        colunas.map((c) => linha[c])
      );
    }
    total += rows.length;
    console.log(`  ${tabela.padEnd(14)} ${rows.length} linha(s)`);
  }

  // Convites ainda livres continuam valendo; os usados ficam para trás.
  const { rows: livres } = await origem.query("select * from convites where usado_em is null");
  for (const c of livres) {
    await destino.query(
      "insert into convites (id, codigo, observacao, criado_em) values ($1,$2,$3,$4) on conflict do nothing",
      [c.id, c.codigo, c.observacao, c.criado_em]
    );
  }
  if (livres.length) console.log(`  convites       ${livres.length} livre(s)`);

  await destino.query("alter table equipe enable trigger equipe_limite_por_unidade");
  triggerDesligada = false;
  console.log(`\n${total + livres.length} linha(s) copiadas. Trigger do teto religada.`);

  if (ignoradas.length) {
    console.log(
      "\nColunas que existem na origem e não no destino, portanto NÃO copiadas:\n" +
      ignoradas.map(c => "  " + c).join("\n") +
      "\nSe alguma delas guardar algo que importa, o destino ficou sem esse dado."
    );
  }

  // Confere os dois lados antes de você trocar a variável de ambiente.
  console.log("\nConferência:");
  let divergiu = false;
  for (const tabela of TABELAS) {
    const a = await origem.query(`select count(*)::int as n from ${tabela}`);
    const b = await destino.query(`select count(*)::int as n from ${tabela}`);
    const na = a.rows[0].n, nb = b.rows[0].n;
    if (na !== nb) divergiu = true;
    if (na || nb) {
      console.log(`  ${na === nb ? "ok  " : "DIFERE"} ${tabela.padEnd(14)} origem=${na} destino=${nb}`);
    }
  }
  console.log(
    divergiu
      ? "\nALGO DIVERGIU. Não troque a DATABASE_URL ainda.\n"
      : "\nTudo confere. A origem não foi alterada — pode trocar a DATABASE_URL.\n"
  );
  if (divergiu) process.exitCode = 1;
} catch (e) {
  console.error("\nFalhou:", e.message);
  // Religa a trigger mesmo em caso de erro: deixá-la desligada seria pior do
  // que a falha — o teto de funcionários pararia de valer no banco novo, sem
  // nada indicando isso.
  if (triggerDesligada) {
    try {
      await destino.query("alter table equipe enable trigger equipe_limite_por_unidade");
      console.error("Trigger do teto religada.");
    } catch { /* a conexão pode ter caído junto */ }
  }
  console.error("O banco de origem não foi tocado.\n");
  process.exitCode = 1;
} finally {
  await origem.end().catch(() => {});
  await destino.end().catch(() => {});
}
