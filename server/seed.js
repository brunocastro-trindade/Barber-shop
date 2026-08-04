import { sql } from "./db.js";

// Dados de demonstração criados junto com a conta, para o painel não abrir vazio.
// Desligue com SEED_DEMO_DATA=false no .env.local — contas novas nascem limpas.

const CLIENTES = [
  { nome: "João Mendes",  telefone: "(11) 99800-7777", tipo: "assinante", obs: "Gosta do franjão. Não corta muito curto nos lados.", pref: "Rafael Silva" },
  { nome: "Bruno Costa",  telefone: "(11) 99911-7666", tipo: "assinante", obs: "", pref: "Carlos Lima" },
  { nome: "Pedro Alves",  telefone: "(11) 90022-7555", tipo: "avulso",    obs: "Prefere máquina 2 nas laterais.", pref: "Diego Santos" },
  { nome: "Ricardo Lima", telefone: "(11) 90133-7444", tipo: "avulso",    obs: "", pref: "Rafael Silva" },
];

// [índice do cliente, dias atrás, serviço, barbeiro, valor]
const VISITAS = [
  [0,  1, "Corte + Barba",    "Rafael", 75],
  [1,  1, "Corte masculino",  "Carlos", 45],
  [2,  2, "Degradê (fade)",   "Diego",  55],
  [0,  3, "Barba completa",   "Rafael", 35],
  [3,  3, "Corte masculino",  "Rafael", 45],
  [1,  4, "Corte + Barba",    "Carlos", 75],
  [2,  5, "Corte masculino",  "Diego",  45],
  [0,  6, "Corte masculino",  "Rafael", 45],
  [1,  6, "Luzes / Mechas",   "Carlos", 120],
  [3,  8, "Degradê (fade)",   "Diego",  55],
  [0, 10, "Corte + Barba",    "Rafael", 75],
  [2, 12, "Corte masculino",  "Diego",  45],
  [1, 14, "Barba completa",   "Carlos", 35],
  [0, 17, "Corte masculino",  "Rafael", 45],
  [3, 19, "Corte + Barba",    "Rafael", 75],
  [1, 22, "Corte masculino",  "Carlos", 45],
  [0, 24, "Degradê (fade)",   "Rafael", 55],
  [2, 27, "Corte masculino",  "Diego",  45],
];

// [índice do cliente, dias à frente, hora, serviço, barbeiro, valor]
const AGENDAMENTOS = [
  [0, 0, "09:00", "Corte + Barba",   "Rafael Silva", 75],
  [1, 0, "11:00", "Corte masculino", "Carlos Lima",  45],
  [2, 1, "10:00", "Degradê (fade)",  "Diego Santos", 55],
  [3, 2, "15:00", "Barba completa",  "Rafael Silva", 35],
];

const dataRelativa = (dias) =>
  new Date(Date.now() + dias * 86_400_000).toISOString().slice(0, 10);

export async function criarDadosDemo(barbeiroId) {
  const ids = [];
  for (const c of CLIENTES) {
    const [novo] = await sql`
      insert into clientes (barbeiro_id, nome, telefone, tipo, obs, barbeiro_pref)
      values (${barbeiroId}, ${c.nome}, ${c.telefone}, ${c.tipo}, ${c.obs}, ${c.pref})
      returning id
    `;
    ids.push(novo.id);
  }

  for (const [idx, dias, servico, profissional, valor] of VISITAS) {
    await sql`
      insert into visitas (barbeiro_id, cliente_id, cliente_nome, data, servico, profissional, valor, origem)
      values (${barbeiroId}, ${ids[idx]}, ${CLIENTES[idx].nome}, ${dataRelativa(-dias)},
              ${servico}, ${profissional}, ${valor}, 'manual')
    `;
  }

  for (const [idx, dias, hora, servico, profissional, valor] of AGENDAMENTOS) {
    await sql`
      insert into agendamentos (barbeiro_id, cliente_id, cliente_nome, data, hora, servico, profissional, valor, status)
      values (${barbeiroId}, ${ids[idx]}, ${CLIENTES[idx].nome}, ${dataRelativa(dias)},
              ${hora}, ${servico}, ${profissional}, ${valor}, 'Confirmado')
    `;
  }
}
