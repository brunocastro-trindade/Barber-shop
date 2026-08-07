// ── Modo demonstração ─────────────────────────────────────────────────────────
// Implementa a MESMA interface do cliente HTTP (src/lib/api.js), mas com dados
// de exemplo guardados no localStorage — nada de servidor nem banco. Serve para
// navegar pelo sistema inteiro sem configurar nada.
//
// Ativação: botão "Ver demonstração" na landing/login, ou login com o e-mail
// de demonstração quando a API está fora do ar. Sair da conta desativa.

import { hojeISO, somarDias, segundaDaSemana, doISO } from "./formato.js";
import { BARBEARIAS, acharBarbearia } from "./barbearias.js";

const CHAVE_FLAG = "cc_demo";
const CHAVE_DADOS = "cc_demo_dados_v1";

// A barbearia "da casa" nos dados de exemplo. A área do cliente marca horário
// em várias barbearias, e esta é a que faz par com a conta do painel.
const CASA = 1;

const DEMO_EMAIL = "djhugomartis2018@gmail.com";

// [nome, preço, comissão %, duração em minutos]
const SERVICOS = [
  ["Corte masculino", 45, 40, 30],
  ["Barba completa", 35, 40, 20],
  ["Corte + Barba", 75, 45, 45],
  ["Degradê (fade)", 55, 40, 40],
  ["Luzes / Mechas", 120, 50, 60],
];
const PROS = ["Rafael Silva", "Carlos Lima", "Diego Santos"];

// Grade de horários da barbearia. Almoço entre 12h e 14h, por isso o buraco.
export const HORARIOS_ATENDIMENTO = [
  "08:00", "09:00", "10:00", "11:00",
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
];

// Só dígitos: o cliente digita do jeito que quiser e ainda casa com a ficha.
export const soDigitos = (t) => String(t || "").replace(/\D/g, "");

export function demoAtivo() {
  try { return localStorage.getItem(CHAVE_FLAG) === "1"; } catch { return false; }
}

export function ativarDemo() {
  try { localStorage.setItem(CHAVE_FLAG, "1"); } catch { /* sem storage */ }
}

export function desativarDemo() {
  try { localStorage.removeItem(CHAVE_FLAG); } catch { /* sem storage */ }
}

// ── Estado ────────────────────────────────────────────────────────────────────

let st = null;

function salvar() {
  try { localStorage.setItem(CHAVE_DADOS, JSON.stringify(st)); } catch { /* cheio */ }
}

function estado() {
  if (st) return st;
  try { st = JSON.parse(localStorage.getItem(CHAVE_DADOS) || "null"); } catch { st = null; }
  // Recria os dados quando muda a semana, para a agenda de exemplo nunca
  // parecer abandonada no passado.
  const semanaAtual = segundaDaSemana(hojeISO());
  if (!st || st.versao !== 3 || st.semana !== semanaAtual) {
    st = semear();
    salvar();
  }
  return st;
}

// Gerador pseudo-aleatório com semente fixa: a demo nasce igual em qualquer
// máquina, mas os dados parecem vivos.
function criarRnd(semente) {
  let s = semente;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

function semear() {
  const hoje = hojeISO();
  const rnd = criarRnd(42);
  const escolher = (arr) => arr[Math.floor(rnd() * arr.length)];
  let prox = 1;
  const id = () => prox++;

  const clientes = [
    { nome: "Lucas Almeida", telefone: "(11) 98811-2233", tipo: "assinante", obs: "Degradê navalhado, pente 1 nas laterais.", barbeiro_pref: "Rafael Silva" },
    { nome: "Pedro Rocha", telefone: "(11) 97744-1020", tipo: "avulso", obs: "Corte social, tesoura no topo.", barbeiro_pref: "Carlos Lima" },
    { nome: "Marcos Vieira", telefone: "(11) 96655-8899", tipo: "assinante", obs: "Barba alinhada com toalha quente.", barbeiro_pref: "Diego Santos" },
    { nome: "João Ferraz", telefone: "(11) 95522-3344", tipo: "avulso", obs: "", barbeiro_pref: "Rafael Silva" },
    { nome: "Thiago Nunes", telefone: "(11) 94433-7788", tipo: "assinante", obs: "Alérgico a pós-barba com álcool.", barbeiro_pref: "Carlos Lima" },
    { nome: "André Souza", telefone: "(11) 93322-5566", tipo: "avulso", obs: "", barbeiro_pref: "Diego Santos" },
    { nome: "Felipe Castro", telefone: "(11) 92211-4455", tipo: "avulso", obs: "Costuma atrasar uns 10 min.", barbeiro_pref: "Rafael Silva" },
    { nome: "Bruno Teixeira", telefone: "(11) 91100-6677", tipo: "assinante", obs: "Luzes a cada 2 meses.", barbeiro_pref: "Carlos Lima" },
  ].map(c => ({ id: id(), ...c }));

  // ~5 meses de atendimentos para alimentar gráficos, fichas e comissões.
  const visitas = [];
  for (let atras = 160; atras >= 0; atras--) {
    const data = somarDias(hoje, -atras);
    const diaSemana = doISO(data).getDay();
    if (diaSemana === 0) continue; // domingo fechado
    let quantos = rnd() < 0.12 ? 1 : 2 + Math.floor(rnd() * 2);
    if (diaSemana === 6) quantos += 1; // sábado cheio
    for (let i = 0; i < quantos; i++) {
      const [servico, preco] = escolher(SERVICOS);
      const cliente = escolher(clientes);
      visitas.push({
        id: id(),
        barbearia_id: CASA,
        cliente_id: cliente.id,
        cliente_nome: cliente.nome,
        servico,
        profissional: escolher(PROS),
        data,
        valor: preco,
        origem: escolher(["agenda", "fila", "manual", "agenda", "fila"]),
      });
    }
  }

  // Agenda da semana atual: manhãs pagas (passado) e tardes confirmadas.
  const segunda = segundaDaSemana(hoje);
  const agendamentos = [];
  const slots = ["09:00", "10:00", "11:00", "15:00", "16:00", "17:00"];
  for (let d = 0; d < 6; d++) {
    const data = somarDias(segunda, d);
    const quantos = 2 + Math.floor(rnd() * 3);
    const usados = new Set();
    for (let i = 0; i < quantos; i++) {
      const hora = escolher(slots);
      if (usados.has(hora)) continue;
      usados.add(hora);
      const [servico, preco] = escolher(SERVICOS);
      const cliente = escolher(clientes);
      agendamentos.push({
        id: id(),
        barbearia_id: CASA,
        cliente_id: cliente.id,
        cliente_nome: cliente.nome,
        data,
        hora,
        servico,
        profissional: escolher(PROS),
        valor: preco,
        status: data < hoje ? "Pago" : "Confirmado",
      });
    }
  }
  if (agendamentos.length) agendamentos[agendamentos.length - 1].status = "Cancelado";

  const fila = [
    { id: id(), cliente_id: clientes[1].id, nome: clientes[1].nome, servico: "Corte masculino", profissional: "Qualquer", tipo: "avulso", entrou: "09:12" },
    { id: id(), cliente_id: null, nome: "Rafinha", servico: "Degradê (fade)", profissional: "Diego Santos", tipo: "avulso", entrou: "09:31" },
  ];

  return {
    versao: 3,
    semana: segunda,
    proximoId: prox,
    usuario: {
      nome: "Hugo Martins",
      barbearia: "Barbearia do Hugo",
      email: DEMO_EMAIL,
      whatsapp: "(11) 98765-4321",
    },
    clientes, visitas, agendamentos, fila,
    // Área do cliente: quais barbearias ele favoritou e quais visitou por último.
    favoritos: [1],
    acessos: [1],
    avaliacoesFeitas: [],
  };
}

// ── Auxiliares ────────────────────────────────────────────────────────────────

const espera = (ms = 120) => new Promise(r => setTimeout(r, ms));

// Espelha o `exigirCliente` do servidor: nenhuma rota da área do cliente
// aceita um id vindo de fora, nem aqui. O 401 é o mesmo que a API real
// devolve, para a tela reagir igual nos dois modos.
function exigirCliente(s) {
  if (!s.clienteAtual) {
    const e = new Error("Não autenticado");
    e.status = 401;
    throw e;
  }
  return s.clienteAtual;
}

function novoId() {
  const s = estado();
  const id = s.proximoId++;
  return id;
}

// Cartão resumido de uma barbearia — o que a busca, os favoritos e os cartões
// de agendamento precisam mostrar, sem carregar serviços e avaliações junto.
function resumoBarbearia(b, s) {
  if (!b) return null;
  return {
    id: b.id,
    nome: b.nome,
    sigla: b.sigla,
    cor: b.cor,
    endereco: b.endereco,
    cidade: b.cidade,
    distancia: b.distancia,
    nota: b.nota,
    favorito: (s.favoritos || []).includes(b.id),
    daCasa: b.id === CASA,
  };
}

function comAgregados(c) {
  const s = estado();
  const suas = s.visitas.filter(v => v.cliente_id === c.id);
  return {
    ...c,
    visitas: suas.length,
    ultima_visita: suas.reduce((max, v) => (v.data > max ? v.data : max), "") || null,
    total_gasto: suas.reduce((soma, v) => soma + v.valor, 0),
  };
}

// ── API de demonstração (mesma interface de src/lib/api.js) ──────────────────

// ── API de demonstração — SOMENTE a área do cliente ──────────────────────────
//
// O painel do dono foi desligado da demo: ele fala só com a API real, que já
// persiste tudo no banco. O que sobrou aqui atende `api.publico.*`, porque as
// rotas /api/publico/* ainda não existem no servidor.
//
// Quando elas existirem, este arquivo inteiro sai — junto com o
// `comQuedaParaDemo` em src/lib/api.js. Ver docs/HANDOFF-BACKEND.md §3.
export const apiDemo = {
  // ── Área do cliente da barbearia ────────────────────────────────────────────
  // Quem usa é o cliente que vai cortar o cabelo, não o dono do sistema. Ele
  // não pertence a uma barbearia só: busca, favorita e marca horário em
  // qualquer uma da rede. Identificação por telefone, sem senha.
  //
  // Agendamentos feitos na barbearia do dono (id 1) caem na MESMA agenda que
  // o painel dele lê; nas outras, ficam só na área do cliente.
  publico: {
    // Lista para a aba Buscar. `modo` espelha os filtros do app: nome, cidade
    // ou proximidade (que só reordena por distância).
    barbearias: async ({ termo = "", modo = "nome" } = {}) => {
      await espera(90);
      const s = estado();
      const busca = termo.trim().toLowerCase();

      let lista = BARBEARIAS.map(b => resumoBarbearia(b, s));
      if (busca) {
        lista = lista.filter(b => (modo === "cidade" ? b.cidade : b.nome).toLowerCase().includes(busca));
      }
      return modo === "proximas"
        ? lista.sort((a, b) => a.distancia - b.distancia)
        : lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    },

    // Ficha completa de uma barbearia. Registrar o acesso alimenta o
    // "Últimos acessos" da tela inicial.
    barbearia: async (id, { registrarAcesso = false } = {}) => {
      await espera(90);
      const s = estado();
      const b = acharBarbearia(id);
      if (!b) throw new Error("Barbearia não encontrada.");

      if (registrarAcesso) {
        s.acessos = [b.id, ...(s.acessos || []).filter(x => x !== b.id)].slice(0, 8);
        salvar();
      }

      return {
        ...resumoBarbearia(b, s),
        sobre: b.sobre,
        telefone: b.telefone,
        comodidades: b.comodidades,
        expediente: b.expediente,
        grade: b.grade,
        servicos: b.servicos.map(([nome, preco, duracao]) => ({ nome, preco, duracao })),
        barbeiros: b.barbeiros,
        avaliacoes: [
          ...(s.avaliacoesFeitas || []).filter(a => a.barbearia_id === b.id),
          ...b.avaliacoes,
        ],
      };
    },

    // Tela inicial: último agendamento, favoritas e visitadas recentemente.
    inicio: async () => {
      await espera(90);
      const s = estado();
      const clienteId = exigirCliente(s);
      const hoje = hojeISO();

      const proximo = s.agendamentos
        .filter(a => a.cliente_id === clienteId && a.status === "Confirmado" && a.data >= hoje)
        .sort((a, b) => (a.data + a.hora < b.data + b.hora ? -1 : 1))[0] || null;

      const comLoja = (a) => a && { ...a, barbearia: resumoBarbearia(acharBarbearia(a.barbearia_id || CASA), s) };

      return {
        proximo: comLoja(proximo),
        favoritos: (s.favoritos || []).map(id => resumoBarbearia(acharBarbearia(id), s)).filter(Boolean),
        recentes: (s.acessos || []).map(id => resumoBarbearia(acharBarbearia(id), s)).filter(Boolean),
      };
    },

    favoritar: async (barbeariaId) => {
      await espera(70);
      const s = estado();
      exigirCliente(s);
      const id = Number(barbeariaId);
      const favs = s.favoritos || [];
      s.favoritos = favs.includes(id) ? favs.filter(x => x !== id) : [id, ...favs];
      salvar();
      return { favorito: s.favoritos.includes(id) };
    },

    // Acha a ficha pelo telefone e guarda quem entrou.
    //
    // A sessão real é um cookie assinado pelo servidor; aqui, sem servidor, o
    // id do cliente ativo fica no estado local — é o que permite os métodos
    // `eu*` funcionarem sem receber id por parâmetro, como no contrato real.
    //
    // O código de acesso é exigido para o fluxo da tela ser idêntico, mas
    // qualquer valor serve: este módulo só roda quando a API está fora do ar e
    // opera sobre dados fictícios, sem nada de ninguém para proteger.
    identificar: async ({ telefone, codigo }) => {
      await espera();
      const s = estado();
      const digitos = soDigitos(telefone);
      if (digitos.length < 10) throw new Error("Digite seu WhatsApp com DDD.");
      if (!String(codigo || "").trim()) throw new Error("Informe o código de acesso.");

      const existente = s.clientes.find(c => soDigitos(c.telefone) === digitos);
      if (existente) {
        s.clienteAtual = existente.id;
        salvar();
        return { ...comAgregados(existente), novo: false };
      }

      // Sem auto-cadastro, igual ao servidor: quem cria a ficha do cliente é o
      // barbeiro, no painel.
      throw new Error("Telefone ou código incorretos. Peça o código na sua barbearia.");
    },

    eu: async () => {
      await espera(40);
      const s = estado();
      const c = s.clientes.find(x => x.id === s.clienteAtual);
      if (!c) {
        const e = new Error("Não autenticado");
        e.status = 401;
        throw e;
      }
      return { id: c.id, nome: c.nome, tipo: c.tipo };
    },

    sair: async () => {
      const s = estado();
      s.clienteAtual = null;
      salvar();
      return { ok: true };
    },

    // Horários do dia numa barbearia, já marcando o que está ocupado. Com um
    // barbeiro escolhido, só os horários dele contam.
    horariosDoDia: async (barbeariaId, data, profissional) => {
      await espera(90);
      const s = estado();
      const loja = acharBarbearia(barbeariaId);
      if (!loja) throw new Error("Barbearia não encontrada.");

      const agora = new Date();
      const hoje = hojeISO();
      const naLoja = s.agendamentos.filter(
        a => (a.barbearia_id || CASA) === loja.id && a.data === data && a.status !== "Cancelado"
      );
      const equipe = loja.barbeiros.map(b => b.nome);

      return loja.grade.map(hora => {
        const passou = data === hoje && Number(hora.slice(0, 2)) <= agora.getHours();
        const noSlot = naLoja.filter(a => a.hora === hora);
        // Sem barbeiro escolhido, o horário só fecha quando todos estão presos.
        const cheio = (!profissional || profissional === "Qualquer")
          ? noSlot.length >= equipe.length
          : noSlot.some(a => a.profissional === profissional);
        return { hora, livre: !passou && !cheio };
      });
    },

    agendar: async ({ barbearia_id, servico, profissional, data, hora }) => {
      await espera();
      const s = estado();
      const cliente = s.clientes.find(c => c.id === exigirCliente(s));
      if (!cliente) throw new Error("Sessão expirada. Entre de novo.");

      const loja = acharBarbearia(barbearia_id);
      if (!loja) throw new Error("Barbearia não encontrada.");

      const svc = loja.servicos.find(x => x[0] === servico);
      if (!svc) throw new Error("Selecione um serviço.");
      if (!data || !hora) throw new Error("Escolha o dia e o horário.");

      const jaTem = s.agendamentos.some(
        a => a.cliente_id === cliente.id && a.data === data && a.status === "Confirmado"
      );
      if (jaTem) throw new Error("Você já tem um horário marcado neste dia.");

      const equipe = loja.barbeiros.map(b => b.nome);
      const presos = s.agendamentos
        .filter(a => (a.barbearia_id || CASA) === loja.id && a.data === data && a.hora === hora && a.status !== "Cancelado")
        .map(a => a.profissional);

      // Sem barbeiro escolhido, pega o primeiro que estiver livre no horário.
      let quem = profissional;
      if (!quem || quem === "Qualquer") {
        quem = equipe.find(p => !presos.includes(p));
        if (!quem) throw new Error("Esse horário acabou de ser preenchido. Escolha outro.");
      } else if (presos.includes(quem)) {
        throw new Error("Esse horário acabou de ser preenchido. Escolha outro.");
      }

      const novo = {
        id: novoId(),
        barbearia_id: loja.id,
        cliente_id: cliente.id,
        cliente_nome: cliente.nome,
        data, hora,
        servico,
        profissional: quem,
        valor: svc[1],
        status: "Confirmado",
      };
      s.agendamentos.push(novo);
      s.acessos = [loja.id, ...(s.acessos || []).filter(x => x !== loja.id)].slice(0, 8);
      salvar();
      return { ...novo, barbearia: resumoBarbearia(loja, s) };
    },

    // Aba Agendamentos: próximos e passados, de todas as barbearias.
    meusHorarios: async ({ barbeariaId } = {}) => {
      await espera();
      const s = estado();
      const clienteId = exigirCliente(s);
      const hoje = hojeISO();
      const cliente = s.clientes.find(c => c.id === clienteId);
      const doFiltro = (r) => !barbeariaId || (r.barbearia_id || CASA) === Number(barbeariaId);
      const comLoja = (r) => ({ ...r, barbearia: resumoBarbearia(acharBarbearia(r.barbearia_id || CASA), s) });

      const meus = s.agendamentos.filter(a => a.cliente_id === clienteId && doFiltro(a));

      const proximos = meus
        .filter(a => a.status === "Confirmado" && a.data >= hoje)
        .sort((a, b) => (a.data + a.hora < b.data + b.hora ? -1 : 1))
        .map(comLoja);

      const passados = meus
        .filter(a => a.status !== "Confirmado" || a.data < hoje)
        .sort((a, b) => (a.data + a.hora < b.data + b.hora ? 1 : -1))
        .slice(0, 20)
        .map(comLoja);

      const historico = s.visitas
        .filter(v => v.cliente_id === clienteId && doFiltro(v))
        .sort((a, b) => (a.data === b.data ? b.id - a.id : a.data < b.data ? 1 : -1))
        .slice(0, 20)
        .map(comLoja);

      // Barbeiro favorito = quem mais atendeu esse cliente.
      const todas = s.visitas.filter(v => v.cliente_id === clienteId && doFiltro(v));
      const porBarbeiro = {};
      todas.forEach(v => { porBarbeiro[v.profissional] = (porBarbeiro[v.profissional] || 0) + 1; });
      const favorito = Object.entries(porBarbeiro).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

      return {
        proximos, passados, historico,
        resumo: {
          visitas: todas.length,
          totalGasto: todas.reduce((soma, v) => soma + v.valor, 0),
          favorito,
          tipo: cliente?.tipo || "avulso",
        },
      };
    },

    cancelar: async (id) => {
      await espera();
      const s = estado();
      const clienteId = exigirCliente(s);
      const a = s.agendamentos.find(x => x.id === id && x.cliente_id === clienteId);
      if (!a) throw new Error("Horário não encontrado.");
      a.status = "Cancelado";
      salvar();
      return { ok: true };
    },

    // Fidelidade: 1 ponto por real gasto na barbearia. Simples de explicar no
    // balcão e suficiente para a tela ter o que mostrar.
    fidelidade: async (barbeariaId) => {
      await espera(80);
      const s = estado();
      const clienteId = exigirCliente(s);
      const id = Number(barbeariaId);
      const minhas = s.visitas.filter(v => v.cliente_id === clienteId && (v.barbearia_id || CASA) === id);
      const pontos = Math.round(minhas.reduce((soma, v) => soma + v.valor, 0));

      const premios = [
        { nome: "Pezinho grátis", custo: 300 },
        { nome: "Barba completa grátis", custo: 700 },
        { nome: "Corte + Barba grátis", custo: 1500 },
      ].map(p => ({ ...p, liberado: pontos >= p.custo }));

      return { pontos, visitas: minhas.length, premios };
    },

    avaliar: async (barbeariaId, { nota, texto }) => {
      await espera();
      const s = estado();
      const clienteId = exigirCliente(s);
      const cliente = s.clientes.find(c => c.id === clienteId);
      if (!cliente) throw new Error("Sessão expirada.");
      if (!nota) throw new Error("Escolha de 1 a 5 estrelas.");

      s.avaliacoesFeitas = [
        { barbearia_id: Number(barbeariaId), nome: cliente.nome, data: hojeISO(), nota, texto: (texto || "").trim(), minha: true },
        ...(s.avaliacoesFeitas || []).filter(a => !(a.barbearia_id === Number(barbeariaId) && a.nome === cliente.nome)),
      ];
      salvar();
      return { ok: true };
    },
  },
};
