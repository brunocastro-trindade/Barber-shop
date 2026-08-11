// Isolamento entre contas: prova que uma conta não alcança dados de outra em
// NENHUMA rota autenticada.
//
//   npm run dev        (noutro terminal, a API precisa estar no ar)
//   npm run isolamento
//
// Por que este teste existe, e por que ele cobre rota por rota:
//
// O que separa uma barbearia da outra é o filtro `barbeiro_id`, tirado do
// cookie assinado. Em `server/crud.js` ele está escrito uma vez só e nenhuma
// rota consegue esquecê-lo; nas rotas escritas à mão (clientes, agenda, fila,
// visitas, assinaturas, dashboard, equipe, unidades) ele é repetido em cada
// consulta — e é aí que uma distração vaza a base inteira.
//
// Este projeto já teve exatamente esse bug: a área do cliente aceitava um id na
// URL e devolvia o histórico de qualquer pessoa. Foi corrigido, mas a classe de
// erro continua possível a cada rota nova.
//
// A alternativa seria RLS no banco. Foi avaliada e descartada por ora: o driver
// HTTP não mantém sessão entre consultas, então a política precisaria que TODA
// consulta rodasse dentro de transação com a variável do inquilino — e RLS não
// protegeria contra a credencial da aplicação vazar, porque quem a rouba define
// a variável sozinho. Ver o checklist em CONTEXT.md.
import { neon } from "@neondatabase/serverless";

const BASE = `http://localhost:${process.env.PORT || 3001}/api`;
const sql = neon(process.env.DATABASE_URL);

let falhas = 0;
const ok = (cond, texto, extra) => {
  console.log(`${cond ? "  ok  " : " VAZOU"} ${texto}${!cond && extra !== undefined ? ` → ${JSON.stringify(extra).slice(0, 160)}` : ""}`);
  if (!cond) falhas++;
};

const criar = async (marca) => {
  const email = `iso-${marca}-${Date.now()}@teste.local`;
  const r = await fetch(BASE + "/auth/register", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome: `Dono ${marca}`, barbearia: `Barbearia ${marca}`,
      whatsapp: "(11) 90000-0000", email, senha: "segredo123456",
    }),
  });
  if (r.status !== 201) throw new Error(`não criou a conta ${marca}: ${r.status} ${await r.text()}`);
  const cookie = (r.headers.getSetCookie?.() || []).map(c => c.split(";")[0]).join("; ");
  return { id: (await r.json()).id, cookie };
};

const cliente = (cookie) => async (metodo, caminho, corpo) => {
  const r = await fetch(BASE + caminho, {
    method: metodo,
    headers: { ...(corpo === undefined ? {} : { "Content-Type": "application/json" }), cookie },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const t = await r.text();
  let dados; try { dados = t ? JSON.parse(t) : null; } catch { dados = t; }
  return { status: r.status, dados };
};

let A, B;
try {
  await sql`delete from limites_uso where chave like 'ip:%'`;
  A = await criar("A");
  B = await criar("B");
  const comoA = cliente(A.cookie);
  const comoB = cliente(B.cookie);

  // ── B monta a barbearia dele, com um registro de cada coisa ────────────────
  console.log("\n── Conta B cria dados em todas as entidades ──────────────");
  const hoje = new Date().toISOString().slice(0, 10);
  const uniB = (await comoB("GET", "/unidades")).dados.unidades[0];
  const eqB = (await comoB("POST", "/equipe", { nome: "Barbeiro do B", ativo: true })).dados;
  const svcB = (await comoB("POST", "/servicos", { nome: "Corte do B", duracao_min: 30, preco: 50, comissao_pct: 40, ativo: true })).dados;
  const cliB = (await comoB("POST", "/clientes", { nome: "Cliente do B", telefone: "(11) 98888-1111", tipo: "avulso" })).dados;
  const prodB = (await comoB("POST", "/produtos", { nome: "Produto do B", preco: 20, quantidade: 5, minimo: 1 })).dados;
  const despB = (await comoB("POST", "/despesas", { descricao: "Despesa do B", valor: 100, status: "Pendente" })).dados;
  const planoB = (await comoB("POST", "/planos", { nome: "Plano do B", preco: 90, incluidos: ["Corte"], ativo: true })).dados;
  const assB = (await comoB("POST", "/assinaturas", { cliente_id: cliB.id, plano_id: planoB.id })).dados;
  const agB = (await comoB("POST", "/agendamentos", {
    cliente_id: cliB.id, data: hoje, hora_inicio: "16:00", servico_id: svcB.id, equipe_id: eqB.id,
  })).dados;
  const filaB = (await comoB("POST", "/fila", { nome: "Fila do B", servico_id: svcB.id, tipo: "avulso" })).dados;
  await comoB("POST", `/clientes/${cliB.id}/visitas`, { servico_id: svcB.id, equipe_id: eqB.id });
  const visB = (await comoB("GET", "/visitas")).dados?.[0];
  const uniB2 = (await comoB("POST", "/unidades", { nome: "Unidade 2 do B" })).dados;

  const criados = { uniB, eqB, svcB, cliB, prodB, despB, planoB, assB, agB, filaB, visB, uniB2 };
  const faltando = Object.entries(criados).filter(([, v]) => !v?.id).map(([k]) => k);
  ok(faltando.length === 0, "B criou um registro de cada entidade", faltando);

  // ── A não pode VER nada de B em nenhuma listagem ───────────────────────────
  console.log("\n── A lista tudo: nada de B pode aparecer ────────────────");
  const listas = [
    ["/clientes", "Cliente do B"],
    ["/equipe", "Barbeiro do B"],
    ["/servicos", "Corte do B"],
    ["/produtos", "Produto do B"],
    ["/despesas", "Despesa do B"],
    ["/planos", "Plano do B"],
    ["/assinaturas", "Cliente do B"],
    ["/fila", "Fila do B"],
    ["/visitas", "Cliente do B"],
    [`/agendamentos?inicio=${hoje}&fim=${hoje}`, "Cliente do B"],
    ["/unidades", "Unidade 2 do B"],
  ];
  for (const [rota, marcaDeB] of listas) {
    const r = await comoA("GET", rota);
    const texto = JSON.stringify(r.dados ?? "");
    ok(r.status === 200 && !texto.includes(marcaDeB), `GET ${rota.split("?")[0]}`, r.dados);
  }

  const dash = await comoA("GET", "/dashboard");
  ok(dash.status === 200 && !JSON.stringify(dash.dados).includes("do B"), "GET /dashboard", dash.dados);
  const resumo = await comoA("GET", "/visitas/resumo");
  ok(resumo.status === 200 && !JSON.stringify(resumo.dados).includes("do B"), "GET /visitas/resumo", resumo.dados);

  // ── A não pode LER pelo id direto ──────────────────────────────────────────
  console.log("\n── A tenta ler pelo id de B ─────────────────────────────");
  const leitura = await comoA("GET", `/clientes/${cliB.id}/visitas`);
  ok(leitura.status === 200 && Array.isArray(leitura.dados) && leitura.dados.length === 0,
    "GET /clientes/:id/visitas com id de B vem vazio", leitura.dados);

  // ── A não pode ALTERAR nada de B ───────────────────────────────────────────
  console.log("\n── A tenta alterar recursos de B ────────────────────────");
  const escritas = [
    ["PATCH", `/clientes/${cliB.id}`, { nome: "invadido" }],
    ["PATCH", `/equipe/${eqB.id}`, { nome: "invadido" }],
    ["PATCH", `/servicos/${svcB.id}`, { preco: 0 }],
    ["PATCH", `/produtos/${prodB.id}`, { quantidade: 0 }],
    ["PATCH", `/despesas/${despB.id}`, { status: "Pago" }],
    ["PATCH", `/planos/${planoB.id}`, { preco: 0 }],
    ["PATCH", `/unidades/${uniB2.id}`, { nome: "invadido" }],
    ["POST", `/clientes/${cliB.id}/codigo`, undefined],
    ["POST", `/agendamentos/${agB.id}/cancelar`, undefined],
    ["POST", `/agendamentos/${agB.id}/pagar`, undefined],
    ["POST", `/fila/${filaB.id}/atender`, { equipe_id: null }],
    ["POST", `/assinaturas/${assB.id}/pagar`, undefined],
    ["POST", `/assinaturas/${assB.id}/cancelar`, undefined],
    ["POST", `/clientes/${cliB.id}/visitas`, { servico_id: svcB.id }],
    ["POST", "/equipe", { nome: "Intruso", unidade_id: uniB.id }],
  ];
  for (const [metodo, rota, corpo] of escritas) {
    const r = await comoA(metodo, rota, corpo);
    ok(r.status === 404 || r.status === 400 || r.status === 403,
      `${metodo} ${rota.replace(/[0-9a-f-]{36}/g, ":id")} é recusado`, r);
  }

  // ── A não pode APAGAR nada de B ────────────────────────────────────────────
  console.log("\n── A tenta apagar recursos de B ─────────────────────────");
  const exclusoes = [
    ["/clientes/" + cliB.id],
    ["/equipe/" + eqB.id],
    ["/servicos/" + svcB.id],
    ["/produtos/" + prodB.id],
    ["/despesas/" + despB.id],
    ["/planos/" + planoB.id],
    ["/unidades/" + uniB2.id],
    ["/agendamentos/" + agB.id],
    ["/fila/" + filaB.id],
    [`/clientes/${cliB.id}/visitas/${visB.id}`],
  ];
  for (const [rota] of exclusoes) {
    const r = await comoA("DELETE", rota);
    ok(r.status === 404, `DELETE ${rota.replace(/[0-9a-f-]{36}/g, ":id")} é 404`, r);
  }

  // ── E o principal: os dados de B continuam intactos ────────────────────────
  console.log("\n── Depois de tudo, B continua inteiro ───────────────────");
  const depois = {
    clientes: (await comoB("GET", "/clientes")).dados,
    equipe: (await comoB("GET", "/equipe")).dados,
    servicos: (await comoB("GET", "/servicos")).dados,
    produtos: (await comoB("GET", "/produtos")).dados,
    despesas: (await comoB("GET", "/despesas")).dados,
    planos: (await comoB("GET", "/planos")).dados,
    unidades: (await comoB("GET", "/unidades")).dados.unidades,
    fila: (await comoB("GET", "/fila")).dados,
  };
  for (const [nome, lista] of Object.entries(depois)) {
    ok(Array.isArray(lista) && lista.length > 0, `${nome} de B sobreviveu`, lista?.length);
  }
  const svcDepois = depois.servicos.find(s => s.id === svcB.id);
  ok(svcDepois?.preco === 50, "preço do serviço de B não foi alterado", svcDepois?.preco);
  const cliDepois = depois.clientes.find(c => c.id === cliB.id);
  ok(cliDepois?.nome === "Cliente do B", "nome do cliente de B não foi alterado", cliDepois?.nome);
} catch (e) {
  console.error("\nErro inesperado:", e.message);
  falhas++;
} finally {
  for (const c of [A, B]) if (c?.id) await sql`delete from barbeiros where id = ${c.id}`;
  console.log(`\nContas de teste removidas. ${falhas === 0 ? "NENHUM VAZAMENTO" : `${falhas} VAZAMENTO(S)`}\n`);
  process.exit(falhas === 0 ? 0 : 1);
}
