// Catálogo de barbearias que usam o ControlCRM.
//
// O cliente final não pertence a uma barbearia só: ele busca, favorita e marca
// horário em qualquer uma da rede — como num app de agendamento de verdade.
// A de id 1 é a do dono que está logado no painel; as outras existem para a
// busca ter o que mostrar.

// [nome, preço, duração em minutos]
const CORTES_CLASSICOS = [
  ["Corte masculino", 45, 30],
  ["Barba completa", 35, 20],
  ["Corte + Barba", 75, 45],
  ["Degradê (fade)", 55, 40],
  ["Luzes / Mechas", 120, 60],
];

const GRADE_PADRAO = [
  "08:00", "09:00", "10:00", "11:00",
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
];

const GRADE_TARDE = [
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00",
];

export const COMODIDADES = {
  wifi: "Wi‑Fi grátis",
  estacionamento: "Estacionamento",
  acessibilidade: "Acesso para cadeirantes",
  cafe: "Café e água cortesia",
  cartao: "Aceita cartão e PIX",
  tv: "TV e videogame",
};

export const BARBEARIAS = [
  {
    id: 1,
    nome: "Barbearia do Hugo",
    sigla: "BH",
    cor: "#8B5CF6",
    endereco: "Rua das Tesouras, 120 — Centro",
    cidade: "Itajaí/SC",
    distancia: 550,
    nota: 5.0,
    telefone: "(11) 98765-4321",
    sobre: "Barbearia clássica com atendimento moderno. Corte, barba e cuidado com o visual masculino desde 2019.",
    comodidades: ["wifi", "cartao", "cafe", "tv"],
    grade: GRADE_PADRAO,
    expediente: [
      ["Segunda-feira", "13:00 - 20:00"],
      ["Terça-feira", "09:00 - 20:00"],
      ["Quarta-feira", "09:00 - 20:00"],
      ["Quinta-feira", "09:00 - 20:00"],
      ["Sexta-feira", "09:00 - 20:00"],
      ["Sábado", "08:00 - 16:00"],
      ["Domingo", "Fechado"],
    ],
    servicos: CORTES_CLASSICOS,
    barbeiros: [
      { nome: "Rafael Silva", cargo: "Barbeiro sênior", nota: 5.0 },
      { nome: "Carlos Lima", cargo: "Barbeiro", nota: 4.9 },
      { nome: "Diego Santos", cargo: "Barbeiro e visagista", nota: 5.0 },
    ],
    avaliacoes: [
      { nome: "João Jeziorny", data: "2026-05-23", nota: 5, texto: "" },
      { nome: "Vinicius Capistrano", data: "2026-06-07", nota: 5, texto: "Melhor degradê da cidade." },
      { nome: "Pedro P. S. Fernandes", data: "2026-02-27", nota: 5, texto: "Recomendo demais!" },
      { nome: "Filipe Renato Garbari", data: "2026-02-25", nota: 5, texto: "" },
    ],
  },
  {
    id: 2,
    nome: "Barbearia Mandamento",
    sigla: "BM",
    cor: "#0EA5E9",
    endereco: "Rua José Francisco Bernardes, 149 — Centro",
    cidade: "Camboriú/SC",
    distancia: 550,
    nota: 4.0,
    telefone: "(47) 3344-1122",
    sobre: "Ambiente descontraído, música boa e corte no capricho.",
    comodidades: ["wifi", "cartao", "estacionamento"],
    grade: GRADE_PADRAO,
    expediente: [
      ["Segunda-feira", "Fechado"],
      ["Terça-feira", "09:00 - 19:00"],
      ["Quarta-feira", "09:00 - 19:00"],
      ["Quinta-feira", "09:00 - 19:00"],
      ["Sexta-feira", "09:00 - 20:00"],
      ["Sábado", "08:00 - 17:00"],
      ["Domingo", "Fechado"],
    ],
    servicos: [
      ["Barba tradicional", 40, 30],
      ["Cera (nariz/orelha)", 20, 20],
      ["Corte infantil", 50, 30],
      ["Corte social & Barba", 80, 60],
      ["Degradê", 50, 40],
    ],
    barbeiros: [
      { nome: "Luiz Fontes", cargo: "Barbeiro", nota: 4.8 },
      { nome: "Moises Prado", cargo: "Barbeiro", nota: 4.9 },
    ],
    avaliacoes: [
      { nome: "Anderson Reis", data: "2026-07-14", nota: 4, texto: "Bom atendimento, só demorou um pouco." },
      { nome: "Caio Menezes", data: "2026-06-30", nota: 5, texto: "" },
    ],
  },
  {
    id: 3,
    nome: "Engenharia da Barba",
    sigla: "EB",
    cor: "#F59E0B",
    endereco: "Rua São Paulo, 861 — Santa Regina",
    cidade: "Camboriú/SC",
    distancia: 720,
    nota: 5.0,
    telefone: "(47) 3355-9090",
    sobre: "Especialistas em barba: toalha quente, navalha e finalização completa.",
    comodidades: ["wifi", "cartao", "cafe", "acessibilidade"],
    grade: GRADE_TARDE,
    expediente: [
      ["Segunda-feira", "13:00 - 21:00"],
      ["Terça-feira", "13:00 - 21:00"],
      ["Quarta-feira", "13:00 - 21:00"],
      ["Quinta-feira", "13:00 - 21:00"],
      ["Sexta-feira", "13:00 - 21:00"],
      ["Sábado", "10:00 - 18:00"],
      ["Domingo", "Fechado"],
    ],
    servicos: [
      ["Barba na navalha", 55, 40],
      ["Corte + Barba premium", 110, 70],
      ["Hidratação de barba", 45, 30],
      ["Corte masculino", 50, 30],
    ],
    barbeiros: [
      { nome: "Marcelo Dias", cargo: "Barbeiro-chefe", nota: 5.0 },
      { nome: "Igor Nascimento", cargo: "Barbeiro", nota: 5.0 },
    ],
    avaliacoes: [
      { nome: "Rodrigo Salles", data: "2026-07-02", nota: 5, texto: "A barba mais bem feita que já fizeram em mim." },
      { nome: "Tiago Barros", data: "2026-05-19", nota: 5, texto: "" },
    ],
  },
  {
    id: 4,
    nome: "Barbearia Cabral",
    sigla: "BC",
    cor: "#22C55E",
    endereco: "Rua Roma, 301 — Santa Regina",
    cidade: "Camboriú/SC",
    distancia: 750,
    nota: 5.0,
    telefone: "(47) 3366-4433",
    sobre: "Tradição de família há três gerações.",
    comodidades: ["cartao", "estacionamento", "tv"],
    grade: GRADE_PADRAO,
    expediente: [
      ["Segunda-feira", "09:00 - 19:00"],
      ["Terça-feira", "09:00 - 19:00"],
      ["Quarta-feira", "09:00 - 19:00"],
      ["Quinta-feira", "09:00 - 19:00"],
      ["Sexta-feira", "09:00 - 20:00"],
      ["Sábado", "08:00 - 16:00"],
      ["Domingo", "Fechado"],
    ],
    servicos: [
      ["Corte na tesoura", 60, 45],
      ["Corte máquina", 35, 20],
      ["Barba", 35, 25],
      ["Pezinho", 20, 15],
    ],
    barbeiros: [
      { nome: "Antônio Cabral", cargo: "Mestre barbeiro", nota: 5.0 },
      { nome: "Juliano Cabral", cargo: "Barbeiro", nota: 4.9 },
    ],
    avaliacoes: [
      { nome: "Marcos Aurélio", data: "2026-06-11", nota: 5, texto: "Corte na tesoura impecável." },
    ],
  },
  {
    id: 5,
    nome: "10 e Faixa Barbearia",
    sigla: "10",
    cor: "#EF4444",
    endereco: "Rua Siqueira Campos, 608 — Centro",
    cidade: "Camboriú/SC",
    distancia: 980,
    nota: 4.8,
    telefone: "(47) 3377-1010",
    sobre: "Barbearia com clima de vestiário: futebol na TV e corte rápido.",
    comodidades: ["wifi", "tv", "cartao"],
    grade: GRADE_PADRAO,
    expediente: [
      ["Segunda-feira", "10:00 - 20:00"],
      ["Terça-feira", "10:00 - 20:00"],
      ["Quarta-feira", "10:00 - 20:00"],
      ["Quinta-feira", "10:00 - 20:00"],
      ["Sexta-feira", "10:00 - 21:00"],
      ["Sábado", "09:00 - 18:00"],
      ["Domingo", "Fechado"],
    ],
    servicos: [
      ["Corte na régua", 45, 35],
      ["Corte + Barba", 70, 55],
      ["Sobrancelha", 15, 10],
      ["Platinado", 150, 90],
    ],
    barbeiros: [
      { nome: "Wesley Rocha", cargo: "Barbeiro", nota: 4.8 },
      { nome: "Bruno Tavares", cargo: "Barbeiro", nota: 4.7 },
    ],
    avaliacoes: [
      { nome: "Léo Martins", data: "2026-07-20", nota: 5, texto: "Rápido e caprichado." },
      { nome: "Vitor Hugo", data: "2026-04-08", nota: 4, texto: "" },
    ],
  },
];

export const acharBarbearia = (id) => BARBEARIAS.find(b => b.id === Number(id)) || null;
