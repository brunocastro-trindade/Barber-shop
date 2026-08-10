import { Router } from "express";
import { sql } from "../db.js";
import { limiteEquipePorUnidade } from "../limites.js";

// Unidades (filiais) de uma conta.
//
// Toda consulta filtra por `barbeiro_id` vindo do cookie assinado, nunca de um
// id no corpo ou na URL — mesma regra de server/crud.js, escrita à mão aqui
// porque esta rota tem lógica própria (contagem de ocupação e teto).

const router = Router();

const nomeValido = (v) => String(v ?? "").trim();

// A ocupação sai de agregação sobre `equipe`, não de um contador guardado:
// contador guardado desincroniza no primeiro caminho que alguém esquecer.
const listar = (barbeiroId) => sql`
  select u.id, u.nome, u.endereco, u.ativo,
         count(e.id) filter (where e.ativo)::int as funcionarios
    from unidades u
    left join equipe e on e.unidade_id = u.id
   where u.barbeiro_id = ${barbeiroId}
   group by u.id
   order by u.criado_em, u.nome
`;

router.get("/", async (req, res) => {
  const [unidades, limite] = await Promise.all([
    listar(req.barbeiroId),
    limiteEquipePorUnidade(),
  ]);
  res.json({
    limitePorUnidade: limite,
    unidades: unidades.map(u => ({ ...u, vagas: Math.max(0, limite - u.funcionarios) })),
  });
});

router.post("/", async (req, res) => {
  const nome = nomeValido(req.body?.nome);
  if (!nome) return res.status(400).json({ erro: "Informe o nome da unidade." });

  const [unidade] = await sql`
    insert into unidades (barbeiro_id, nome, endereco)
    values (${req.barbeiroId}, ${nome}, ${String(req.body?.endereco ?? "").trim()})
    returning id, nome, endereco, ativo
  `;
  const limite = await limiteEquipePorUnidade();
  res.status(201).json({ ...unidade, funcionarios: 0, vagas: limite });
});

router.patch("/:id", async (req, res) => {
  const [atual] = await sql`
    select id, nome, endereco, ativo from unidades
     where id = ${req.params.id} and barbeiro_id = ${req.barbeiroId}
  `;
  if (!atual) return res.status(404).json({ erro: "Unidade não encontrada." });

  const nome = req.body?.nome === undefined ? atual.nome : nomeValido(req.body.nome);
  if (!nome) return res.status(400).json({ erro: "Informe o nome da unidade." });

  const [unidade] = await sql`
    update unidades set
      nome     = ${nome},
      endereco = ${req.body?.endereco ?? atual.endereco},
      ativo    = ${req.body?.ativo ?? atual.ativo}
    where id = ${req.params.id} and barbeiro_id = ${req.barbeiroId}
    returning id, nome, endereco, ativo
  `;
  res.json(unidade);
});

// Apagar unidade com gente dentro levaria a equipe junto (o cascade da FK).
// Preferimos barrar e explicar: a perda seria silenciosa e irreversível.
router.delete("/:id", async (req, res) => {
  const [unidade] = await sql`
    select id from unidades where id = ${req.params.id} and barbeiro_id = ${req.barbeiroId}
  `;
  if (!unidade) return res.status(404).json({ erro: "Unidade não encontrada." });

  const [{ n }] = await sql`select count(*)::int as n from equipe where unidade_id = ${unidade.id}`;
  if (n > 0) {
    return res.status(409).json({
      erro: `Esta unidade ainda tem ${n} ${n === 1 ? "funcionário" : "funcionários"}. Mova ou remova essa equipe antes de apagar.`,
    });
  }

  // A conta precisa sobrar com pelo menos uma unidade: equipe sem casa não
  // teria onde ser cadastrada.
  const [{ total }] = await sql`select count(*)::int as total from unidades where barbeiro_id = ${req.barbeiroId}`;
  if (total <= 1) {
    return res.status(409).json({ erro: "Sua conta precisa de pelo menos uma unidade." });
  }

  await sql`delete from unidades where id = ${unidade.id} and barbeiro_id = ${req.barbeiroId}`;
  res.json({ ok: true });
});

export default router;
