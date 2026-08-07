import { Router } from "express";
import { sql } from "../db.js";
import { criarSessaoCliente, encerrarSessaoCliente, exigirCliente } from "../auth.js";
import { normalizarCodigo } from "../codigoAcesso.js";

const router = Router();

const ESFERA_HORARIOS = [
  "08:00", "09:00", "10:00", "11:00",
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
];

const limpaTelefone = (t) => String(t || "").replace(/\D/g, "");

const eUUID = (str) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str || ""));

// `contato` decide se o telefone do dono entra na resposta.
//
// Na ficha de UMA barbearia ele é informação de negócio: quem abriu a página
// quer ligar. Já na LISTA, devolver o telefone de todas as barbearias entrega,
// numa requisição sem autenticação, a agenda inteira de donos do sistema —
// pronta para spam. Lista sai sem contato; ficha sai com.
const resumoBarbearia = (b, { contato = false } = {}) => ({
  id: b.id,
  nome: b.barbearia || "Barbearia",
  dono: b.nome || "Proprietário",
  telefone: contato ? b.whatsapp || "" : "",
  whatsapp: contato ? b.whatsapp || "" : "",
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
//
// Entrada da área do cliente. Exige telefone E código de acesso — o código é
// gerado quando o barbeiro cadastra a ficha e entregue pessoalmente.
//
// Por que código, e não só telefone: sem canal de verificação (o projeto não
// tem integração de WhatsApp/SMS), o telefone não prova nada. Qualquer um que
// soubesse o número de um cliente veria o histórico dele, os valores gastos e
// poderia cancelar os agendamentos. O código é a prova de posse possível hoje —
// acontece no balcão, entre barbeiro e cliente.
//
// Esta rota também NÃO cria cadastro. Quem cadastra é o barbeiro, no painel.
// Antes, o auto-cadastro jogava todo cliente novo na PRIMEIRA barbearia do
// banco, independentemente de onde ele estava agendando — misturava a base de
// clientes entre contas diferentes.
router.post("/identificar", async (req, res) => {
  const telLimpo = limpaTelefone(req.body?.telefone);
  const codigo = normalizarCodigo(req.body?.codigo);

  if (telLimpo.length < 10) {
    return res.status(400).json({ erro: "Informe um número de WhatsApp válido (DDD + número)." });
  }
  if (!codigo) {
    return res.status(400).json({ erro: "Informe o código de acesso que a barbearia te passou." });
  }

  // `\\D` e não `\D`: num template literal do JS, `\D` é escape desconhecido e
  // a barra some — o SQL chegava como regexp_replace(telefone, 'D', ...), que
  // remove a letra D em vez dos não-dígitos, e o telefone nunca casava. A dupla
  // barra faz chegar `\D` no Postgres, igual ao índice clientes_acesso_idx
  // (que vive num .sql e por isso não passa por esse escape).
  const [cliente] = await sql`
    select id, nome, tipo
    from clientes
    where regexp_replace(telefone, '\\D', '', 'g') = ${telLimpo}
      and codigo_acesso = ${codigo}
    limit 1
  `;

  // Uma mensagem só para telefone desconhecido e código errado: separar as duas
  // transformaria a rota num verificador de "este número está cadastrado?".
  if (!cliente) {
    return res.status(401).json({
      erro: "Telefone ou código incorretos. Peça o código na sua barbearia.",
    });
  }

  criarSessaoCliente(res, cliente.id);
  res.json(cliente);
});

// 1b. POST /api/publico/sair
router.post("/sair", (req, res) => {
  encerrarSessaoCliente(res);
  res.json({ ok: true });
});

// 1c. GET /api/publico/eu — quem está na sessão (o front usa para retomar).
router.get("/eu", exigirCliente, (req, res) => {
  res.json({ id: req.cliente.id, nome: req.cliente.nome, tipo: req.cliente.tipo });
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

  let resultado = barbeiros.map(b => resumoBarbearia(b));
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

  // Ficha de uma barbearia só: aqui o telefone é o contato que o cliente veio buscar.
  const resumo = resumoBarbearia(b, { contato: true });
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
//
// `cliente_id` não vem mais do corpo: vem do cookie de sessão. Antes, mandar o
// id de outra pessoa criava agendamento no nome dela.
router.post("/agendar", exigirCliente, async (req, res) => {
  const { barbearia_id, servico, profissional, data, hora } = req.body || {};
  if (!eUUID(barbearia_id)) return res.status(400).json({ erro: "Selecione a barbearia." });
  if (!data || !hora) return res.status(400).json({ erro: "Selecione data e horário." });

  const cliente = req.cliente;

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
      barbearia: b ? resumoBarbearia(b, { contato: true }) : null,
    });
  } catch (e) {
    if (e.message?.includes("agendamentos_sem_sobreposicao")) {
      return res.status(409).json({ erro: "Este horário já foi preenchido por outro cliente." });
    }
    throw e;
  }
});

// ── Área do cliente autenticado ───────────────────────────────────────────────
//
// Daqui para baixo o id do cliente vem SEMPRE de `exigirCliente`, ou seja do
// cookie assinado. As rotas antigas traziam o id na URL
// (`/clientes/:clienteId/...`) e o servidor acreditava nele: com um id em mãos
// dava para ler o histórico e os gastos de qualquer pessoa, e cancelar os
// agendamentos dela. O `/eu/` no caminho é literal — só existe "eu".

// 6. GET /api/publico/eu/inicio
router.get("/eu/inicio", exigirCliente, async (req, res) => {
  const clienteId = req.clienteId;

  const [favs, [proximo]] = await Promise.all([
    sql`
      select b.id, b.nome, b.barbearia, b.whatsapp
      from favoritos f
      join barbeiros b on b.id = f.barbeiro_id
      where f.cliente_id = ${clienteId}
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
      where a.cliente_id = ${clienteId}
        and a.status = 'Confirmado'
        and a.data >= (now() at time zone 'America/Sao_Paulo')::date
      order by a.data, a.hora_inicio
      limit 1
    `,
  ]);

  res.json({
    favoritas: favs.map(b => resumoBarbearia(b, { contato: true })),
    acessos: [],
    proximo: proximo ? { ...proximo, barbearia: resumoBarbearia({ id: proximo.barbearia_id, barbearia: proximo.barbearia, nome: proximo.dono, whatsapp: proximo.whatsapp }, { contato: true }) } : null,
  });
});

// 7. GET /api/publico/eu/horarios
router.get("/eu/horarios", exigirCliente, async (req, res) => {
  const clienteId = req.clienteId;
  const barbeariaId = req.query.barbearia;

  let filtroB = sql``;
  if (eUUID(barbeariaId)) {
    filtroB = sql`and a.barbeiro_id = ${barbeariaId}`;
  }

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
    barbearia: resumoBarbearia({ id: a.barbearia_id, barbearia: a.barbearia, nome: a.dono, whatsapp: a.whatsapp }, { contato: true }),
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
      tipo: req.cliente.tipo || "avulso",
    },
  });
});

// 8. POST /api/publico/eu/horarios/:id/cancelar
router.post("/eu/horarios/:id/cancelar", exigirCliente, async (req, res) => {
  const { id } = req.params;
  if (!eUUID(id)) return res.status(404).json({ erro: "Agendamento não encontrado." });

  // O `cliente_id` da cláusula continua sendo a trava: só cancela o que é seu.
  const [alterado] = await sql`
    update agendamentos set status = 'Cancelado'
    where id = ${id} and cliente_id = ${req.clienteId} and status = 'Confirmado'
    returning id
  `;
  if (!alterado) return res.status(404).json({ erro: "Agendamento não encontrado ou já alterado." });

  res.json({ ok: true });
});

// 9. GET /api/publico/eu/fidelidade/:barbeariaId
router.get("/eu/fidelidade/:barbeariaId", exigirCliente, async (req, res) => {
  const { barbeariaId } = req.params;
  if (!eUUID(barbeariaId)) {
    return res.json({ pontos: 0, visitas: 0, premios: [] });
  }

  const [resumo] = await sql`
    select count(*)::int as qtd, coalesce(sum(valor), 0)::float8 as total
    from visitas
    where cliente_id = ${req.clienteId} and barbeiro_id = ${barbeariaId}
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

// 10. POST /api/publico/eu/favoritos/:barbeariaId
router.post("/eu/favoritos/:barbeariaId", exigirCliente, async (req, res) => {
  const { barbeariaId } = req.params;
  if (!eUUID(barbeariaId)) return res.status(400).json({ erro: "ID inválido." });

  const [existe] = await sql`
    select id from favoritos where cliente_id = ${req.clienteId} and barbeiro_id = ${barbeariaId}
  `;
  if (existe) {
    await sql`delete from favoritos where id = ${existe.id}`;
  } else {
    await sql`insert into favoritos (cliente_id, barbeiro_id) values (${req.clienteId}, ${barbeariaId})`;
  }

  // O front espera o estado novo para pintar o coração (Estabelecimento.jsx).
  res.json({ ok: true, favorito: !existe });
});

// 11. POST /api/publico/eu/avaliacoes/:barbeariaId
//
// Duas travas que não existiam:
//
//   1. Só avalia quem foi atendido. Antes, qualquer sessão avaliava qualquer
//      barbearia — inclusive uma onde nunca pôs os pés.
//   2. Uma avaliação por barbearia, garantida pelo índice único
//      `avaliacoes_cliente_barbeiro_uk`. Antes dava para inserir em laço e
//      mover sozinho a média pública da barbearia.
//
// Reavaliar agora substitui a nota anterior em vez de somar mais uma.
router.post("/eu/avaliacoes/:barbeariaId", exigirCliente, async (req, res) => {
  const { barbeariaId } = req.params;
  const nota = Number(req.body?.nota);
  const texto = (req.body?.texto || "").trim();

  if (!eUUID(barbeariaId)) return res.status(400).json({ erro: "ID inválido." });
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
    return res.status(400).json({ erro: "Escolha de 1 a 5 estrelas." });
  }

  const [visita] = await sql`
    select id from visitas
    where cliente_id = ${req.clienteId} and barbeiro_id = ${barbeariaId}
    limit 1
  `;
  if (!visita) {
    return res.status(403).json({ erro: "Só é possível avaliar uma barbearia onde você já foi atendido." });
  }

  await sql`
    insert into avaliacoes (cliente_id, barbeiro_id, nota, texto)
    values (${req.clienteId}, ${barbeariaId}, ${nota}, ${texto})
    on conflict (cliente_id, barbeiro_id)
    do update set nota = excluded.nota, texto = excluded.texto, criado_em = now()
  `;

  res.json({ ok: true });
});

export default router;
