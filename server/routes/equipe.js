import { Router } from "express";
import { sql } from "../db.js";
import { limiteEquipePorUnidade, ehEstouroDeEquipe, mensagemEstouro } from "../limites.js";

// Funcionários da barbearia.
//
// Saiu de `crudDeBarbearia` (server/crud.js) quando ganhou regra própria: todo
// funcionário pertence a uma UNIDADE, e cada unidade tem teto de ativos. O
// filtro por `barbeiro_id` que a fábrica garantia está aqui em toda consulta,
// escrito à mão — é ele que separa uma conta da outra.
//
// O teto é imposto pela trigger `equipe_limite_por_unidade` no banco. A
// checagem desta rota existe só para a mensagem ser boa; a trigger é quem
// decide, inclusive contra duas requisições simultâneas.

const router = Router();

// Resolve a unidade destino: precisa existir E ser desta conta. Sem este
// filtro, mandar o id da unidade de outra barbearia cadastraria gente lá.
async function unidadeDaConta(barbeiroId, unidadeId) {
  if (unidadeId) {
    const [u] = await sql`
      select id, nome from unidades
       where id = ${unidadeId} and barbeiro_id = ${barbeiroId}
    `;
    return u || null;
  }
  // Sem unidade informada, cai na mais antiga — o caso de quem só tem uma.
  const [u] = await sql`
    select id, nome from unidades
     where barbeiro_id = ${barbeiroId}
     order by criado_em, id
     limit 1
  `;
  return u || null;
}

const listar = (barbeiroId) => sql`
  select e.id, e.nome, e.ativo, e.unidade_id, u.nome as unidade_nome
    from equipe e
    join unidades u on u.id = e.unidade_id
   where e.barbeiro_id = ${barbeiroId}
   order by u.criado_em, e.ativo desc, e.nome
`;

router.get("/", async (req, res) => {
  res.json(await listar(req.barbeiroId));
});

router.post("/", async (req, res) => {
  const nome = String(req.body?.nome ?? "").trim();
  if (!nome) return res.status(400).json({ erro: "Informe o nome do funcionário." });

  const unidade = await unidadeDaConta(req.barbeiroId, req.body?.unidade_id);
  if (!unidade) return res.status(400).json({ erro: "Selecione uma unidade válida." });

  const teto = await limiteEquipePorUnidade();
  try {
    const [novo] = await sql`
      insert into equipe (barbeiro_id, unidade_id, nome, ativo)
      values (${req.barbeiroId}, ${unidade.id}, ${nome}, ${req.body?.ativo ?? true})
      returning id, nome, ativo, unidade_id
    `;
    res.status(201).json({ ...novo, unidade_nome: unidade.nome });
  } catch (e) {
    if (ehEstouroDeEquipe(e)) return res.status(409).json({ erro: mensagemEstouro(teto) });
    throw e;
  }
});

router.patch("/:id", async (req, res) => {
  const [atual] = await sql`
    select id, nome, ativo, unidade_id from equipe
     where id = ${req.params.id} and barbeiro_id = ${req.barbeiroId}
  `;
  if (!atual) return res.status(404).json({ erro: "Funcionário não encontrado." });

  const nome = req.body?.nome === undefined ? atual.nome : String(req.body.nome).trim();
  if (!nome) return res.status(400).json({ erro: "Informe o nome do funcionário." });

  // Trocar de unidade é permitido, desde que a nova seja desta conta.
  let unidadeId = atual.unidade_id;
  if (req.body?.unidade_id !== undefined) {
    const u = await unidadeDaConta(req.barbeiroId, req.body.unidade_id);
    if (!u) return res.status(400).json({ erro: "Selecione uma unidade válida." });
    unidadeId = u.id;
  }

  const teto = await limiteEquipePorUnidade();
  try {
    const [linha] = await sql`
      update equipe set
        nome       = ${nome},
        ativo      = ${req.body?.ativo ?? atual.ativo},
        unidade_id = ${unidadeId}
      where id = ${req.params.id} and barbeiro_id = ${req.barbeiroId}
      returning id, nome, ativo, unidade_id
    `;
    const [u] = await sql`select nome from unidades where id = ${linha.unidade_id}`;
    res.json({ ...linha, unidade_nome: u?.nome ?? "" });
  } catch (e) {
    if (ehEstouroDeEquipe(e)) return res.status(409).json({ erro: mensagemEstouro(teto) });
    throw e;
  }
});

router.delete("/:id", async (req, res) => {
  const apagados = await sql`
    delete from equipe where id = ${req.params.id} and barbeiro_id = ${req.barbeiroId}
    returning id
  `;
  if (!apagados.length) return res.status(404).json({ erro: "Funcionário não encontrado." });
  res.json({ ok: true });
});

export default router;
