import { Router } from "express";
import { sql } from "./db.js";

// Fábrica de rotas CRUD para tabelas que pertencem a uma barbearia.
//
// Existe por um motivo de segurança, não de economia de linhas: o filtro por
// barbeiro_id é o que impede uma conta de ler ou alterar dados de outra. Tendo
// cinco cópias manuais desse filtro, basta uma distração para vazar tudo. Aqui
// ele está escrito uma vez só, e nenhuma rota consegue esquecê-lo.
//
// Os nomes de tabela e coluna vêm sempre do nosso próprio código (nunca do
// corpo da requisição), então interpolá-los é seguro; os *valores* seguem
// parametrizados.
// `numericos` lista as colunas do tipo numeric. Postgres devolve numeric como
// STRING para não perder precisão, então "75.00" chegaria no front e qualquer
// soma viraria concatenação. Convertemos para float8 na saída — dinheiro de
// barbearia cabe com folga na precisão de um double.
//
// `datas` lista as colunas do tipo date. Elas saem como TEXTO 'YYYY-MM-DD', e
// não como objeto Date: o driver devolveria um Date à meia-noite local, e
// reenviá-lo ao banco num PATCH parcial converte para UTC — a data anda um dia
// para quem está a leste de Greenwich. Como texto, ida e volta é idêntica.
export function crudDeBarbearia({ tabela, colunas, ordem, validar, aoListar, numericos = [], datas = [] }) {
  const router = Router();
  const selecao = colunas
    .map((c) => {
      if (numericos.includes(c)) return `${c}::float8 as ${c}`;
      if (datas.includes(c)) return `to_char(${c}, 'YYYY-MM-DD') as ${c}`;
      return c;
    })
    .join(", ");

  const buscarUm = async (id, barbeiroId) => {
    const linhas = await sql.query(
      `select id, ${selecao} from ${tabela} where id = $1 and barbeiro_id = $2`,
      [id, barbeiroId]
    );
    return linhas[0] || null;
  };

  router.get("/", async (req, res) => {
    if (aoListar) return res.json(await aoListar(req.barbeiroId));
    const linhas = await sql.query(
      `select id, ${selecao} from ${tabela} where barbeiro_id = $1 order by ${ordem}`,
      [req.barbeiroId]
    );
    res.json(linhas);
  });

  router.post("/", async (req, res) => {
    const erro = validar?.(req.body || {}, null);
    if (erro) return res.status(400).json({ erro });

    // Só insere as colunas que vieram no corpo. Mandar `null` explícito para as
    // ausentes atropelava o DEFAULT da tabela: criar uma despesa sem `data`
    // violava o `not null` em vez de cair no dia de hoje.
    const presentes = colunas.filter((c) => req.body?.[c] !== undefined);
    const marcadores = presentes.map((_, i) => `$${i + 2}`).join(", ");
    const valores = presentes.map((c) => req.body[c]);

    const linhas = await sql.query(
      presentes.length
        ? `insert into ${tabela} (barbeiro_id, ${presentes.join(", ")})
           values ($1, ${marcadores})
           returning id, ${selecao}`
        : `insert into ${tabela} (barbeiro_id) values ($1) returning id, ${selecao}`,
      [req.barbeiroId, ...valores]
    );
    res.status(201).json(linhas[0]);
  });

  router.patch("/:id", async (req, res) => {
    const atual = await buscarUm(req.params.id, req.barbeiroId);
    if (!atual) return res.status(404).json({ erro: "Registro não encontrado." });

    // Campos ausentes no corpo mantêm o valor atual — PATCH é parcial.
    const mesclado = {};
    for (const c of colunas) mesclado[c] = req.body?.[c] ?? atual[c];

    const erro = validar?.(mesclado, atual);
    if (erro) return res.status(400).json({ erro });

    const atribuicoes = colunas.map((c, i) => `${c} = $${i + 3}`).join(", ");
    const linhas = await sql.query(
      `update ${tabela} set ${atribuicoes}
       where id = $1 and barbeiro_id = $2
       returning id, ${selecao}`,
      [req.params.id, req.barbeiroId, ...colunas.map((c) => mesclado[c])]
    );
    res.json(linhas[0]);
  });

  router.delete("/:id", async (req, res) => {
    const linhas = await sql.query(
      `delete from ${tabela} where id = $1 and barbeiro_id = $2 returning id`,
      [req.params.id, req.barbeiroId]
    );
    if (!linhas.length) return res.status(404).json({ erro: "Registro não encontrado." });
    res.json({ ok: true });
  });

  return router;
}

// ── Validações reaproveitadas ─────────────────────────────────────────────────

export const textoObrigatorio = (valor, campo) =>
  String(valor ?? "").trim() ? null : `Informe ${campo}.`;

export const numeroNaFaixa = (valor, campo, min, max) => {
  const n = Number(valor);
  if (!Number.isFinite(n)) return `${campo} precisa ser um número.`;
  if (n < min || n > max) return `${campo} deve ficar entre ${min} e ${max}.`;
  return null;
};
