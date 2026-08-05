import { Router } from "express";
import { sql } from "../db.js";

const router = Router();

const ESFERA_HORARIOS = [
  "08:00", "09:00", "10:00", "11:00",
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
];

const limpaTelefone = (t) => String(t || "").replace(/\D/g, "");

const eUUID = (str) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str || ""));

const resumoBarbearia = (b) => ({
  id: b.id,
  nome: b.barbearia || "Barbearia",
  dono: b.nome || "Proprietário",
  telefone: b.whatsapp || "",
  whatsapp: b.whatsapp || "",
  endereco: "Rua Principal, 100",
  bairro: "Centro",
  cidade: "São Paulo - SP",
  nota: Number(b.nota || 4.9),
  avaliacoesCount: Number(b.avaliacoes_count || 12),
  capa: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop&q=80",
  logo: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=200&auto=format&fit=crop&q=80",
  sobre: "Barbearia de alto padrão com atendimento personalizado e profissionais experientes.",
  comodidades: ["wifi", "cafe", "cartao", "ar"],
  expediente: [
    ["Segunda", "08:00–19:00"], ["Terça", "08:00–19:00"], ["Quarta", "08:00–19:00"],
    ["Quinta", "08:00–19:00"], ["Sexta", "08:00–19:00"], ["Sábado", "08:00–19:00"], ["Domingo", "Fechado"],
  ],
});

// 1. POST /api/publico/identificar
router.post("/identificar", async (req, res) => {
  const telLimpo = limpaTelefone(req.body?.telefone);
  const nome = (req.body?.nome || "").trim();

  if (telLimpo.length < 10) {
    return res.status(400).json({ erro: "Informe um número de WhatsApp válido (DDD + número)." });
  }

  // Busca cliente em qualquer barbearia por telefone
  const [encontrado] = await sql`
    select id, nome, telefone, tipo
    from clientes
    where regexp_replace(telefone, '\D', '', 'g') = ${telLimpo}
    order by criado_em desc
    limit 1
  `;

  if (encontrado) {
    return res.json(encontrado);
  }

  if (!nome) {
    return res.status(404).json({
      erro: "Seu telefone ainda não está cadastrado. Como gostaria de ser chamado?",
      precisaNome: true,
    });
  }

  const [primeiraBarbearia] = await sql`select id from barbeiros order by criado_em limit 1`;
  if (!primeiraBarbearia) {
    return res.status(500).json({ erro: "Nenhuma barbearia cadastrada no sistema." });
  }

  const [novo] = await sql`
    insert into clientes (barbeiro_id, nome, telefone, tipo)
    values (${primeiraBarbearia.id}, ${nome}, ${req.body.telefone}, 'avulso')
    returning id, nome, telefone, tipo
  `;

  res.status(201).json(novo);
});

// 2. GET /api/publico/barbearias
router.get("/barbearias", async (req, res) => {
  const termo = (req.query.termo || "").trim().toLowerCase();
  const barbeiros = await sql`
    select b.id, b.nome, b.barbearia, b.whatsapp,
           coalesce(avg(a.nota), 4.9)::float8 as nota,
           count(a.id)::int as avaliacoes_count
    from barbeiros b
    left join avaliacoes a on a.barbeiro_id = b.id
    group by b.id
    order by b.barbearia
  `;

  let resultado = barbeiros.map(resumoBarbearia);
  if (termo) {
    resultado = resultado.filter(b =>
      b.nome.toLowerCase().includes(termo) ||
      b.dono.toLowerCase().includes(termo) ||
      b.cidade.toLowerCase().includes(termo)
    );
  }

  res.json(resultado);
});

// 3. GET /api/publico/barbearias/:id
router.get("/barbearias/:id", async (req, res) => {
  if (!eUUID(req.params.id)) return res.status(404).json({ erro: "Barbearia não encontrada." });

  const [b] = await sql`
    select b.id, b.nome, b.barbearia, b.whatsapp,
           coalesce(avg(a.nota), 4.9)::float8 as nota,
           count(a.id)::int as avaliacoes_count
    from barbeiros b
    left join avaliacoes a on a.barbeiro_id = b.id
    where b.id = ${req.params.id}
    group by b.id
  `;
  if (!b) return res.status(404).json({ erro: "Barbearia não encontrada." });

  const [servicos, equipe] = await Promise.all([
    sql`select id, nome, preco::float8 as preco, duracao_min as duracao from servicos where barbeiro_id = ${b.id} and ativo = true order by nome`,
    sql`select id, nome, 'Barbeiro' as cargo, 5.0 as nota from equipe where barbeiro_id = ${b.id} and ativo = true order by nome`,
  ]);

  const resumo = resumoBarbearia(b);
  res.json({
    ...resumo,
    servicos,
    barbeiros: equipe.length ? equipe : [{ id: b.id, nome: b.nome, cargo: "Proprietário", nota: 5.0 }],
  });
});

// 4. GET /api/publico/barbearias/:barbeariaId/horarios
router.get("/barbearias/:barbeariaId/horarios", async (req, res) => {
  const { data, profissional } = req.query;
  if (!eUUID(req.params.barbeariaId)) return res.status(400).json({ erro: "Barbearia inválida." });
  if (!data) return res.status(400).json({ erro: "Informe a data." });

  let sqlEquipe = sql``;
  if (profissional && profissional !== "Qualquer") {
    if (eUUID(profissional)) {
      sqlEquipe = sql`and equipe_id = ${profissional}`;
    } else {
      sqlEquipe = sql`and equipe_nome = ${profissional}`;
    }
  }

  const agendados = await sql`
    select to_char(hora_inicio, 'HH24:MI') as hora
    from agendamentos
    where barbeiro_id = ${req.params.barbeariaId}
      and data = ${data}
      and status <> 'Cancelado'
      ${sqlEquipe}
  `;

  const ocupados = new Set(agendados.map(a => a.hora));
  const slots = ESFERA_HORARIOS.map(h => ({
    hora: h,
    livre: !ocupados.has(h),
  }));

  res.json(slots);
});

// 5. POST /api/publico/agendar
router.post("/agendar", async (req, res) => {
  const { cliente_id, barbearia_id, servico, profissional, data, hora } = req.body || {};
  if (!eUUID(barbearia_id)) return res.status(400).json({ erro: "Selecione a barbearia." });
  if (!eUUID(cliente_id)) return res.status(400).json({ erro: "Sessão do cliente inválida." });
  if (!data || !hora) return res.status(400).json({ erro: "Selecione data e horário." });

  const [cliente] = await sql`select id, nome from clientes where id = ${cliente_id}`;
  if (!cliente) return res.status(404).json({ erro: "Cliente não encontrado." });

  let [svc] = await sql`
    select id, nome, duracao_min, preco::float8, comissao_pct::float8
    from servicos
    where (id::text = ${String(servico)} or lower(nome) = ${String(servico || "").toLowerCase()})
      and barbeiro_id = ${barbearia_id}
    limit 1
  `;

  if (!svc) {
    const [pSvc] = await sql`
      select id, nome, duracao_min, preco::float8, comissao_pct::float8
      from servicos
      where barbeiro_id = ${barbearia_id} and ativo = true
      limit 1
    `;
    svc = pSvc;
  }
  if (!svc) return res.status(400).json({ erro: "Esta barbearia não possui serviços ativos cadastrados." });

  let eqId = null;
  let eqNome = String(profissional || "Qualquer");

  const [eq] = await sql`
    select id, nome
    from equipe
    where (id::text = ${String(profissional)} or lower(nome) = ${String(profissional || "").toLowerCase()})
      and barbeiro_id = ${barbearia_id}
    limit 1
  `;

  if (eq) {
    eqId = eq.id;
    eqNome = eq.nome;
  } else {
    const [pEq] = await sql`
      select id, nome
      from equipe
      where barbeiro_id = ${barbearia_id} and ativo = true
      limit 1
    `;
    if (pEq) {
      eqId = pEq.id;
      eqNome = pEq.nome;
    }
  }

  try {
    const [novo] = await sql`
      insert into agendamentos (
        barbeiro_id, cliente_id, cliente_nome, servico_id, servico_nome,
        equipe_id, equipe_nome, data, hora_inicio, duracao_min, valor, comissao_pct
      ) values (
        ${barbearia_id}, ${cliente.id}, ${cliente.nome},
        ${svc.id}, ${svc.nome}, ${eqId}, ${eqNome},
        ${data}, ${hora}, ${svc.duracao_min}, ${svc.preco}, ${svc.comissao_pct}
      )
      returning id, cliente_id, cliente_nome, servico_nome as servico, equipe_nome as profissional,
                to_char(data, 'YYYY-MM-DD') as data, to_char(hora_inicio, 'HH24:MI') as hora,
                valor::float8, status
    `;

    const [b] = await sql`select id, nome, barbearia, whatsapp from barbeiros where id = ${barbearia_id}`;
    res.status(201).json({
      ...novo,
      barbearia: b ? resumoBarbearia(b) : null,
    });
  } catch (e) {
    if (e.message?.includes("agendamentos_sem_sobreposicao")) {
      return res.status(409).json({ erro: "Este horário já foi preenchido por outro cliente." });
    }
    throw e;
  }
});

// 6. GET /api/publico/clientes/:clienteId/inicio
router.get("/clientes/:clienteId/inicio", async (req, res) => {
  if (!eUUID(req.params.clienteId)) return res.json({ favoritas: [], acessos: [], proximo: null });

  const [favs, [proximo]] = await Promise.all([
    sql`
      select b.id, b.nome, b.barbearia, b.whatsapp
      from favoritos f
      join barbeiros b on b.id = f.barbeiro_id
      where f.cliente_id = ${req.params.clienteId}
    `,
    sql`
      select a.id, a.cliente_id, a.cliente_nome,
             to_char(a.data, 'YYYY-MM-DD') as data,
             to_char(a.hora_inicio, 'HH24:MI') as hora,
             a.servico_nome as servico, a.equipe_nome as profissional,
             a.valor::float8 as valor, a.status,
             b.id as barbearia_id, b.barbearia, b.nome as dono, b.whatsapp
      from agendamentos a
      join barbeiros b on b.id = a.barbeiro_id
      where a.cliente_id = ${req.params.clienteId}
        and a.status = 'Confirmado'
        and a.data >= (now() at time zone 'America/Sao_Paulo')::date
      order by a.data, a.hora_inicio
      limit 1
    `,
  ]);

  res.json({
    favoritas: favs.map(resumoBarbearia),
    acessos: [],
    proximo: proximo ? { ...proximo, barbearia: resumoBarbearia({ id: proximo.barbearia_id, barbearia: proximo.barbearia, nome: proximo.dono, whatsapp: proximo.whatsapp }) } : null,
  });
});

// 7. GET /api/publico/clientes/:clienteId/horarios
router.get("/clientes/:clienteId/horarios", async (req, res) => {
  const { clienteId } = req.params;
  const barbeariaId = req.query.barbearia;
  if (!eUUID(clienteId)) {
    return res.json({ proximos: [], passados: [], historico: [], resumo: { visitas: 0, totalGasto: 0, favorito: null, tipo: "avulso" } });
  }

  let filtroB = sql``;
  if (eUUID(barbeariaId)) {
    filtroB = sql`and a.barbeiro_id = ${barbeariaId}`;
  }

  const [cliente] = await sql`select tipo from clientes where id = ${clienteId}`;

  const agendamentos = await sql`
    select a.id, a.cliente_id, a.cliente_nome,
           to_char(a.data, 'YYYY-MM-DD') as data,
           to_char(a.hora_inicio, 'HH24:MI') as hora,
           a.servico_nome as servico, a.equipe_nome as profissional,
           a.valor::float8 as valor, a.status,
           b.id as barbearia_id, b.barbearia, b.nome as dono, b.whatsapp
    from agendamentos a
    join barbeiros b on b.id = a.barbeiro_id
    where a.cliente_id = ${clienteId} ${filtroB}
    order by a.data desc, a.hora_inicio desc
  `;

  const hoje = new Date().toISOString().slice(0, 10);
  const comLoja = (a) => ({
    ...a,
    barbearia: resumoBarbearia({ id: a.barbearia_id, barbearia: a.barbearia, nome: a.dono, whatsapp: a.whatsapp }),
  });

  const proximos = agendamentos
    .filter(a => a.status === "Confirmado" && a.data >= hoje)
    .map(comLoja);

  const passados = agendamentos
    .filter(a => a.status !== "Confirmado" || a.data < hoje)
    .map(comLoja);

  let filtroV = sql``;
  if (eUUID(barbeariaId)) filtroV = sql`and v.barbeiro_id = ${barbeariaId}`;

  const visitas = await sql`
    select v.id, v.cliente_id, v.cliente_nome,
           to_char(v.data, 'YYYY-MM-DD') as data,
           v.servico_nome as servico, v.equipe_nome as profissional,
           v.valor::float8 as valor,
           b.id as barbearia_id, b.barbearia, b.nome as dono, b.whatsapp
    from visitas v
    join barbeiros b on b.id = v.barbeiro_id
    where v.cliente_id = ${clienteId} ${filtroV}
    order by v.data desc, v.criado_em desc
    limit 20
  `;

  const historico = visitas.map(comLoja);

  const porProf = {};
  visitas.forEach(v => { if (v.profissional) porProf[v.profissional] = (porProf[v.profissional] || 0) + 1; });
  const favorito = Object.entries(porProf).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const totalGasto = visitas.reduce((sum, v) => sum + (v.valor || 0), 0);

  res.json({
    proximos,
    passados,
    historico,
    resumo: {
      visitas: visitas.length,
      totalGasto,
      favorito,
      tipo: cliente?.tipo || "avulso",
    },
  });
});

// 8. POST /api/publico/clientes/:clienteId/horarios/:id/cancelar
router.post("/clientes/:clienteId/horarios/:id/cancelar", async (req, res) => {
  const { clienteId, id } = req.params;
  if (!eUUID(clienteId) || !eUUID(id)) return res.status(404).json({ erro: "Agendamento não encontrado." });

  const [alterado] = await sql`
    update agendamentos set status = 'Cancelado'
    where id = ${id} and cliente_id = ${clienteId} and status = 'Confirmado'
    returning id
  `;
  if (!alterado) return res.status(404).json({ erro: "Agendamento não encontrado ou já alterado." });

  res.json({ ok: true });
});

// 9. GET /api/publico/clientes/:clienteId/fidelidade/:barbeariaId
router.get("/clientes/:clienteId/fidelidade/:barbeariaId", async (req, res) => {
  const { clienteId, barbeariaId } = req.params;
  if (!eUUID(clienteId) || !eUUID(barbeariaId)) {
    return res.json({ pontos: 0, visitas: 0, premios: [] });
  }

  const [resumo] = await sql`
    select count(*)::int as qtd, coalesce(sum(valor), 0)::float8 as total
    from visitas
    where cliente_id = ${clienteId} and barbeiro_id = ${barbeariaId}
  `;

  const pontos = Math.round(resumo?.total || 0);
  const premios = [
    { nome: "Pezinho grátis", custo: 300 },
    { nome: "Barba completa grátis", custo: 700 },
    { nome: "Corte + Barba grátis", custo: 1500 },
  ].map(p => ({ ...p, liberado: pontos >= p.custo }));

  res.json({
    pontos,
    visitas: resumo?.qtd || 0,
    premios,
  });
});

// 10. POST /api/publico/clientes/:clienteId/favoritos/:barbeariaId
router.post("/clientes/:clienteId/favoritos/:barbeariaId", async (req, res) => {
  const { clienteId, barbeariaId } = req.params;
  if (!eUUID(clienteId) || !eUUID(barbeariaId)) return res.status(400).json({ erro: "ID inválido." });

  const [existe] = await sql`
    select id from favoritos where cliente_id = ${clienteId} and barbeiro_id = ${barbeariaId}
  `;
  if (existe) {
    await sql`delete from favoritos where id = ${existe.id}`;
  } else {
    await sql`insert into favoritos (cliente_id, barbeiro_id) values (${clienteId}, ${barbeariaId})`;
  }

  res.json({ ok: true });
});

// 11. POST /api/publico/clientes/:clienteId/avaliacoes/:barbeariaId
router.post("/clientes/:clienteId/avaliacoes/:barbeariaId", async (req, res) => {
  const { clienteId, barbeariaId } = req.params;
  const nota = Number(req.body?.nota);
  const texto = (req.body?.texto || "").trim();

  if (!eUUID(clienteId) || !eUUID(barbeariaId)) return res.status(400).json({ erro: "ID inválido." });
  if (!nota || nota < 1 || nota > 5) return res.status(400).json({ erro: "Escolha de 1 a 5 estrelas." });

  await sql`
    insert into avaliacoes (cliente_id, barbeiro_id, nota, texto)
    values (${clienteId}, ${barbeariaId}, ${nota}, ${texto})
  `;

  res.json({ ok: true });
});

export default router;
