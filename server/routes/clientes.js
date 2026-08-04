import { Router } from "express";
import { sql } from "../db.js";

const router = Router();

const TIPOS = ["assinante", "avulso"];

// Datas sempre viajam como texto YYYY-MM-DD. Deixar o driver converter para Date
// faria o dia "pular" conforme o fuso do servidor.
const SELECT_CLIENTES = (barbeiroId) => sql`
  select c.id, c.nome, c.telefone, c.tipo, c.obs, c.barbeiro_pref,
         count(v.id)::int                     as visitas,
         coalesce(sum(v.valor), 0)::float8    as total_gasto,
         to_char(max(v.data), 'YYYY-MM-DD')   as ultima_visita
  from clientes c
  left join visitas v on v.cliente_id = c.id
  where c.barbeiro_id = ${barbeiroId}
  group by c.id
  order by c.nome
`;

router.get("/", async (req, res) => {
  res.json(await SELECT_CLIENTES(req.barbeiroId));
});

router.post("/", async (req, res) => {
  const nome = (req.body?.nome || "").trim();
  const tipo = req.body?.tipo || "avulso";
  if (!nome) return res.status(400).json({ erro: "Informe o nome do cliente." });
  if (!TIPOS.includes(tipo)) return res.status(400).json({ erro: "Tipo de cliente inválido." });

  const [cliente] = await sql`
    insert into clientes (barbeiro_id, nome, telefone, tipo, obs, barbeiro_pref)
    values (${req.barbeiroId}, ${nome}, ${(req.body?.telefone || "").trim()}, ${tipo},
            ${req.body?.obs || ""}, ${req.body?.barbeiro_pref || ""})
    returning id, nome, telefone, tipo, obs, barbeiro_pref
  `;
  res.status(201).json({ ...cliente, visitas: 0, total_gasto: 0, ultima_visita: null });
});

router.patch("/:id", async (req, res) => {
  const [atual] = await sql`
    select * from clientes where id = ${req.params.id} and barbeiro_id = ${req.barbeiroId}
  `;
  if (!atual) return res.status(404).json({ erro: "Cliente não encontrado." });

  const tipo = req.body?.tipo ?? atual.tipo;
  if (!TIPOS.includes(tipo)) return res.status(400).json({ erro: "Tipo de cliente inválido." });

  const [cliente] = await sql`
    update clientes set
      nome          = ${req.body?.nome ?? atual.nome},
      telefone      = ${req.body?.telefone ?? atual.telefone},
      tipo          = ${tipo},
      obs           = ${req.body?.obs ?? atual.obs},
      barbeiro_pref = ${req.body?.barbeiro_pref ?? atual.barbeiro_pref}
    where id = ${req.params.id} and barbeiro_id = ${req.barbeiroId}
    returning id, nome, telefone, tipo, obs, barbeiro_pref
  `;
  res.json(cliente);
});

router.delete("/:id", async (req, res) => {
  const apagados = await sql`
    delete from clientes where id = ${req.params.id} and barbeiro_id = ${req.barbeiroId}
    returning id
  `;
  if (!apagados.length) return res.status(404).json({ erro: "Cliente não encontrado." });
  res.json({ ok: true });
});

// ── Histórico de visitas do cliente ───────────────────────────────────────────

router.get("/:id/visitas", async (req, res) => {
  const visitas = await sql`
    select v.id, to_char(v.data, 'YYYY-MM-DD') as data, v.servico, v.profissional, v.valor::float8
    from visitas v
    join clientes c on c.id = v.cliente_id
    where v.cliente_id = ${req.params.id} and c.barbeiro_id = ${req.barbeiroId}
    order by v.data desc, v.criado_em desc
  `;
  res.json(visitas);
});

router.post("/:id/visitas", async (req, res) => {
  const [cliente] = await sql`
    select id, nome from clientes where id = ${req.params.id} and barbeiro_id = ${req.barbeiroId}
  `;
  if (!cliente) return res.status(404).json({ erro: "Cliente não encontrado." });

  const servico = (req.body?.servico || "").trim();
  if (!servico) return res.status(400).json({ erro: "Informe o serviço realizado." });

  const [visita] = await sql`
    insert into visitas (barbeiro_id, cliente_id, cliente_nome, servico, profissional, valor, origem)
    values (${req.barbeiroId}, ${cliente.id}, ${cliente.nome}, ${servico},
            ${req.body?.profissional || ""}, ${Number(req.body?.valor) || 0}, 'manual')
    returning id, to_char(data, 'YYYY-MM-DD') as data, servico, profissional, valor::float8
  `;
  res.status(201).json(visita);
});

router.delete("/:id/visitas/:visitaId", async (req, res) => {
  const apagadas = await sql`
    delete from visitas
    where id = ${req.params.visitaId}
      and cliente_id = ${req.params.id}
      and barbeiro_id = ${req.barbeiroId}
    returning id
  `;
  if (!apagadas.length) return res.status(404).json({ erro: "Visita não encontrada." });
  res.json({ ok: true });
});

export default router;
