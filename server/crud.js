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
export function crudDeBarbearia({ tabela, colunas, ordem, validar, aoListar }) {
  const router = Router();
  const lista = colunas.join(", ");

  const buscarUm = async (id, barbeiroId) => {
    const { rows } = await sql.query(
      `select id, ${lista} from ${tabela} where id = $1 and barbeiro_id = $2`,
      [id, barbeiroId]
    );
    return rows[0] || null;
  };

  router.get("/", async (req, res) => {
    if (aoListar) return res.json(await aoListar(req.barbeiroId));
    const { rows } = await sql.query(
      `select id, ${lista} from ${tabela} where barbeiro_id = $1 order by ${ordem}`,
      [req.barbeiroId]
    );
    res.json(rows);
  });

  router.post("/", async (req, res) => {
    const erro = validar?.(req.body || {}, null);
    if (erro) return res.status(400).json({ erro });

    const marcadores = colunas.map((_, i) => `$${i + 2}`).join(", ");
    const valores = colunas.map((c) => req.body?.[c] ?? null);
    const { rows } = await sql.query(
      `insert into ${tabela} (barbeiro_id, ${lista})
       values ($1, ${marcadores})
       returning id, ${lista}`,
      [req.barbeiroId, ...valores]
    );
    res.status(201).json(rows[0]);
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
    const { rows } = await sql.query(
      `update ${tabela} set ${atribuicoes}
       where id = $1 and barbeiro_id = $2
       returning id, ${lista}`,
      [req.params.id, req.barbeiroId, ...colunas.map((c) => mesclado[c])]
    );
    res.json(rows[0]);
  });

  router.delete("/:id", async (req, res) => {
    const { rows } = await sql.query(
      `delete from ${tabela} where id = $1 and barbeiro_id = $2 returning id`,
      [req.params.id, req.barbeiroId]
    );
    if (!rows.length) return res.status(404).json({ erro: "Registro não encontrado." });
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
