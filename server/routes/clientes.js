import { Router } from "express";
import { sql } from "../db.js";
import { resolverServico, resolverEquipe, inserirVisita } from "../snapshots.js";
import { gerarCodigoAcesso } from "../codigoAcesso.js";

const router = Router();
const TIPOS = ["assinante", "avulso"];

// Contadores (visitas, total gasto, última visita) não são colunas: saem de
// agregação sobre `visitas`. Assim nunca ficam dessincronizados do caixa.
//
// `codigo_acesso` sai daqui de propósito: é o barbeiro quem dita o código ao
// cliente, então ele precisa vê-lo na ficha. Só o dono da barbearia chega a
// esta rota (exigirLogin), e o filtro por barbeiro_id impede ler o código de
// cliente de outra conta.
const listar = (barbeiroId) => sql`
  select c.id, c.nome, c.telefone, c.tipo, c.obs, c.equipe_pref, c.codigo_acesso,
         e.nome                                as equipe_pref_nome,
         count(v.id)::int                      as visitas,
         coalesce(sum(v.valor), 0)::float8     as total_gasto,
         to_char(max(v.data), 'YYYY-MM-DD')    as ultima_visita
  from clientes c
  left join visitas v on v.cliente_id = c.id
  left join equipe  e on e.id = c.equipe_pref
  where c.barbeiro_id = ${barbeiroId}
  group by c.id, e.nome
  order by c.nome
`;

router.get("/", async (req, res) => {
  res.json(await listar(req.barbeiroId));
});

router.post("/", async (req, res) => {
  const nome = (req.body?.nome || "").trim();
  const tipo = req.body?.tipo || "avulso";
  if (!nome) return res.status(400).json({ erro: "Informe o nome do cliente." });
  if (!TIPOS.includes(tipo)) return res.status(400).json({ erro: "Tipo de cliente inválido." });

  const pref = await resolverEquipe(req.barbeiroId, req.body?.equipe_pref);

  // A ficha já nasce com o código que o cliente vai usar na área pública.
  const [cliente] = await sql`
    insert into clientes (barbeiro_id, nome, telefone, tipo, obs, equipe_pref, codigo_acesso)
    values (${req.barbeiroId}, ${nome}, ${(req.body?.telefone || "").trim()}, ${tipo},
            ${req.body?.obs || ""}, ${pref?.id ?? null}, ${gerarCodigoAcesso()})
    returning id, nome, telefone, tipo, obs, equipe_pref, codigo_acesso
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

  // equipe_pref só muda se veio no corpo; e só aceita barbeiro desta barbearia.
  let pref = atual.equipe_pref;
  if ("equipe_pref" in (req.body || {})) {
    pref = (await resolverEquipe(req.barbeiroId, req.body.equipe_pref))?.id ?? null;
  }

  const [cliente] = await sql`
    update clientes set
      nome        = ${req.body?.nome ?? atual.nome},
      telefone    = ${req.body?.telefone ?? atual.telefone},
      tipo        = ${tipo},
      obs         = ${req.body?.obs ?? atual.obs},
      equipe_pref = ${pref}
    where id = ${req.params.id} and barbeiro_id = ${req.barbeiroId}
    returning id, nome, telefone, tipo, obs, equipe_pref, codigo_acesso
  `;
  res.json(cliente);
});

// Gera um código novo. Serve para quando o cliente perde o código, ou quando
// ele foi visto por quem não devia — trocar custa nada e derruba o antigo na
// hora, porque o login público confere o valor atual da ficha.
router.post("/:id/codigo", async (req, res) => {
  const [cliente] = await sql`
    update clientes set codigo_acesso = ${gerarCodigoAcesso()}
    where id = ${req.params.id} and barbeiro_id = ${req.barbeiroId}
    returning id, codigo_acesso
  `;
  if (!cliente) return res.status(404).json({ erro: "Cliente não encontrado." });
  res.json(cliente);
});

router.delete("/:id", async (req, res) => {
  // As visitas sobrevivem (cliente_id vira null, cliente_nome permanece): o
  // cliente sai do cadastro, o faturamento que ele gerou fica no caixa.
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
    select v.id, to_char(v.data, 'YYYY-MM-DD') as data, v.servico_nome, v.equipe_nome,
           v.valor::float8, v.comissao_pct::float8, v.origem
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

  const servico = await resolverServico(req.barbeiroId, req.body?.servico_id);
  if (!servico) return res.status(400).json({ erro: "Selecione um serviço do catálogo." });

  const equipe = await resolverEquipe(req.barbeiroId, req.body?.equipe_id);

  await inserirVisita({
    barbeiroId: req.barbeiroId,
    cliente, servico, equipe,
    valor: req.body?.valor !== undefined ? Number(req.body.valor) : undefined,
    comissaoPct: undefined,
    origem: "manual",
  });

  res.status(201).json({ ok: true });
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
