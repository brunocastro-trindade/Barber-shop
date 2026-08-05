// Gera e lista códigos de convite — o cadastro é fechado, então é por aqui que
// uma barbearia nova entra.
//
//   npm run convite -- "Barbearia do João"   cria um convite com observação
//   npm run convite -- --listar              mostra os convites e seu estado
import { neon } from "@neondatabase/serverless";
import crypto from "node:crypto";

if (!process.env.DATABASE_URL) {
  console.error("\nDATABASE_URL não definida. Crie o .env.local a partir do .env.example.\n");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const args = process.argv.slice(2);

// Sem I, O, 0 e 1: o código costuma ser ditado por telefone ou WhatsApp.
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const gerarCodigo = () =>
  Array.from(crypto.randomBytes(8))
    .map((b) => ALFABETO[b % ALFABETO.length])
    .join("")
    .replace(/^(.{4})(.{4})$/, "$1-$2");

try {
  if (args.includes("--listar")) {
    const convites = await sql`
      select c.codigo, c.observacao,
             to_char(c.criado_em, 'DD/MM/YYYY') as criado,
             to_char(c.usado_em, 'DD/MM/YYYY')  as usado,
             b.barbearia
      from convites c
      left join barbeiros b on b.id = c.usado_por
      order by c.criado_em desc
    `;
    if (!convites.length) {
      console.log("\nNenhum convite gerado ainda.\n");
    } else {
      console.log("\nCONVITE      ESTADO       CRIADO      OBSERVAÇÃO");
      for (const c of convites) {
        const estado = c.usado ? `usado ${c.usado}` : "livre";
        console.log(
          `${c.codigo}  ${estado.padEnd(16)} ${c.criado}  ${c.barbearia || c.observacao || ""}`
        );
      }
      console.log("");
    }
  } else {
    const observacao = args.filter((a) => !a.startsWith("--")).join(" ");
    const [novo] = await sql`
      insert into convites (codigo, observacao)
      values (${gerarCodigo()}, ${observacao})
      returning codigo
    `;
    console.log(`\nConvite criado: ${novo.codigo}`);
    if (observacao) console.log(`Para: ${observacao}`);
    console.log("\nEntregue este código a quem vai criar a conta. Vale uma vez só.\n");
  }
} catch (e) {
  console.error("\nFalhou:", e.message, "\n");
  process.exitCode = 1;
}
